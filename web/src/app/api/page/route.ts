import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getDb } from "@/lib/db";
import type { Profile } from "@/lib/types";
import { rateLimit, sameOriginOnly, sanitizeProfile } from "@/lib/security";

// GET /api/page — return the logged-in user's saved Profile JSON
export async function GET() {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const page = db.prepare("SELECT id, handle, profile_json, created_at, updated_at FROM pages WHERE user_id = ?").get(session.userId) as
    | { id: string; handle: string; profile_json: string; created_at: number; updated_at: number }
    | undefined;

  if (!page) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  try {
    const profile = JSON.parse(page.profile_json) as Profile;
    return NextResponse.json({ profile, handle: page.handle, updatedAt: page.updated_at });
  } catch {
    return NextResponse.json({ error: "Corrupted profile data" }, { status: 500 });
  }
}

// PUT /api/page — {profile} -> save it (overwrite profile_json, bump updated_at)
export async function PUT(req: Request) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const blocked = sameOriginOnly(req) ?? rateLimit(`save:${session.userId}`, 60, 60 * 1000);
  if (blocked) return blocked;

  try {
    const raw = await req.text();
    if (raw.length > 6_000_000) {
      return NextResponse.json({ error: "Page is too large (try smaller images)" }, { status: 413 });
    }
    const { profile } = JSON.parse(raw) ?? {};

    if (!profile || typeof profile !== "object") {
      return NextResponse.json({ error: "Profile object is required" }, { status: 400 });
    }

    const db = getDb();
    const existing = db.prepare("SELECT id, handle FROM pages WHERE user_id = ?").get(session.userId) as
      | { id: string; handle: string }
      | undefined;

    if (!existing) {
      return NextResponse.json({ error: "Page not found for user" }, { status: 404 });
    }

    const now = Date.now();
    let clean: Profile;
    try {
      clean = sanitizeProfile(profile, existing.handle);
    } catch {
      return NextResponse.json({ error: "Invalid profile" }, { status: 400 });
    }
    const profileJson = JSON.stringify(clean);

    db.prepare(`
      UPDATE pages
      SET profile_json = ?, updated_at = ?
      WHERE user_id = ?
    `).run(profileJson, now, session.userId);

    return NextResponse.json({ ok: true, updatedAt: now });
  } catch (err: unknown) {
    console.error("Save page error:", err);
    return NextResponse.json({ error: "Failed to save page" }, { status: 500 });
  }
}
