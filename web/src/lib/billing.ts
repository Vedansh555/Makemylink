import { one, transaction } from "./db";
import { PERIOD_MS, PRO_PRICE, type Period } from "./payments";

/**
 * Extends Pro by one period. Safe to call twice for the same payment, even at the same moment (the browser return and
 * the webhook both arrive): the payment's id is built from the provider reference, so only one call can record it.
 * Recording the payment and extending Pro happen together or not at all, so a failure can simply be retried.
 */
export async function grantPro(opts: { userId: string; period: Period; provider: "razorpay" | "stripe" | "paypal"; ref: string; amount: number; currency: string }) {
  if (await one("SELECT id FROM payments WHERE provider = $1 AND provider_ref = $2", [opts.provider, opts.ref])) return false;
  const now = Date.now();
  return transaction(async (tx) => {
    const added = await tx.query("INSERT INTO payments (id, user_id, kind, provider, provider_ref, amount, currency, status, created_at, period) VALUES ($1,$2,'pro',$3,$4,$5,$6,'paid',$7,$8) ON CONFLICT (id) DO NOTHING RETURNING id", [
      `${opts.provider}:${opts.ref}`,
      opts.userId,
      opts.provider,
      opts.ref,
      opts.amount,
      opts.currency,
      now,
      opts.period,
    ]);
    if (!added.length) return false;
    // Lock the account row so two different payments can't both extend from the same old date.
    const [u] = (await tx.query("SELECT plan_renews_at FROM users WHERE id = $1 FOR UPDATE", [opts.userId])) as { plan_renews_at: number | null }[];
    // Paying early adds to the time left instead of throwing it away.
    const base = u?.plan_renews_at && u.plan_renews_at > now ? u.plan_renews_at : now;
    await tx.query("UPDATE users SET plan = 'pro', plan_provider = $1, plan_ref = $2, plan_renews_at = $3 WHERE id = $4", [opts.provider, opts.ref, base + PERIOD_MS[opts.period], opts.userId]);
    return true;
  });
}

/**
 * A Pro payment was refunded in full: mark it, and take back the time it bought. Time from other payments, gifts or
 * referrals stays. Safe to call twice (the second call finds nothing left to do). Part refunds change nothing.
 * `refunded` is the total refunded so far, in whole rupees or dollars.
 */
export async function revokePro(provider: "razorpay" | "paypal", ref: string, refunded: number): Promise<boolean> {
  return transaction(async (tx) => {
    const [p] = (await tx.query("SELECT id, user_id, amount, currency, period FROM payments WHERE provider = $1 AND provider_ref = $2 AND status = 'paid' FOR UPDATE", [provider, ref])) as { id: string; user_id: string | null; amount: number; currency: string; period: string | null }[];
    if (!p || refunded + 0.001 < p.amount) return false;
    await tx.query("UPDATE payments SET status = 'refunded' WHERE id = $1", [p.id]);
    if (!p.user_id) return true;
    // Older payments have no period saved: tell it from the amount.
    const yearly = PRO_PRICE[p.currency === "INR" ? "IN" : "GLOBAL"].yearly;
    const period: Period = p.period === "monthly" || p.period === "yearly" ? p.period : p.amount >= yearly ? "yearly" : "monthly";
    const [u] = (await tx.query("SELECT plan_renews_at FROM users WHERE id = $1 FOR UPDATE", [p.user_id])) as { plan_renews_at: number | null }[];
    if (!u?.plan_renews_at) return true;
    const left = u.plan_renews_at - PERIOD_MS[period];
    // Under a day left counts as nothing left (the plan check allows a short grace period).
    if (left <= Date.now() + 86_400_000) await tx.query("UPDATE users SET plan = 'free', plan_renews_at = NULL WHERE id = $1", [p.user_id]);
    else await tx.query("UPDATE users SET plan_renews_at = $1 WHERE id = $2", [left, p.user_id]);
    return true;
  });
}
