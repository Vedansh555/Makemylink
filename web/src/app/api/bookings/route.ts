import { NextResponse } from "next/server";
import crypto from "crypto";
import { all, one, run } from "@/lib/db";
import { pageByHandle } from "@/lib/account";
import { slotsForDay } from "@/lib/booking";
import { clientIp, rateLimit, sameOriginOnly } from "@/lib/security";
import { esc, sendMail } from "@/lib/mail";
import { getSession } from "@/lib/session";
import { HOLD_MS, createOrder, credsForUser } from "@/lib/gateway";

/** An online checkout nobody finished lets go of its time slot after a while. */
const releaseOldHolds = (pageId: string) => run("UPDATE bookings SET status = 'cancelled' WHERE page_id = $1 AND provider = 'razorpay' AND status = 'awaiting_payment' AND created_at < $2", [pageId, Date.now() - HOLD_MS]);

async function findConfig(handle: string, linkId: string) {
  const page = await pageByHandle(handle);
  if (!page || page.plan !== "pro") return null;
  const link = page.profile.links.find((l) => l.id === linkId && l.kind === "booking" && l.booking);
  return link?.booking ? { page, link, cfg: link.booking } : null;
}

// GET /api/bookings?handle=&linkId=&date=YYYY-MM-DD — open slots for a day
export async function GET(req: Request) {
  const u = new URL(req.url);
  const found = await findConfig(u.searchParams.get("handle") ?? "", u.searchParams.get("linkId") ?? "");
  if (!found) return NextResponse.json({ slots: [] });
  await releaseOldHolds(found.page.id);
  const month = u.searchParams.get("month") ?? "";
  if (/^\d{4}-\d{2}$/.test(month)) {
    // For the calendar: how many times are free and how many exist on each day of the month.
    const rows = await all<{ slot_start: number }>(
      "SELECT slot_start FROM bookings WHERE page_id = $1 AND link_id = $2 AND status <> 'cancelled' AND slot_start > $3 AND slot_start < $4",
      [found.page.id, found.link.id, Date.now() - 86_400_000, Date.now() + 120 * 86_400_000],
    );
    const taken = rows.map((r) => r.slot_start);
    const [y, m] = month.split("-").map(Number) as [number, number];
    const days: Record<string, { free: number; total: number }> = {};
    for (let d = 1; d <= new Date(y, m, 0).getDate(); d++) {
      const k = `${month}-${String(d).padStart(2, "0")}`;
      const total = slotsForDay(found.cfg, k, []).length;
      if (total) days[k] = { free: slotsForDay(found.cfg, k, taken).length, total };
    }
    return NextResponse.json({ days });
  }
  const date = u.searchParams.get("date") ?? "";
  // Look at a window around the day so a slot taken near midnight (in another zone) still blocks.
  const rows = await all<{ slot_start: number }>(
    "SELECT slot_start FROM bookings WHERE page_id = $1 AND link_id = $2 AND status <> 'cancelled' AND slot_start > $3 AND slot_start < $4",
    [found.page.id, found.link.id, Date.now() - 86_400_000, Date.now() + 90 * 86_400_000],
  );
  return NextResponse.json({ slots: slotsForDay(found.cfg, date, rows.map((r) => r.slot_start)), all: slotsForDay(found.cfg, date, []), durationMin: found.cfg.durationMin, timeZone: found.cfg.timeZone });
}

// POST /api/bookings {handle, linkId, slot, name, email, note}
export async function POST(req: Request) {
  const blocked = sameOriginOnly(req) ?? rateLimit(`book:${clientIp(req)}`, 10, 60 * 60 * 1000);
  if (blocked) return blocked;
  const b = (await req.json().catch(() => ({}))) as { handle?: string; linkId?: string; slot?: number; name?: string; email?: string; note?: string; consent?: boolean };
  if (b.consent !== true) return NextResponse.json({ error: "Please tick the box to agree to share your details" }, { status: 400 });
  const email = String(b.email ?? "").toLowerCase().trim();
  const name = String(b.name ?? "").trim().slice(0, 80);
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof b.slot !== "number") {
    return NextResponse.json({ error: "Name, email and a time are required" }, { status: 400 });
  }
  const found = await findConfig(b.handle ?? "", b.linkId ?? "");
  if (!found) return NextResponse.json({ error: "This session is not available" }, { status: 404 });
  const { page, link, cfg } = found;
  await releaseOldHolds(page.id);

  // The slot must be one the server would have offered (right day, hour, free).
  const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: cfg.timeZone }).format(new Date(b.slot));
  const taken = await all<{ slot_start: number }>("SELECT slot_start FROM bookings WHERE page_id = $1 AND link_id = $2 AND status <> 'cancelled'", [page.id, link.id]);
  if (!slotsForDay(cfg, ymd, taken.map((t) => t.slot_start)).includes(b.slot)) {
    return NextResponse.json({ error: "That time was just taken. Pick another." }, { status: 409 });
  }

  const id = crypto.randomUUID();
  const free = cfg.price === 0;
  await run("INSERT INTO bookings (id, page_id, link_id, buyer_name, buyer_email, slot_start, note, amount, currency, status, created_at, consented_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$11)", [
    id, page.id, link.id, name, email, b.slot, String(b.note ?? "").slice(0, 500), cfg.price, cfg.currency, free ? "confirmed" : "awaiting_payment", Date.now(),
  ]);

  const when = new Intl.DateTimeFormat("en-IN", { dateStyle: "full", timeStyle: "short", timeZone: cfg.timeZone }).format(new Date(b.slot));
  const owner = await one<{ email: string }>("SELECT email FROM users WHERE id = $1", [page.user_id]);
  if (owner) await sendMail(owner.email, `New booking request: ${esc(name)}`, `<p>${esc(name)} (${esc(email)}) booked <b>${esc(link.title)}</b> on ${esc(when)} (${esc(cfg.timeZone)}).</p>${free ? "" : "<p>Mark it paid in your dashboard once the money arrives.</p>"}`);
  if (free) await sendMail(email, `Confirmed: ${link.title}`, `<p>You are booked for <b>${esc(link.title)}</b> on ${esc(when)}.</p><p>Join here: <a href="${esc(cfg.meetingUrl)}">${esc(cfg.meetingUrl)}</a></p>`);

  // Offer every way the creator set up: UPI for Indian buyers, a payment link (cards) for everyone else.
  const pays: ({ kind: "razorpay"; keyId: string; orderId: string; amount: number; bookingId: string } | { kind: "upi"; upiId: string; link: string } | { kind: "link"; link: string })[] = [];
  if (!free) {
    // If the creator connected their own Razorpay, the buyer can pay on the spot and the booking confirms itself.
    const creds = cfg.currency === "INR" ? await credsForUser(page.user_id) : null;
    if (creds) {
      try {
        const order = await createOrder(creds, cfg.price, id, { booking_id: id, page_id: page.id });
        await run("UPDATE bookings SET provider = 'razorpay', provider_ref = $1 WHERE id = $2", [order.id, id]);
        pays.push({ kind: "razorpay", keyId: creds.keyId, orderId: order.id, amount: order.amount, bookingId: id });
      } catch (e) {
        console.error("creator razorpay order", e);
      }
    }
    if (cfg.upiId && cfg.currency === "INR") pays.push({ kind: "upi", upiId: cfg.upiId, link: `upi://pay?pa=${encodeURIComponent(cfg.upiId)}&pn=${encodeURIComponent(page.profile.name)}&am=${cfg.price}&cu=INR&tn=${encodeURIComponent(link.title)}` });
    if (cfg.paymentUrl) pays.push({ kind: "link", link: cfg.paymentUrl });
  }
  return NextResponse.json({ ok: true, id, status: free ? "confirmed" : "awaiting_payment", meetingUrl: free ? cfg.meetingUrl : undefined, pays });
}

// PATCH /api/bookings {id, status} — the page owner marks a booking paid/confirmed or cancelled.
export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const blocked = sameOriginOnly(req);
  if (blocked) return blocked;
  const { id, status } = (await req.json().catch(() => ({}))) as { id?: string; status?: string };
  if (!id || (status !== "confirmed" && status !== "cancelled")) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  const row = await one<{ buyer_email: string; slot_start: number; link_id: string; handle: string; status: string }>(
    `SELECT b.buyer_email, b.slot_start, b.link_id, b.status, p.handle FROM bookings b JOIN pages p ON p.id = b.page_id WHERE b.id = $1 AND p.user_id = $2`,
    [id, session.userId],
  );
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await run("UPDATE bookings SET status = $1 WHERE id = $2", [status, id]);
  if (status === "confirmed" && row.status !== "confirmed") {
    const page = await pageByHandle(row.handle);
    const link = page?.profile.links.find((l) => l.id === row.link_id);
    if (link?.booking) {
      const when = new Intl.DateTimeFormat("en-IN", { dateStyle: "full", timeStyle: "short", timeZone: link.booking.timeZone }).format(new Date(row.slot_start));
      await sendMail(row.buyer_email, `Confirmed: ${link.title}`, `<p>Payment received. You are booked for <b>${esc(link.title)}</b> on ${esc(when)}.</p><p>Join here: <a href="${esc(link.booking.meetingUrl)}">${esc(link.booking.meetingUrl)}</a></p>`);
    }
  }
  return NextResponse.json({ ok: true });
}
