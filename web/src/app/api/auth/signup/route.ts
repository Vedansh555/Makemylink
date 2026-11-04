import { NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { one, transaction } from "@/lib/db";
import { setSessionCookie } from "@/lib/session";
import { blankProfile } from "@/lib/demo";
import { RESERVED_HANDLES, clientIp, rateLimit, sameOriginOnly } from "@/lib/security";

export async function POST(req: Request) {
  const blocked = sameOriginOnly(req) ?? rateLimit(`signup:${clientIp(req)}`, 20, 60 * 60 * 1000);
  if (blocked) return blocked;
  try {
    const body = await req.json();
    const { email, password, handle, agreed } = body ?? {};

    if (agreed !== true) {
      return NextResponse.json({ error: "Please accept the Terms and Privacy Policy to continue" }, { status: 400 });
    }

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

    if (await one("SELECT id FROM users WHERE email = $1", [cleanEmail])) {
      return NextResponse.json({ error: "Email is already registered" }, { status: 409 });
    }
    if (await one("SELECT id FROM pages WHERE handle = $1", [cleanHandle])) {
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

    await transaction(async (tx) => {
      await tx.query("INSERT INTO users (id, email, password_hash, created_at) VALUES ($1, $2, $3, $4)", [userId, cleanEmail, passwordHash, now]);
      await tx.query("INSERT INTO pages (id, user_id, handle, profile_json, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6)", [
        pageId,
        userId,
        cleanHandle,
        JSON.stringify(initialProfile),
        now,
        now,
      ]);
    });

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
