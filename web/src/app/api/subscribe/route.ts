import { NextResponse } from "next/server";
import crypto from "crypto";
import { one, run } from "@/lib/db";
import { clientIp, rateLimit, sameOriginOnly } from "@/lib/security";
import { FREE_LIMITS } from "@/lib/plans";
import { planForUser } from "@/lib/account";

// POST /api/subscribe {handle, email} — a visitor joins a creator's list.
export async function POST(req: Request) {
  const blocked = sameOriginOnly(req) ?? rateLimit(`sub:${clientIp(req)}`, 20, 60 * 60 * 1000);
  if (blocked) return blocked;
  const { handle, email, consent } = (await req.json().catch(() => ({}))) as { handle?: string; email?: string; consent?: boolean };
  if (consent !== true) return NextResponse.json({ error: "Please tick the box to agree to share your email" }, { status: 400 });
  const clean = String(email ?? "").toLowerCase().trim();
  if (!handle || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean) || clean.length > 254) {
    return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
  }
  const page = await one<{ id: string; user_id: string }>("SELECT id, user_id FROM pages WHERE handle = $1", [String(handle).toLowerCase()]);
  if (!page) return NextResponse.json({ ok: true }); // demo pages: accept silently
  if ((await planForUser(page.user_id)) === "free") {
    const c = await one<{ n: number }>("SELECT COUNT(*)::int AS n FROM subscribers WHERE page_id = $1", [page.id]);
    if ((c?.n ?? 0) >= FREE_LIMITS.subscribers) return NextResponse.json({ error: "This list is full right now." }, { status: 409 });
  }
  await run("INSERT INTO subscribers (id, page_id, email, created_at, consented_at) VALUES ($1,$2,$3,$4,$4) ON CONFLICT (page_id, email) DO NOTHING", [
    crypto.randomUUID(),
    page.id,
    clean,
    Date.now(),
  ]);
  return NextResponse.json({ ok: true });
}
