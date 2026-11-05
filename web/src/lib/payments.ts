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
export const paypalConfigured = () => !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);

// ---------- PayPal (international buyers, USD) ----------
const paypalBase = () => (process.env.PAYPAL_ENV === "sandbox" ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com");

async function paypalToken() {
  const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString("base64");
  const res = await fetch(`${paypalBase()}/v1/oauth2/token`, { method: "POST", headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" }, body: "grant_type=client_credentials" });
  if (!res.ok) throw new Error(`PayPal auth failed: ${res.status}`);
  return ((await res.json()) as { access_token: string }).access_token;
}

/** Creates a PayPal order and returns the page the buyer should be sent to. */
export async function paypalCreateOrder(opts: { amountMajor: number; userId: string; period: Period; returnUrl: string; cancelUrl: string }) {
  const token = await paypalToken();
  const res = await fetch(`${paypalBase()}/v2/checkout/orders`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [{ custom_id: `${opts.userId}|${opts.period}`, description: `Showz Pro (${opts.period})`, amount: { currency_code: "USD", value: opts.amountMajor.toFixed(2) } }],
      payment_source: { paypal: { experience_context: { return_url: opts.returnUrl, cancel_url: opts.cancelUrl, user_action: "PAY_NOW", brand_name: "Showz" } } },
    }),
  });
  if (!res.ok) throw new Error(`PayPal order failed: ${res.status}`);
  const o = (await res.json()) as { id: string; links: { rel: string; href: string }[] };
  const url = o.links.find((l) => l.rel === "payer-action" || l.rel === "approve")?.href;
  if (!url) throw new Error("PayPal gave no approval link");
  return { id: o.id, url };
}

/** Takes the money after the buyer approved it. The user and period come back from the order we created, not from the browser. */
export async function paypalCapture(orderId: string) {
  const token = await paypalToken();
  const res = await fetch(`${paypalBase()}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } });
  const o = (await res.json().catch(() => ({}))) as {
    status?: string;
    purchase_units?: { payments?: { captures?: { id: string; status: string; custom_id?: string; amount: { currency_code: string; value: string } }[] } }[];
  };
  const cap = o.purchase_units?.[0]?.payments?.captures?.[0];
  if (!cap || cap.status !== "COMPLETED") throw new Error(`PayPal capture not completed (${res.status})`);
  const [userId, period] = (cap.custom_id ?? "").split("|");
  return { captureId: cap.id, userId, period: period as Period, currency: cap.amount.currency_code, value: Number(cap.amount.value) };
}

// ---------- Razorpay ----------
const rzpAuth = () => Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");

/** Creates a Razorpay order. USD orders need "International payments" switched on in the Razorpay dashboard. */
export async function razorpayCreateOrder(amountMajor: number, receipt: string, notes: Record<string, string>, currency: "INR" | "USD" = "INR") {
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { Authorization: `Basic ${rzpAuth()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ amount: amountMajor * 100, currency, receipt: receipt.slice(0, 40), notes }),
  });
  if (!res.ok) throw new Error(`Razorpay order failed: ${res.status}`);
  return (await res.json()) as { id: string; amount: number; currency: string };
}

/** Reads an order back from Razorpay, so what we grant is based on what was really ordered, not on what the browser says. */
export async function razorpayFetchOrder(orderId: string) {
  const res = await fetch(`https://api.razorpay.com/v1/orders/${encodeURIComponent(orderId)}`, { headers: { Authorization: `Basic ${rzpAuth()}` } });
  if (!res.ok) throw new Error(`Razorpay order lookup failed: ${res.status}`);
  return (await res.json()) as { id: string; amount: number; amount_paid: number; currency: string; status: string; notes?: Record<string, string> };
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
