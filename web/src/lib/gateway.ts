import crypto from "crypto";
import { one } from "./db";
import { unlockSecret } from "./secretbox";

/**
 * A creator's own Razorpay account, used so a booking is paid straight to them and confirms by itself.
 * The money never touches Showz: orders are made on the creator's account with the creator's keys.
 */
export interface Creds {
  keyId: string;
  secret: string;
}

export async function credsForUser(userId: string): Promise<Creds | null> {
  const row = await one<{ key_id: string; secret_enc: string }>("SELECT key_id, secret_enc FROM creator_gateways WHERE user_id = $1 AND provider = 'razorpay'", [userId]);
  if (!row) return null;
  const secret = unlockSecret(row.secret_enc);
  return secret ? { keyId: row.key_id, secret } : null;
}

const auth = (c: Creds) => `Basic ${Buffer.from(`${c.keyId}:${c.secret}`).toString("base64")}`;

/** Asks Razorpay if these keys work. Test keys (rzp_test_) and live keys (rzp_live_) both count. */
export async function keysWork(c: Creds): Promise<boolean> {
  try {
    const r = await fetch("https://api.razorpay.com/v1/orders?count=1", { headers: { Authorization: auth(c) }, signal: AbortSignal.timeout(12_000) });
    return r.ok;
  } catch {
    return false;
  }
}

export async function createOrder(c: Creds, amountMajor: number, receipt: string, notes: Record<string, string>) {
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { Authorization: auth(c), "Content-Type": "application/json" },
    body: JSON.stringify({ amount: Math.round(amountMajor * 100), currency: "INR", receipt: receipt.slice(0, 40), notes }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Razorpay order failed: ${res.status}`);
  return (await res.json()) as { id: string; amount: number; currency: string };
}

export async function fetchOrder(c: Creds, orderId: string) {
  const res = await fetch(`https://api.razorpay.com/v1/orders/${encodeURIComponent(orderId)}`, { headers: { Authorization: auth(c) }, signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`Razorpay order lookup failed: ${res.status}`);
  return (await res.json()) as { id: string; amount: number; amount_paid: number; currency: string; status: string; notes?: Record<string, string> };
}

export function verifySignature(c: Creds, orderId: string, paymentId: string, signature: string): boolean {
  const expected = crypto.createHmac("sha256", c.secret).update(`${orderId}|${paymentId}`).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** How long an unpaid online checkout keeps a time slot before someone else can take it. */
export const HOLD_MS = 20 * 60 * 1000;

// ---------- PayPal: the creator's own PayPal REST app (buyers outside India, US dollars) ----------
export interface PaypalCreds {
  clientId: string;
  secret: string;
  sandbox: boolean;
}

/** A creator's PayPal keys. A sandbox (test) connection is stored under its own provider name so it can never be mistaken for live. */
export async function paypalCredsForUser(userId: string): Promise<PaypalCreds | null> {
  const row = await one<{ provider: string; key_id: string; secret_enc: string }>(
    "SELECT provider, key_id, secret_enc FROM creator_gateways WHERE user_id = $1 AND provider IN ('paypal','paypal_sandbox') ORDER BY provider ASC LIMIT 1",
    [userId],
  );
  if (!row) return null;
  const secret = unlockSecret(row.secret_enc);
  return secret ? { clientId: row.key_id, secret, sandbox: row.provider === "paypal_sandbox" } : null;
}

const ppBase = (c: PaypalCreds) => (c.sandbox ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com");

async function ppToken(c: PaypalCreds): Promise<string | null> {
  try {
    const res = await fetch(`${ppBase(c)}/v1/oauth2/token`, {
      method: "POST",
      headers: { Authorization: `Basic ${Buffer.from(`${c.clientId}:${c.secret}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: "grant_type=client_credentials",
      signal: AbortSignal.timeout(12_000),
    });
    return res.ok ? ((await res.json()) as { access_token: string }).access_token : null;
  } catch {
    return null;
  }
}

export async function paypalKeysWork(c: PaypalCreds): Promise<boolean> {
  return !!(await ppToken(c));
}

/** Makes a PayPal order on the creator's account and returns the page the buyer approves it on. */
export async function paypalCreate(c: PaypalCreds, amountMajor: number, bookingId: string, description: string, returnUrl: string, cancelUrl: string, brand: string) {
  const token = await ppToken(c);
  if (!token) throw new Error("PayPal keys rejected");
  const res = await fetch(`${ppBase(c)}/v2/checkout/orders`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [{ custom_id: bookingId, description: description.slice(0, 120), amount: { currency_code: "USD", value: amountMajor.toFixed(2) } }],
      payment_source: { paypal: { experience_context: { return_url: returnUrl, cancel_url: cancelUrl, user_action: "PAY_NOW", brand_name: brand.slice(0, 120) } } },
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`PayPal order failed: ${res.status}`);
  const o = (await res.json()) as { id: string; links: { rel: string; href: string }[] };
  const url = o.links.find((l) => l.rel === "payer-action" || l.rel === "approve")?.href;
  if (!url) throw new Error("PayPal gave no approval link");
  return { id: o.id, url };
}

/** Takes the money after the buyer approved. Returns what PayPal says was paid, so the caller can check it matches the booking. */
export async function paypalCapture(c: PaypalCreds, orderId: string) {
  const token = await ppToken(c);
  if (!token) return null;
  const res = await fetch(`${ppBase(c)}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, signal: AbortSignal.timeout(20_000) });
  const o = (await res.json().catch(() => ({}))) as { purchase_units?: { payments?: { captures?: { status: string; custom_id?: string; amount: { currency_code: string; value: string } }[] } }[] };
  const cap = o.purchase_units?.[0]?.payments?.captures?.[0];
  if (!cap || cap.status !== "COMPLETED") return null;
  return { bookingId: cap.custom_id ?? "", currency: cap.amount.currency_code, value: Number(cap.amount.value) };
}
