import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sameOriginOnly } from "@/lib/security";
import { PRO_PRICE, razorpayVerifyPayment, type Period } from "@/lib/payments";
import { grantPro } from "@/lib/billing";

// POST — called by the browser after Razorpay Checkout succeeds. The signature proves the payment is real.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: "Log in first" }, { status: 401 });
  const blocked = sameOriginOnly(req);
  if (blocked) return blocked;

  const b = (await req.json().catch(() => ({}))) as { orderId?: string; paymentId?: string; signature?: string; period?: Period };
  if (!b.orderId || !b.paymentId || !b.signature || (b.period !== "monthly" && b.period !== "yearly")) {
    return NextResponse.json({ error: "Missing payment details" }, { status: 400 });
  }
  if (!razorpayVerifyPayment(b.orderId, b.paymentId, b.signature)) {
    return NextResponse.json({ error: "Payment could not be verified" }, { status: 400 });
  }
  await grantPro({ userId: session.userId, period: b.period, provider: "razorpay", ref: b.paymentId, amount: PRO_PRICE.IN[b.period], currency: "INR" });
  return NextResponse.json({ ok: true });
}
