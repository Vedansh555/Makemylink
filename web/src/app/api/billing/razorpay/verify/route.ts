import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sameOriginOnly } from "@/lib/security";
import { PRO_PRICE, razorpayFetchOrder, razorpayVerifyPayment, type Period } from "@/lib/payments";
import { grantPro } from "@/lib/billing";

// POST — called by the browser after Razorpay Checkout succeeds.
// The signature proves the payment is real. Who paid, for which period and how much come from the order stored at Razorpay,
// never from the browser, so nobody can pay for a month and ask for a year.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: "Log in first" }, { status: 401 });
  const blocked = sameOriginOnly(req);
  if (blocked) return blocked;

  const b = (await req.json().catch(() => ({}))) as { orderId?: string; paymentId?: string; signature?: string };
  if (!b.orderId || !b.paymentId || !b.signature) return NextResponse.json({ error: "Missing payment details" }, { status: 400 });
  if (!razorpayVerifyPayment(b.orderId, b.paymentId, b.signature)) {
    return NextResponse.json({ error: "Payment could not be verified" }, { status: 400 });
  }

  try {
    const order = await razorpayFetchOrder(b.orderId);
    const period = order.notes?.period as Period | undefined;
    const region = order.notes?.region === "GLOBAL" ? "GLOBAL" : "IN";
    const price = PRO_PRICE[region];
    const expected = (period === "monthly" || period === "yearly" ? price[period] : 0) * 100;
    if (order.notes?.user_id !== session.userId || !expected || order.amount !== expected || order.currency !== price.currency || order.amount_paid < order.amount) {
      return NextResponse.json({ error: "This payment does not match a Pro order for your account" }, { status: 400 });
    }
    await grantPro({ userId: session.userId, period: period!, provider: "razorpay", ref: b.paymentId, amount: price[period!], currency: price.currency });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("razorpay verify error", e);
    return NextResponse.json({ error: "Could not confirm the payment yet" }, { status: 502 });
  }
}
