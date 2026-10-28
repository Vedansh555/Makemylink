import { NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";
import { setSessionCookie } from "@/lib/session";
import { blankProfile } from "@/lib/demo";
import { RESERVED_HANDLES, clientIp, rateLimit, sameOriginOnly } from "@/lib/security";

export async function POST(req: Request) {
  const blocked = sameOriginOnly(req) ?? rateLimit(`signup:${clientIp(req)}`, 5, 60 * 60 * 1000);
  if (blocked) return blocked;
  try {
    const body = await req.json();
    const { email, password, handle } = body ?? {};

    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
    }

    if (!password || typeof password !== "string" || password.length < 8 || password.length > 72) {
      return NextResponse.json({ error: "Password must be 8-72 characters" }, { status: 400 });
    }

    if (!handle || typeof handle !== "string" || !/^[a-zA-Z0-9_-]{2,30}$/.test(handle)) {
      return NextResponse.json({ error: "Handle must be 2-30 characters (alphanumeric, dashes, underscores)" }, { status: 400 });
    }

    const cleanHandle = handle.toLowerCase();
    if (RESERVED_HANDLES.has(cleanHandle)) {
      return NextResponse.json({ error: "That handle is reserved" }, { status: 400 });
    }
    const cleanEmail = email.toLowerCase().trim();

    const db = getDb();

    // Check existing email
    const existingUser = db.prepare("SELECT id FROM users WHERE email = ?").get(cleanEmail);
    if (existingUser) {
      return NextResponse.json({ error: "Email is already registered" }, { status: 409 });
    }

    // Check existing handle in pages
    const existingPage = db.prepare("SELECT id FROM pages WHERE handle = ?").get(cleanHandle);
    if (existingPage) {
      return NextResponse.json({ error: "Handle is already claimed" }, { status: 409 });
    }

    const userId = crypto.randomUUID();
    const pageId = crypto.randomUUID();
    const now = Date.now();
    const passwordHash = await bcrypt.hash(password, 12);

    const initialProfile = {
      ...blankProfile,
      handle: cleanHandle,
      name: cleanHandle.charAt(0).toUpperCase() + cleanHandle.slice(1),
    };

    const tx = db.transaction(() => {
      db.prepare(`
        INSERT INTO users (id, email, password_hash, created_at)
        VALUES (?, ?, ?, ?)
      `).run(userId, cleanEmail, passwordHash, now);

      db.prepare(`
        INSERT INTO pages (id, user_id, handle, profile_json, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(pageId, userId, cleanHandle, JSON.stringify(initialProfile), now, now);
    });

    tx();

    await setSessionCookie({ userId });

    return NextResponse.json({
      user: { id: userId, email: cleanEmail },
      page: { handle: cleanHandle, profile: initialProfile },
    });
  } catch (err: unknown) {
    console.error("Signup error:", err);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
