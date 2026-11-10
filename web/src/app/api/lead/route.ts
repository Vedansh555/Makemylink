import { NextResponse } from "next/server";
import crypto from "crypto";
import { one, run } from "@/lib/db";
import { clientIp, rateLimit, sameOriginOnly } from "@/lib/security";
import { FREE_LIMITS } from "@/lib/plans";
import { planForUser } from "@/lib/account";
import type { Profile } from "@/lib/types";

// POST /api/lead {handle, linkId, name, email} — a visitor asks to chat on WhatsApp. We save them as a lead, then give back the WhatsApp link.
export async function POST(req: Request) {
  const blocked = sameOriginOnly(req) ?? rateLimit(`lead:${clientIp(req)}`, 20, 60 * 60 * 1000);
  if (blocked) return blocked;
  const b = (await req.json().catch(() => ({}))) as { handle?: string; linkId?: string; name?: string; email?: string; consent?: boolean };
  if (b.consent !== true) return NextResponse.json({ error: "Please tick the box to agree to share your details" }, { status: 400 });
  const email = String(b.email ?? "").toLowerCase().trim();
  const name = String(b.name ?? "").trim().slice(0, 80);
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return NextResponse.json({ error: "Enter your name and a valid email" }, { status: 400 });

  const page = await one<{ id: string; user_id: string; profile_json: string }>("SELECT id, user_id, profile_json FROM pages WHERE handle = $1 AND suspended = FALSE", [String(b.handle ?? "").toLowerCase()]);
  if (!page) return NextResponse.json({ error: "Page not found" }, { status: 404 });
  const profile = JSON.parse(page.profile_json) as Profile;
  const link = profile.links.find((l) => l.id === b.linkId && l.kind === "whatsapp" && l.whatsapp);
  const phone = (link?.whatsapp?.phone ?? "").replace(/\D/g, "");
  if (!link || phone.length < 8) return NextResponse.json({ error: "This chat link is not set up" }, { status: 404 });

  const plan = await planForUser(page.user_id);
  const existing = await one("SELECT id FROM subscribers WHERE page_id = $1 AND email = $2", [page.id, email]);
  if (!existing && plan === "free") {
    const c = await one<{ n: number }>("SELECT COUNT(*)::int AS n FROM subscribers WHERE page_id = $1", [page.id]);
    // The visitor can still chat when the free list is full; we just don't store them.
    if ((c?.n ?? 0) >= FREE_LIMITS.subscribers) return NextResponse.json({ ok: true, url: waUrl(phone, link.whatsapp!.message, name) });
  }
  await run("INSERT INTO subscribers (id, page_id, email, name, source, created_at, consented_at) VALUES ($1,$2,$3,$4,'whatsapp',$5,$5) ON CONFLICT (page_id, email) DO UPDATE SET name = EXCLUDED.name, consented_at = EXCLUDED.consented_at", [crypto.randomUUID(), page.id, email, name, Date.now()]);
  return NextResponse.json({ ok: true, url: waUrl(phone, link.whatsapp!.message, name) });
}

const waUrl = (phone: string, message: string, name: string) => `https://wa.me/${phone}?text=${encodeURIComponent(`${message || "Hi!"}\n\n- ${name}`.slice(0, 900))}`;
