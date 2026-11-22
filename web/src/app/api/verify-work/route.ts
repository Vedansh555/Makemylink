import { NextResponse } from "next/server";
import { one, run } from "@/lib/db";
import { getSession } from "@/lib/session";
import { clientIp, rateLimit, sameOriginOnly } from "@/lib/security";
import { createToken, consumeToken } from "@/lib/tokens";
import { sendMail } from "@/lib/mail";
import { SITE_URL } from "@/lib/site";

// Free mailboxes prove nothing about where someone works or studies.
const FREE = new Set(["gmail.com", "googlemail.com", "yahoo.com", "yahoo.in", "yahoo.co.in", "outlook.com", "hotmail.com", "live.com", "msn.com", "icloud.com", "me.com", "aol.com", "proton.me", "protonmail.com", "rediffmail.com", "zoho.com", "yandex.com", "mail.com", "gmx.com", "tutanota.com", "hey.com", "fastmail.com"]);

// POST {email}: send a confirmation link to a work or college address. Once clicked, the page shows "Verified by Showz · <domain>".
export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const blocked = sameOriginOnly(req) ?? rateLimit(`workmail:${clientIp(req)}`, 6, 60 * 60 * 1000);
  if (blocked) return blocked;
  const { email } = (await req.json().catch(() => ({}))) as { email?: string };
  const clean = String(email ?? "").trim().toLowerCase();
  const domain = clean.split("@")[1] ?? "";
  if (!/^[^\s@]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(clean) || clean.length > 254) return NextResponse.json({ error: "Enter your work or college email" }, { status: 400 });
  if (FREE.has(domain)) return NextResponse.json({ error: "Use your work or college email, not a free one like Gmail" }, { status: 400 });

  await run("UPDATE users SET verify_pending = $1 WHERE id = $2", [domain, session.userId]);
  const token = await createToken(session.userId, "workmail", 2 * 86_400_000);
  const link = `${SITE_URL}/api/verify-work?token=${token}`;
  console.log(`[workmail-link] ${clean} ${link}`);
  await sendMail(
    clean,
    "Confirm your work email for your Showz badge",
    `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto;line-height:1.5"><h2>Get your Verified badge</h2><p>Tap the button to confirm you use this address. Your page will show "Verified by Showz · ${domain}". We never show the full address.</p><p><a href="${link}" style="background:#111;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;display:inline-block">Confirm</a></p><p style="font-size:12px;color:#666">The link works for 2 days.</p></div>`,
  );
  return NextResponse.json({ ok: true, domain });
}

// GET ?token=: the link in that email.
export async function GET(req: Request) {
  const userId = await consumeToken(new URL(req.url).searchParams.get("token") ?? "", "workmail");
  if (userId) {
    const u = await one<{ verify_pending: string | null }>("SELECT verify_pending FROM users WHERE id = $1", [userId]);
    if (u?.verify_pending) await run("UPDATE users SET verified_label = verify_pending, verified_at = $1, verify_pending = NULL WHERE id = $2", [Date.now(), userId]);
  }
  return NextResponse.redirect(`${SITE_URL}/dashboard?tab=account&${userId ? "badge=1" : "badge=expired"}`);
}

// DELETE: remove the badge.
export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const blocked = sameOriginOnly(req);
  if (blocked) return blocked;
  await run("UPDATE users SET verified_label = NULL, verified_at = NULL WHERE id = $1", [session.userId]);
  return NextResponse.json({ ok: true });
}
