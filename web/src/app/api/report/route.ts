import { NextResponse } from "next/server";
import crypto from "crypto";
import { one, run } from "@/lib/db";
import { clientIp, rateLimit, sameOriginOnly } from "@/lib/security";
import { esc, sendMail } from "@/lib/mail";
import { SITE_URL } from "@/lib/site";

const REASONS = ["Scam or fraud", "Phishing or fake login", "Pretending to be someone else", "Harassment or hate", "Adult or illegal content", "Something else"];

// POST {handle, reason, details, email}: anyone can report a page. Admins get an email and can suspend it from /admin.
export async function POST(req: Request) {
  const blocked = sameOriginOnly(req) ?? rateLimit(`report:${clientIp(req)}`, 8, 60 * 60 * 1000);
  if (blocked) return blocked;
  const b = (await req.json().catch(() => ({}))) as { handle?: string; reason?: string; details?: string; email?: string };
  const handle = String(b.handle ?? "").toLowerCase().replace(/^@/, "").trim();
  const reason = REASONS.includes(String(b.reason)) ? String(b.reason) : "";
  const email = String(b.email ?? "").trim().slice(0, 254);
  if (!/^[a-z0-9_-]{2,30}$/.test(handle) || !reason) return NextResponse.json({ error: "Choose a page and a reason" }, { status: 400 });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "That email doesn't look right" }, { status: 400 });
  if (!(await one("SELECT id FROM pages WHERE handle = $1", [handle]))) return NextResponse.json({ error: "We couldn't find that page" }, { status: 404 });

  const details = String(b.details ?? "").slice(0, 1000);
  await run("INSERT INTO reports (id, handle, reason, details, reporter_email, created_at) VALUES ($1,$2,$3,$4,$5,$6)", [crypto.randomUUID(), handle, reason, details, email || null, Date.now()]);
  const admins = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean);
  for (const a of admins) {
    await sendMail(a, `Page reported: @${handle} (${reason})`, `<p><a href="${SITE_URL}/${esc(handle)}">${SITE_URL}/${esc(handle)}</a> was reported for <b>${esc(reason)}</b>.</p>${details ? `<p>${esc(details)}</p>` : ""}${email ? `<p>Reporter: ${esc(email)}</p>` : ""}<p>Suspend it from the admin panel if it breaks the rules.</p>`).catch(() => {});
  }
  return NextResponse.json({ ok: true });
}
