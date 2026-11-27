import { all, one, run } from "./db";
import { esc, sendMail } from "./mail";
import { PRO_PRICE } from "./payments";
import { FREE_LIMITS } from "./plans";
import { SITE_URL } from "./site";

// Pro is prepaid and never renews by itself, so the creator is told before it ends: a week before, a day before,
// and once more when it ends (while the 2-day grace period is still running).

export type ProStage = "week" | "day" | "ended";

const DAY = 86_400_000;
/** Same grace period as planForUser. */
const GRACE = 2 * DAY;

/** Which email is due for a Pro end date, if any. */
export function stageFor(renewsAt: number, now = Date.now()): ProStage | null {
  const left = renewsAt - now;
  if (left > 7 * DAY || left <= -GRACE) return null;
  if (left <= 0) return "ended";
  if (left <= DAY) return "day";
  return left > 2 * DAY ? "week" : null;
}

function mail(stage: ProStage, renewsAt: number) {
  const date = (ms: number) => new Intl.DateTimeFormat("en-IN", { dateStyle: "long", timeZone: "Asia/Kolkata" }).format(new Date(ms));
  const subject = stage === "ended" ? "Your Showz Pro has ended" : stage === "day" ? "Your Showz Pro ends tomorrow" : `Your Showz Pro ends on ${date(renewsAt)}`;
  const title = stage === "ended" ? "Your Pro has ended" : stage === "day" ? "Your Pro ends tomorrow" : "Your Pro ends soon";
  const lead =
    stage === "ended"
      ? `Pro ended on ${date(renewsAt)}. Your page keeps its Pro features until ${date(renewsAt + GRACE)}, then moves to the Free plan.`
      : `Pro runs until ${date(renewsAt)}. Nothing is charged automatically.`;
  const { IN, GLOBAL } = PRO_PRICE;
  const html = `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto;line-height:1.55;color:#111"><h2 style="margin:0 0 8px">${esc(title)}</h2><p>${esc(lead)}</p><p>On Free, your page stays online, but paid bookings are switched off, you keep up to ${FREE_LIMITS.links} links and ${FREE_LIMITS.looks} products, Pro themes change to a free one and the Showz badge returns. Nothing is deleted: your cards, products and settings stay saved, and come back as soon as you renew.</p><p><a href="${SITE_URL}/dashboard?tab=billing" style="background:#111;color:#fff;padding:11px 18px;border-radius:10px;text-decoration:none;display:inline-block">Renew Pro</a></p><p style="font-size:13px;color:#555">₹${IN.monthly} a month or ₹${IN.yearly.toLocaleString("en-IN")} a year in India, $${GLOBAL.monthly} or $${GLOBAL.yearly} elsewhere. Renewing early adds to the time you have left.</p><p style="color:#888;font-size:12px;margin-top:28px">Sent by Showz because your account has Pro.</p></div>`;
  return { subject, html };
}

/** Sends whatever is due. Safe to run every few minutes: each email goes out once per end date. */
export async function sendProReminders(now = Date.now()): Promise<number> {
  const rows = await all<{ id: string; email: string; plan_renews_at: number; pro_notice: string | null }>(
    "SELECT id, email, plan_renews_at, pro_notice FROM users WHERE plan = 'pro' AND plan_renews_at > $1 AND plan_renews_at <= $2 ORDER BY plan_renews_at",
    [now - GRACE, now + 7 * DAY],
  );
  let sent = 0;
  for (const u of rows) {
    if (sent >= 30) break; // the rest go on the next run
    const stage = stageFor(u.plan_renews_at, now);
    if (!stage) continue;
    const key = `${stage}:${u.plan_renews_at}`;
    if (u.pro_notice === key) continue;
    // Claim it first, so two runs at the same moment can't both send. The date check skips anyone who just renewed.
    const mine = await one("UPDATE users SET pro_notice = $1 WHERE id = $2 AND plan_renews_at = $3 AND pro_notice IS DISTINCT FROM $1 RETURNING id", [key, u.id, u.plan_renews_at]);
    if (!mine) continue;
    const { subject, html } = mail(stage, u.plan_renews_at);
    if (await sendMail(u.email, subject, html)) sent++;
    // Not delivered to the mail service: forget the claim so the next run tries again.
    else await run("UPDATE users SET pro_notice = $1 WHERE id = $2", [u.pro_notice, u.id]);
  }
  return sent;
}
