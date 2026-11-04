import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { one } from "@/lib/db";
import { deleteAccount } from "@/lib/account";
import { clearSessionCookie, getSession } from "@/lib/session";
import { rateLimit, sameOriginOnly } from "@/lib/security";

// DELETE {password} — removes the account, its page, emails, bookings, stats and link checks.
// Payment records stay (anonymised) because the law may require them.
export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const blocked = sameOriginOnly(req) ?? rateLimit(`delete-acct:${session.userId}`, 5, 60 * 60 * 1000);
  if (blocked) return blocked;
  const { password } = (await req.json().catch(() => ({}))) as { password?: string };
  const user = await one<{ password_hash: string }>("SELECT password_hash FROM users WHERE id = $1", [session.userId]);
  if (!user || typeof password !== "string" || !(await bcrypt.compare(password, user.password_hash))) {
    return NextResponse.json({ error: "Wrong password" }, { status: 403 });
  }
  await deleteAccount(session.userId);
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
