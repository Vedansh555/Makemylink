import { NextResponse } from "next/server";
import { one, run } from "@/lib/db";
import { pageByHandle } from "@/lib/account";
import { clientIp, rateLimit, sameOriginOnly } from "@/lib/security";
import { esc, sendMail } from "@/lib/mail";
import { credsForUser, fetchOrder, verifySignature } from "@/lib/gateway";

// POST {bookingId, orderId, paymentId, signature}: the buyer paid in Razorpay Checkout.
// We check the signature with the creator's secret, then read the order back from Razorpay before confirming.
export async function POST(req: Request) {
  const blocked = sameOriginOnly(req) ?? rateLimit(`bookpay:${clientIp(req)}`, 30, 60 * 60 * 1000);
  if (blocked) return blocked;
  const b = (await req.json().catch(() => ({}))) as { bookingId?: string; orderId?: string; paymentId?: string; signature?: string };
  if (!b.bookingId || !b.orderId || !b.paymentId || !b.signature) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const row = await one<{ id: string; page_id: string; link_id: string; buyer_name: string; buyer_email: string; slot_start: number; amount: number; status: string; provider_ref: string | null; handle: string; user_id: string }>(
    "SELECT b.id, b.page_id, b.link_id, b.buyer_name, b.buyer_email, b.slot_start, b.amount, b.status, b.provider_ref, p.handle, p.user_id FROM bookings b JOIN pages p ON p.id = b.page_id WHERE b.id = $1 AND b.provider = 'razorpay'",
    [b.bookingId],
  );
  if (!row || row.provider_ref !== b.orderId) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  const page = await pageByHandle(row.handle);
  const link = page?.profile.links.find((l) => l.id === row.link_id);
  if (!page || !link?.booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  const cfg = link.booking;
  if (row.status === "confirmed") return NextResponse.json({ ok: true, status: "confirmed", meetingUrl: cfg.meetingUrl });

  const creds = await credsForUser(row.user_id);
  if (!creds || !verifySignature(creds, b.orderId, b.paymentId, b.signature)) return NextResponse.json({ error: "We could not verify this payment" }, { status: 400 });
  const order = await fetchOrder(creds, b.orderId).catch(() => null);
  if (!order || order.currency !== "INR" || order.amount !== row.amount * 100 || order.amount_paid < order.amount || order.notes?.booking_id !== row.id) {
    return NextResponse.json({ error: "We could not verify this payment" }, { status: 400 });
  }

  const when = new Intl.DateTimeFormat("en-IN", { dateStyle: "full", timeStyle: "short", timeZone: cfg.timeZone }).format(new Date(row.slot_start));
  const owner = await one<{ email: string }>("SELECT email FROM users WHERE id = $1", [row.user_id]);

  // If the hold ran out and someone else took the time meanwhile, the money is in the creator's Razorpay: tell them to sort it out.
  if (row.status === "cancelled") {
    const clash = await one("SELECT id FROM bookings WHERE page_id = $1 AND link_id = $2 AND slot_start = $3 AND status <> 'cancelled' AND id <> $4", [row.page_id, row.link_id, row.slot_start, row.id]);
    if (clash) {
      if (owner) await sendMail(owner.email, `Paid, but the time was taken: ${esc(row.buyer_name)}`, `<p>${esc(row.buyer_name)} (${esc(row.buyer_email)}) paid for <b>${esc(link.title)}</b> on ${esc(when)}, but someone else booked that time while they were paying. Please contact them to pick another time or refund the payment in your Razorpay dashboard.</p>`);
      return NextResponse.json({ error: "You paid, but that time was just taken. The creator has been told and will contact you." }, { status: 409 });
    }
  }

  await run("UPDATE bookings SET status = 'confirmed' WHERE id = $1", [row.id]);
  await sendMail(row.buyer_email, `Confirmed: ${link.title}`, `<p>Payment received. You are booked for <b>${esc(link.title)}</b> on ${esc(when)}.</p><p>Join here: <a href="${esc(cfg.meetingUrl)}">${esc(cfg.meetingUrl)}</a></p>`);
  if (owner) await sendMail(owner.email, `Paid booking: ${esc(row.buyer_name)}`, `<p>${esc(row.buyer_name)} (${esc(row.buyer_email)}) paid and booked <b>${esc(link.title)}</b> on ${esc(when)}. It is confirmed automatically.</p>`);
  return NextResponse.json({ ok: true, status: "confirmed", meetingUrl: cfg.meetingUrl });
}
