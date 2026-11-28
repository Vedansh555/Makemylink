import crypto from "crypto";
import { all, one, run } from "./db";
import { lockSecret, unlockSecret } from "./secretbox";
import { SITE_URL } from "./site";
import { confirmPaidBooking, loadBooking } from "./bookingPaid";
import { bookingRow, emailUnmatched } from "./bookingActions";

/**
 * Automatic confirmation for bookings paid through a creator's Razorpay payment link (razorpay.me, Payment Links,
 * Payment Pages), without API keys. The creator adds a webhook in their own Razorpay dashboard that points to Showz.
 * Razorpay signs every message with the secret we give the creator, so a buyer can't fake one.
 *
 * A static link can't carry our booking id, so each waiting booking gets its own exact amount (the price plus a few
 * paise, an idea used by open-source UPI tools such as Paisaify). A payment of exactly that amount confirms it.
 * If the buyer could not change the amount (fixed-price links), the buyer's email or phone is used instead, and only
 * when exactly one waiting booking fits. Anything unclear is left for the creator to mark paid.
 */

const LOOKBACK = 48 * 3_600_000;

export interface Hook {
  userId: string;
  hookId: string;
  secret: string;
}

export async function hookForUser(userId: string): Promise<(Hook & { lastSeen: number | null }) | null> {
  const row = await one<{ key_id: string; secret_enc: string; last_seen: number | null }>("SELECT key_id, secret_enc, last_seen FROM creator_gateways WHERE user_id = $1 AND provider = 'rzp_hook'", [userId]);
  const secret = row && unlockSecret(row.secret_enc);
  return row && secret ? { userId, hookId: row.key_id, secret, lastSeen: row.last_seen ? Number(row.last_seen) : null } : null;
}

export async function hookById(hookId: string): Promise<Hook | null> {
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(hookId)) return null;
  const row = await one<{ user_id: string; secret_enc: string }>("SELECT user_id, secret_enc FROM creator_gateways WHERE provider = 'rzp_hook' AND key_id = $1", [hookId]);
  const secret = row && unlockSecret(row.secret_enc);
  return row && secret ? { userId: row.user_id, hookId, secret } : null;
}

export async function createHook(userId: string): Promise<Hook> {
  const hookId = crypto.randomBytes(18).toString("base64url");
  const secret = crypto.randomBytes(24).toString("base64url");
  await run(
    "INSERT INTO creator_gateways (user_id, provider, key_id, secret_enc, created_at) VALUES ($1,'rzp_hook',$2,$3,$4) ON CONFLICT (user_id, provider) DO UPDATE SET key_id = EXCLUDED.key_id, secret_enc = EXCLUDED.secret_enc, created_at = EXCLUDED.created_at",
    [userId, hookId, lockSecret(secret), Date.now()],
  );
  return { userId, hookId, secret };
}

export const markSeen = (hookId: string) => run("UPDATE creator_gateways SET last_seen = $1 WHERE provider = 'rzp_hook' AND key_id = $2", [Date.now(), hookId]);

export const hookUrl = (hookId: string) => `${SITE_URL}/api/webhooks/razorpay-link/${hookId}`;

export function signatureOk(raw: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const want = Buffer.from(crypto.createHmac("sha256", secret).update(raw).digest("hex"));
  const got = Buffer.from(signature);
  return want.length === got.length && crypto.timingSafeEqual(want, got);
}

/** The exact amount (in paise) a new link booking should be paid with: the price plus 1 to 99 paise not used by another waiting booking. */
export async function exactAmount(userId: string, rupees: number): Promise<number> {
  const rows = await all<{ pay_paise: number }>(
    "SELECT b.pay_paise FROM bookings b JOIN pages p ON p.id = b.page_id WHERE p.user_id = $1 AND b.status = 'awaiting_payment' AND b.pay_paise IS NOT NULL AND b.created_at > $2",
    [userId, Date.now() - LOOKBACK],
  );
  const used = new Set(rows.map((r) => Number(r.pay_paise)));
  const base = rupees * 100;
  const free = Array.from({ length: 99 }, (_, i) => base + i + 1).filter((v) => !used.has(v));
  // Random among the free ones, so amounts don't reveal how many bookings are waiting.
  return free.length ? free[crypto.randomInt(free.length)]! : base;
}

interface Paid {
  paymentId: string;
  paise: number;
  email: string | null;
  contact: string | null;
}

/** Pulls the payment out of a Razorpay webhook (payment.captured or payment_link.paid), or null if it isn't a captured rupee payment. */
export function paymentFrom(evt: { event?: string; payload?: { payment?: { entity?: Record<string, unknown> } } }): Paid | null {
  if (evt.event !== "payment.captured" && evt.event !== "payment_link.paid") return null;
  const p = evt.payload?.payment?.entity;
  if (!p || p.status !== "captured" || p.currency !== "INR" || typeof p.id !== "string" || typeof p.amount !== "number") return null;
  return { paymentId: p.id, paise: p.amount, email: typeof p.email === "string" ? p.email.toLowerCase().trim() : null, contact: typeof p.contact === "string" ? p.contact.replace(/\D/g, "").slice(-10) : null };
}

/** Finds the one waiting booking this payment is for and confirms it. Returns what happened, for logs and tests. */
export async function settleLinkPayment(userId: string, pay: Paid): Promise<"confirmed" | "duplicate" | "unmatched"> {
  if (await one("SELECT id FROM bookings WHERE provider_ref = $1", [pay.paymentId])) return "duplicate";
  const waiting = await all<{ id: string; buyer_email: string; amount: number; pay_paise: number | null }>(
    `SELECT b.id, b.buyer_email, b.amount, b.pay_paise FROM bookings b JOIN pages p ON p.id = b.page_id
     WHERE p.user_id = $1 AND b.status = 'awaiting_payment' AND b.currency = 'INR' AND b.provider IS NULL AND b.created_at > $2`,
    [userId, Date.now() - LOOKBACK],
  );
  let hit = waiting.filter((w) => w.pay_paise !== null && Number(w.pay_paise) === pay.paise);
  if (hit.length !== 1) {
    // Fixed-price links: same price, and the payer's email matches the booking's email.
    hit = pay.email ? waiting.filter((w) => w.amount * 100 === pay.paise && w.buyer_email.toLowerCase() === pay.email) : [];
  }
  if (hit.length !== 1) {
    // Probably for one of our bookings (same rupee price) but not certain: ask the creator with one tap per booking.
    const near = waiting.filter((x) => pay.paise >= x.amount * 100 && pay.paise < x.amount * 100 + 100);
    if (near.length) {
      const rows = (await Promise.all(near.slice(0, 5).map((x) => bookingRow(x.id)))).filter((x) => !!x);
      if (rows.length) await emailUnmatched(rows[0]!.owner_email, pay.paise, pay.email ?? pay.contact, rows);
    }
    return "unmatched";
  }
  // Claim it for this payment first, so the same payment can never confirm two bookings.
  const claimed = await one("UPDATE bookings SET provider = 'razorpay_link', provider_ref = $1 WHERE id = $2 AND provider IS NULL AND status = 'awaiting_payment' RETURNING id", [pay.paymentId, hit[0]!.id]);
  if (!claimed) return "duplicate";
  const row = await loadBooking("b.id = $1", [hit[0]!.id]);
  if (row) await confirmPaidBooking(row);
  return "confirmed";
}
