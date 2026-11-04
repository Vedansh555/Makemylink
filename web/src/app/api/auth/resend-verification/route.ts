import { NextResponse } from "next/server";
import { one } from "@/lib/db";
import { getSession } from "@/lib/session";
import { rateLimit, sameOriginOnly } from "@/lib/security";
import { sendVerifyEmail } from "@/lib/authmail";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const blocked = sameOriginOnly(req) ?? rateLimit(`resend-verify:${session.userId}`, 3, 60 * 60 * 1000);
  if (blocked) return blocked;
  const u = await one<{ email: string; email_verified: boolean }>("SELECT email, email_verified FROM users WHERE id = $1", [session.userId]);
  if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!u.email_verified) await sendVerifyEmail(session.userId, u.email).catch((e) => console.error("verify mail", e));
  return NextResponse.json({ ok: true });
}
