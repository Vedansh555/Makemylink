import { one } from "./db";
import { getSession } from "./session";

/** Returns the admin's user id, or null. Admins are the emails listed in ADMIN_EMAILS (comma separated). */
export async function adminUserId(): Promise<string | null> {
  const allowed = (process.env.ADMIN_EMAILS ?? "").toLowerCase().split(",").map((e) => e.trim()).filter(Boolean);
  if (!allowed.length) return null;
  const session = await getSession();
  if (!session?.userId) return null;
  const u = await one<{ email: string; email_verified: boolean }>("SELECT email, email_verified FROM users WHERE id = $1", [session.userId]);
  if (!u || !allowed.includes(u.email.toLowerCase())) return null;
  // Once emails can be sent, the address must be confirmed, so nobody can claim an admin address that isn't theirs.
  return !process.env.RESEND_API_KEY || u.email_verified ? session.userId : null;
}
