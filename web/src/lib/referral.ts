import { one, run } from "./db";
import { sendMail } from "./mail";

const MONTH = 30 * 86_400_000;

async function addProMonth(userId: string) {
  const u = await one<{ plan_renews_at: number | null; plan: string }>("SELECT plan, plan_renews_at FROM users WHERE id = $1", [userId]);
  if (!u) return;
  const base = u.plan === "pro" && u.plan_renews_at && u.plan_renews_at > Date.now() ? u.plan_renews_at : Date.now();
  await run("UPDATE users SET plan = 'pro', plan_provider = COALESCE(plan_provider, 'referral'), plan_renews_at = $1 WHERE id = $2", [base + MONTH, userId]);
}

/**
 * Referral reward: when a creator who signed up through someone's "Made with Showz" badge gets their first lead or booking,
 * both of them get a free month of Pro. Runs once per invited creator. Safe to call often.
 */
export async function rewardReferral(userId: string, visitorEmail: string): Promise<void> {
  const u = await one<{ email: string; referred_by: string | null; referral_rewarded: boolean; email_verified: boolean }>("SELECT email, referred_by, referral_rewarded, email_verified FROM users WHERE id = $1", [userId]);
  if (!u?.referred_by || u.referral_rewarded || !u.email_verified) return;
  const referrer = await one<{ user_id: string; email: string }>("SELECT p.user_id, u.email FROM pages p JOIN users u ON u.id = p.user_id WHERE p.handle = $1", [u.referred_by]);
  if (!referrer || referrer.user_id === userId) return;
  // A lead or booking from either creator's own address doesn't count.
  const v = visitorEmail.toLowerCase();
  if (v === u.email.toLowerCase() || v === referrer.email.toLowerCase()) return;
  // Claim the reward first, so two leads arriving at the same moment can't pay it twice.
  const claimed = await one("UPDATE users SET referral_rewarded = TRUE WHERE id = $1 AND referral_rewarded = FALSE RETURNING id", [userId]);
  if (!claimed) return;
  await addProMonth(userId);
  await addProMonth(referrer.user_id);
  await sendMail(u.email, "You got a free month of Showz Pro", "<p>You just got your first lead or booking. Because a friend invited you, you both get a free month of Pro. Enjoy!</p>").catch(() => {});
  await sendMail(referrer.email, "A creator you invited got their first lead: free Pro month for you", "<p>A creator who joined from your page just got their first lead or booking, so you both get a free month of Pro. Invite more from your dashboard.</p>").catch(() => {});
}
