import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { one } from "@/lib/db";
import { rateLimit, sameOriginOnly } from "@/lib/security";
import { PRO_PRICE, paypalConfigured, paypalCreateOrder, razorpayConfigured, razorpayCreateOrder, stripeConfigured, stripeCreateCheckout, type Period } from "@/lib/payments";

// POST /api/billing/checkout {period, region} — starts a Pro purchase. India → Razorpay order; others → Stripe, else PayPal, else Razorpay in USD.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: "Log in first" }, { status: 401 });
  const blocked = sameOriginOnly(req) ?? rateLimit(`checkout:${session.userId}`, 15, 60 * 60 * 1000);
  if (blocked) return blocked;

  const { period, region } = (await req.json().catch(() => ({}))) as { period?: Period; region?: "IN" | "GLOBAL" };
  if (period !== "monthly" && period !== "yearly") return NextResponse.json({ error: "Pick monthly or yearly" }, { status: 400 });
  const r = region === "IN" ? "IN" : "GLOBAL";
  const price = PRO_PRICE[r];
  const amount = price[period];

  const user = await one<{ email: string }>("SELECT email FROM users WHERE id = $1", [session.userId]);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 401 });

  try {
    if (r === "IN") {
      if (!razorpayConfigured()) return NextResponse.json({ error: "Payments are not switched on yet. Add Razorpay keys." }, { status: 503 });
      const order = await razorpayCreateOrder(amount, `pro_${session.userId.slice(0, 8)}_${Date.now()}`, { user_id: session.userId, period, region: "IN" });
      return NextResponse.json({ provider: "razorpay", orderId: order.id, amount: order.amount, currency: order.currency, keyId: process.env.RAZORPAY_KEY_ID, email: user.email });
    }
    if (!stripeConfigured() && paypalConfigured()) {
      const site = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
      const o = await paypalCreateOrder({ amountMajor: amount, userId: session.userId, period, returnUrl: `${site}/api/billing/paypal/return`, cancelUrl: `${site}/dashboard?tab=billing` });
      return NextResponse.json({ provider: "paypal", url: o.url });
    }
    if (!stripeConfigured()) {
      // No Stripe or PayPal: international buyers pay in US dollars through Razorpay (needs International payments enabled on the Razorpay account).
      if (razorpayConfigured()) {
        const order = await razorpayCreateOrder(amount, `pro_${session.userId.slice(0, 8)}_${Date.now()}`, { user_id: session.userId, period, region: "GLOBAL" }, "USD");
        return NextResponse.json({ provider: "razorpay", orderId: order.id, amount: order.amount, currency: order.currency, keyId: process.env.RAZORPAY_KEY_ID, email: user.email });
      }
      return NextResponse.json({ error: "Payments are not switched on yet. Add PayPal, Razorpay or Stripe keys." }, { status: 503 });
    }
    const s = await stripeCreateCheckout({ amountMajor: amount, name: `Showz Pro (${period})`, email: user.email, userId: session.userId, period });
    return NextResponse.json({ provider: "stripe", url: s.url });
  } catch (e) {
    console.error("checkout error", e);
    return NextResponse.json({ error: "Could not start checkout" }, { status: 502 });
  }
}
