import { NextResponse } from "next/server";
import { clientIp, rateLimit, sameOriginOnly } from "@/lib/security";
import { credsForUser, fetchOrder, verifySignature } from "@/lib/gateway";
import { confirmPaidBooking, loadBooking } from "@/lib/bookingPaid";

// POST {bookingId, orderId, paymentId, signature}: the buyer paid in Razorpay Checkout.
// We check the signature with the creator's secret, then read the order back from Razorpay before confirming.
export async function POST(req: Request) {
  const blocked = sameOriginOnly(req) ?? rateLimit(`bookpay:${clientIp(req)}`, 30, 60 * 60 * 1000);
  if (blocked) return blocked;
  const b = (await req.json().catch(() => ({}))) as { bookingId?: string; orderId?: string; paymentId?: string; signature?: string };
  if (!b.bookingId || !b.orderId || !b.paymentId || !b.signature) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const row = await loadBooking("b.id = $1 AND b.provider = 'razorpay'", [b.bookingId]);
  if (!row || row.provider_ref !== b.orderId) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (row.status !== "confirmed") {
    const creds = await credsForUser(row.user_id);
    if (!creds || !verifySignature(creds, b.orderId, b.paymentId, b.signature)) return NextResponse.json({ error: "We could not verify this payment" }, { status: 400 });
    const order = await fetchOrder(creds, b.orderId).catch(() => null);
    if (!order || order.currency !== "INR" || order.amount !== row.amount * 100 || order.amount_paid < order.amount || order.notes?.booking_id !== row.id) {
      return NextResponse.json({ error: "We could not verify this payment" }, { status: 400 });
    }
  }
  const done = await confirmPaidBooking(row);
  return done.ok ? NextResponse.json({ ok: true, status: "confirmed", meetingUrl: done.meetingUrl }) : NextResponse.json({ error: done.error }, { status: done.status });
}
