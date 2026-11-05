import crypto from "crypto";
import { one, run } from "./db";
import { PERIOD_MS, type Period } from "./payments";

/**
 * Extends Pro by one period. Safe to call twice for the same payment (the browser callback and the
 * webhook both arrive): the provider reference is recorded once and the second call does nothing.
 */
export async function grantPro(opts: { userId: string; period: Period; provider: "razorpay" | "stripe" | "paypal"; ref: string; amount: number; currency: string }) {
  if (await one("SELECT id FROM payments WHERE provider = $1 AND provider_ref = $2", [opts.provider, opts.ref])) return false;
  const now = Date.now();
  await run("INSERT INTO payments (id, user_id, kind, provider, provider_ref, amount, currency, status, created_at) VALUES ($1,$2,'pro',$3,$4,$5,$6,'paid',$7)", [
    crypto.randomUUID(),
    opts.userId,
    opts.provider,
    opts.ref,
    opts.amount,
    opts.currency,
    now,
  ]);
  const u = await one<{ plan_renews_at: number | null }>("SELECT plan_renews_at FROM users WHERE id = $1", [opts.userId]);
  // Paying early adds to the time left instead of throwing it away.
  const base = u?.plan_renews_at && u.plan_renews_at > now ? u.plan_renews_at : now;
  await run("UPDATE users SET plan = 'pro', plan_provider = $1, plan_ref = $2, plan_renews_at = $3 WHERE id = $4", [
    opts.provider,
    opts.ref,
    base + PERIOD_MS[opts.period],
    opts.userId,
  ]);
  return true;
}
