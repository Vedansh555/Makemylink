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
