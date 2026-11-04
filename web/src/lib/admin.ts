import { one } from "./db";
import { getSession } from "./session";

/** Returns the admin's user id, or null. Admins are the emails listed in ADMIN_EMAILS (comma separated). */
export async function adminUserId(): Promise<string | null> {
  const allowed = (process.env.ADMIN_EMAILS ?? "").toLowerCase().split(",").map((e) => e.trim()).filter(Boolean);
  if (!allowed.length) return null;
  const session = await getSession();
  if (!session?.userId) return null;
  const u = await one<{ email: string; email_verified: boolean }>("SELECT email, email_verified FROM users WHERE id = $1", [session.userId]);
  return u && allowed.includes(u.email.toLowerCase()) ? session.userId : null;
}
