import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";
import { setSessionCookie } from "@/lib/session";
import { clientIp, rateLimit, sameOriginOnly } from "@/lib/security";

// Compared against when the email is unknown, so response time does not reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 12);

export async function POST(req: Request) {
  const blocked = sameOriginOnly(req) ?? rateLimit(`login:${clientIp(req)}`, 10, 15 * 60 * 1000);
  if (blocked) return blocked;
  try {
    const body = await req.json();
    const { email, password } = body ?? {};

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const db = getDb();

    const user = db.prepare("SELECT id, email, password_hash FROM users WHERE email = ?").get(cleanEmail) as
      | { id: string; email: string; password_hash: string }
      | undefined;

    if (!user) {
      await bcrypt.compare(String(password), DUMMY_HASH);
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const valid = await bcrypt.compare(String(password), user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    await setSessionCookie({ userId: user.id });

    return NextResponse.json({
      user: { id: user.id, email: user.email },
    });
  } catch (err: unknown) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Failed to log in" }, { status: 500 });
  }
}
