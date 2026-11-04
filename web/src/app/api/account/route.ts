import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { one, transaction } from "@/lib/db";
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
  const uid = session.userId;
  await transaction(async (tx) => {
    const pages = await tx.query("SELECT id FROM pages WHERE user_id = $1", [uid]);
    for (const p of pages as { id: string }[]) {
      for (const t of ["subscribers", "bookings", "events", "link_health"]) await tx.query(`DELETE FROM ${t} WHERE page_id = $1`, [p.id]);
    }
    await tx.query("DELETE FROM pages WHERE user_id = $1", [uid]);
    await tx.query("DELETE FROM password_resets WHERE user_id = $1", [uid]);
    await tx.query("UPDATE payments SET user_id = NULL WHERE user_id = $1", [uid]);
    await tx.query("DELETE FROM users WHERE id = $1", [uid]);
  });
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
