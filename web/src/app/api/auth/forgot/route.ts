import { NextResponse } from "next/server";
import { one } from "@/lib/db";
import { clientIp, rateLimit, sameOriginOnly } from "@/lib/security";
import { sendResetEmail } from "@/lib/authmail";

// POST {email} — always answers the same way, so nobody can use it to find out which emails have accounts.
export async function POST(req: Request) {
  const blocked = sameOriginOnly(req) ?? rateLimit(`forgot-ip:${clientIp(req)}`, 10, 60 * 60 * 1000);
  if (blocked) return blocked;
  const { email } = (await req.json().catch(() => ({}))) as { email?: string };
  const clean = String(email ?? "").toLowerCase().trim();
  if (clean && clean.length <= 254) {
    const accountBlocked = rateLimit(`forgot-acct:${clean}`, 3, 60 * 60 * 1000);
    if (!accountBlocked) {
      const user = await one<{ id: string }>("SELECT id FROM users WHERE email = $1", [clean]);
      if (user) await sendResetEmail(user.id, clean).catch((e) => console.error("reset mail", e));
    }
  }
  return NextResponse.json({ ok: true });
}
