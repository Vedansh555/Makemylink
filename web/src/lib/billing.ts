import { one, transaction } from "./db";
import { PERIOD_MS, type Period } from "./payments";

/**
 * Extends Pro by one period. Safe to call twice for the same payment, even at the same moment (the browser return and
 * the webhook both arrive): the payment's id is built from the provider reference, so only one call can record it.
 * Recording the payment and extending Pro happen together or not at all, so a failure can simply be retried.
 */
export async function grantPro(opts: { userId: string; period: Period; provider: "razorpay" | "stripe" | "paypal"; ref: string; amount: number; currency: string }) {
  if (await one("SELECT id FROM payments WHERE provider = $1 AND provider_ref = $2", [opts.provider, opts.ref])) return false;
  const now = Date.now();
  return transaction(async (tx) => {
    const added = await tx.query("INSERT INTO payments (id, user_id, kind, provider, provider_ref, amount, currency, status, created_at) VALUES ($1,$2,'pro',$3,$4,$5,$6,'paid',$7) ON CONFLICT (id) DO NOTHING RETURNING id", [
      `${opts.provider}:${opts.ref}`,
      opts.userId,
      opts.provider,
      opts.ref,
      opts.amount,
      opts.currency,
      now,
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
