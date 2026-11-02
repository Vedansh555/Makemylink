import crypto from "crypto";
import { SITE_URL } from "./site";

/**
 * Plan pricing, in the smallest unit each gateway wants.
 * India pays through Razorpay (UPI, cards, netbanking); everyone else through Stripe.
 * Pro is sold as a prepaid period (no surprise renewals): the creator pays again to extend.
 */
export type Period = "monthly" | "yearly";
export const PRO_PRICE = {
  IN: { monthly: 299, yearly: 2999, currency: "INR" as const },
  GLOBAL: { monthly: 8, yearly: 79, currency: "USD" as const },
};
export const PERIOD_MS: Record<Period, number> = { monthly: 31 * 86_400_000, yearly: 366 * 86_400_000 };

export const razorpayConfigured = () => !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
export const stripeConfigured = () => !!process.env.STRIPE_SECRET_KEY;

// ---------- Razorpay ----------
export async function razorpayCreateOrder(amountMajor: number, receipt: string, notes: Record<string, string>) {
  const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify({ amount: amountMajor * 100, currency: "INR", receipt: receipt.slice(0, 40), notes }),
  });
  if (!res.ok) throw new Error(`Razorpay order failed: ${res.status}`);
  return (await res.json()) as { id: string; amount: number; currency: string };
}

const safeEq = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

/** Checks the signature Razorpay Checkout returns after a successful payment. */
export function razorpayVerifyPayment(orderId: string, paymentId: string, signature: string): boolean {
  const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET ?? "").update(`${orderId}|${paymentId}`).digest("hex");
  return safeEq(expected, signature);
}

export function razorpayVerifyWebhook(rawBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  return safeEq(crypto.createHmac("sha256", secret).update(rawBody).digest("hex"), signature);
}

// ---------- Stripe ----------
export async function stripeCreateCheckout(opts: { amountMajor: number; name: string; email: string; userId: string; period: Period }) {
  const body = new URLSearchParams({
    mode: "payment",
    "payment_method_types[0]": "card",
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": String(opts.amountMajor * 100),
    "line_items[0][price_data][product_data][name]": opts.name,
    customer_email: opts.email,
    client_reference_id: opts.userId,
    "metadata[user_id]": opts.userId,
    "metadata[period]": opts.period,
    success_url: `${SITE_URL}/dashboard?upgraded=1`,
    cancel_url: `${SITE_URL}/dashboard?tab=billing`,
  });
  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`Stripe checkout failed: ${res.status}`);
  return (await res.json()) as { id: string; url: string };
}

/** Verifies a Stripe webhook (`Stripe-Signature: t=...,v1=...`) with a 5-minute tolerance. */
export function stripeVerifyWebhook(rawBody: string, header: string): boolean {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return false;
  const parts = Object.fromEntries(header.split(",").map((kv) => kv.split("=") as [string, string]));
  const t = Number(parts.t);
  if (!t || Math.abs(Date.now() / 1000 - t) > 300) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${t}.${rawBody}`).digest("hex");
  return !!parts.v1 && safeEq(expected, parts.v1);
}
