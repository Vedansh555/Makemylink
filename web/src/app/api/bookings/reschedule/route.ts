import { NextResponse } from "next/server";
import { all, one, run } from "@/lib/db";
import { pageByHandle } from "@/lib/account";
import { slotsForDay } from "@/lib/booking";
import { clientIp, rateLimit, sameOriginOnly } from "@/lib/security";
import { esc, sendMail } from "@/lib/mail";
import { rescheduleOk, sendBookingConfirmed } from "@/lib/bookingMail";

// GET ?id=&k=: the booking being moved (for the banner on the booking page).
export async function GET(req: Request) {
  const u = new URL(req.url);
  const id = u.searchParams.get("id") ?? "";
  if (!rescheduleOk(id, u.searchParams.get("k") ?? "")) return NextResponse.json({ error: "This link is not valid" }, { status: 403 });
  const row = await one<{ slot_start: number; status: string }>("SELECT slot_start, status FROM bookings WHERE id = $1", [id]);
  if (!row || row.status === "cancelled") return NextResponse.json({ error: "This booking was cancelled" }, { status: 404 });
  return NextResponse.json({ slot: row.slot_start, status: row.status });
}

// POST {id, k, slot}: the buyer picks a new time from the link in their email. Allowed until 2 hours before the old time.
export async function POST(req: Request) {
  const blocked = sameOriginOnly(req) ?? rateLimit(`resched:${clientIp(req)}`, 10, 60 * 60 * 1000);
  if (blocked) return blocked;
  const b = (await req.json().catch(() => ({}))) as { id?: string; k?: string; slot?: number };
  const id = String(b.id ?? "");
  if (!rescheduleOk(id, String(b.k ?? "")) || typeof b.slot !== "number") return NextResponse.json({ error: "This link is not valid" }, { status: 403 });

  const row = await one<{ page_id: string; link_id: string; buyer_name: string; buyer_email: string; slot_start: number; status: string; handle: string; user_id: string }>(
    "SELECT b.page_id, b.link_id, b.buyer_name, b.buyer_email, b.slot_start, b.status, p.handle, p.user_id FROM bookings b JOIN pages p ON p.id = b.page_id WHERE b.id = $1",
    [id],
  );
  if (!row || row.status === "cancelled") return NextResponse.json({ error: "This booking was cancelled" }, { status: 404 });
  if (row.slot_start - Date.now() < 2 * 3_600_000) return NextResponse.json({ error: "It's too close to the session to change it here. Please contact the host." }, { status: 409 });
  const page = await pageByHandle(row.handle);
  const link = page?.profile.links.find((l) => l.id === row.link_id);
  if (!page || !link?.booking) return NextResponse.json({ error: "This session is no longer offered" }, { status: 404 });
  const cfg = link.booking;

  const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: cfg.timeZone }).format(new Date(b.slot));
  const taken = await all<{ slot_start: number }>("SELECT slot_start FROM bookings WHERE page_id = $1 AND link_id = $2 AND status <> 'cancelled' AND id <> $3", [row.page_id, row.link_id, id]);
  if (!slotsForDay(cfg, ymd, taken.map((t) => t.slot_start)).includes(b.slot)) return NextResponse.json({ error: "That time was just taken. Pick another." }, { status: 409 });

  await run("UPDATE bookings SET slot_start = $1, reminded_24 = FALSE, reminded_1 = FALSE WHERE id = $2", [b.slot, id]);
  const fmt = (ms: number) => new Intl.DateTimeFormat("en-IN", { dateStyle: "full", timeStyle: "short", timeZone: cfg.timeZone }).format(new Date(ms));
  if (row.status === "confirmed") await sendBookingConfirmed({ id, buyerName: row.buyer_name, buyerEmail: row.buyer_email, slot: b.slot, handle: row.handle, hostName: page.profile.name, link }, "rescheduled");
  const owner = await one<{ email: string }>("SELECT email FROM users WHERE id = $1", [row.user_id]);
  if (owner) await sendMail(owner.email, `Rescheduled: ${esc(row.buyer_name)}`, `<p>${esc(row.buyer_name)} moved <b>${esc(link.title)}</b> from ${esc(fmt(row.slot_start))} to <b>${esc(fmt(b.slot))}</b> (${esc(cfg.timeZone)}).</p>`);
  return NextResponse.json({ ok: true, status: row.status, meetingUrl: row.status === "confirmed" ? cfg.meetingUrl : undefined });
}
