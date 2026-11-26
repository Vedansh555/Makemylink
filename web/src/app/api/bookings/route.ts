import { NextResponse } from "next/server";
import crypto from "crypto";
import { all, one, run } from "@/lib/db";
import { pageByHandle } from "@/lib/account";
import { slotsForDay } from "@/lib/booking";
import { clientIp, rateLimit, sameOriginOnly } from "@/lib/security";
import { esc, sendMail } from "@/lib/mail";
import { getSession } from "@/lib/session";
import { createOrder, credsForUser, paypalCreate, paypalCredsForUser } from "@/lib/gateway";
import { settleHolds } from "@/lib/bookingPaid";
import { payLinkHost } from "@/lib/payLink";
import { SITE_URL } from "@/lib/site";
import { sendBookingConfirmed } from "@/lib/bookingMail";
import { rewardReferral } from "@/lib/referral";


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
  await settleHolds(found.page.id);
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
  await settleHolds(page.id);

  // The slot must be one the server would have offered (right day, hour, free).
  const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: cfg.timeZone }).format(new Date(b.slot));
  const taken = await all<{ slot_start: number }>("SELECT slot_start FROM bookings WHERE page_id = $1 AND link_id = $2 AND status <> 'cancelled'", [page.id, link.id]);
  if (!slotsForDay(cfg, ymd, taken.map((t) => t.slot_start)).includes(b.slot)) {
    return NextResponse.json({ error: "That time was just taken. Pick another." }, { status: 409 });
  }

  const id = crypto.randomUUID();
  const free = cfg.price === 0;
  await run("INSERT INTO bookings (id, page_id, link_id, buyer_name, buyer_email, slot_start, note, amount, currency, status, created_at, consented_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)", [
    id, page.id, link.id, name, email, b.slot, String(b.note ?? "").slice(0, 500), cfg.price, cfg.currency, free ? "confirmed" : "awaiting_payment", Date.now(), Date.now(),
  ]);
  await rewardReferral(page.user_id, email).catch(() => {});

  const when = new Intl.DateTimeFormat("en-IN", { dateStyle: "full", timeStyle: "short", timeZone: cfg.timeZone }).format(new Date(b.slot));
  const owner = await one<{ email: string }>("SELECT email FROM users WHERE id = $1", [page.user_id]);
  if (free) await sendBookingConfirmed({ id, buyerName: name, buyerEmail: email, slot: b.slot, handle: page.handle, hostName: page.profile.name, link });

  // How the buyer can pay: the creator's own Razorpay or PayPal (confirms by itself), and/or the creator's payment link.
  const pays: ({ kind: "razorpay"; keyId: string; orderId: string; amount: number; bookingId: string } | { kind: "paypal"; url: string } | { kind: "link"; link: string })[] = [];
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
    // Same for a creator's own PayPal and a price in US dollars: the buyer approves on PayPal, comes back, and it confirms itself.
    const pp = cfg.currency === "USD" ? await paypalCredsForUser(page.user_id) : null;
    if (pp) {
      try {
        const order = await paypalCreate(pp, cfg.price, id, `${link.title} with ${page.profile.name}`, `${SITE_URL}/api/bookings/paypal-return?bid=${id}`, `${SITE_URL}/${page.handle}/${link.id}?pay=cancelled`, page.profile.name);
        await run("UPDATE bookings SET provider = 'paypal', provider_ref = $1 WHERE id = $2", [order.id, id]);
        pays.push({ kind: "paypal", url: order.url });
      } catch (e) {
        console.error("creator paypal order", e);
      }
    }
    if (payLinkHost(cfg.paymentUrl)) pays.push({ kind: "link", link: cfg.paymentUrl! });
  }
  if (owner) {
    const online = pays.some((p) => p.kind !== "link");
    const next = free
      ? ""
      : online
        ? "<p>It confirms by itself once they pay on your page.</p>"
        : pays.length
          ? "<p>Check the money has arrived, then press <b>Mark paid</b> in your dashboard. The buyer is then emailed the meeting link.</p>"
          : "<p><b>They had no way to pay on your page.</b> Send them your payment details, then press Mark paid in your dashboard. To fix this, connect Razorpay or PayPal, or add a payment link to the booking card.</p>";
    await sendMail(owner.email, `New booking request: ${esc(name)}`, `<p>${esc(name)} (${esc(email)}) booked <b>${esc(link.title)}</b> on ${esc(when)} (${esc(cfg.timeZone)}).</p>${next}`);
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
  const row = await one<{ buyer_name: string; buyer_email: string; slot_start: number; link_id: string; handle: string; status: string }>(
    `SELECT b.buyer_name, b.buyer_email, b.slot_start, b.link_id, b.status, p.handle FROM bookings b JOIN pages p ON p.id = b.page_id WHERE b.id = $1 AND p.user_id = $2`,
    [id, session.userId],
  );
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await run("UPDATE bookings SET status = $1 WHERE id = $2", [status, id]);
  if (status === "confirmed" && row.status !== "confirmed") {
    const page = await pageByHandle(row.handle);
    const link = page?.profile.links.find((l) => l.id === row.link_id);
    if (link?.booking) {
      await sendBookingConfirmed({ id, buyerName: row.buyer_name, buyerEmail: row.buyer_email, slot: row.slot_start, handle: row.handle, hostName: page!.profile.name, link }, "paid");
    }
  }
  return NextResponse.json({ ok: true });
}
