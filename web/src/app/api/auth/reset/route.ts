import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { run } from "@/lib/db";
import { clientIp, rateLimit, sameOriginOnly } from "@/lib/security";
import { consumeToken } from "@/lib/tokens";
import { setSessionCookie } from "@/lib/session";

// POST {token, password} — sets a new password from an emailed link, then signs the user in.
export async function POST(req: Request) {
  const blocked = sameOriginOnly(req) ?? rateLimit(`reset:${clientIp(req)}`, 20, 60 * 60 * 1000);
  if (blocked) return blocked;
  const { token, password } = (await req.json().catch(() => ({}))) as { token?: string; password?: string };
  if (typeof password !== "string" || password.length < 8 || password.length > 72) {
    return NextResponse.json({ error: "Password must be 8-72 characters" }, { status: 400 });
  }
  const userId = await consumeToken(String(token ?? ""), "reset");
  if (!userId) return NextResponse.json({ error: "This link is invalid or has expired. Ask for a new one." }, { status: 400 });
  await run("UPDATE users SET password_hash = $1 WHERE id = $2", [await bcrypt.hash(password, 12), userId]);
  // A reset link also proves the person controls the inbox.
  await run("UPDATE users SET email_verified = TRUE WHERE id = $1", [userId]);
  await setSessionCookie({ userId });
  return NextResponse.json({ ok: true });
}
