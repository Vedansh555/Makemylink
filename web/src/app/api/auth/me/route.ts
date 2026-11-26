import { NextResponse } from "next/server";
import { adminUserId } from "@/lib/admin";
import { getSession, setSessionCookie } from "@/lib/session";
import { one } from "@/lib/db";
import { planForUser } from "@/lib/account";

export async function GET() {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Sliding session: each visit renews the cookie, so active users are never logged out.
  await setSessionCookie({ userId: session.userId });

  const user = await one<{ id: string; email: string; created_at: number; plan_renews_at: number | null; email_verified: boolean; verified_label: string | null; referred_by: string | null }>(
    "SELECT id, email, created_at, plan_renews_at, email_verified, verified_label, referred_by FROM users WHERE id = $1",
    [session.userId],
  );
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 401 });
  }

  const page = await one<{ handle: string }>("SELECT handle FROM pages WHERE user_id = $1 ORDER BY created_at ASC LIMIT 1", [session.userId]);

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      createdAt: user.created_at,
      handle: page?.handle,
      plan: await planForUser(user.id),
      planRenewsAt: user.plan_renews_at,
      emailVerified: user.email_verified,
      verifiedLabel: user.verified_label,
      isAdmin: !!(await adminUserId()),
      invites: await one<{ joined: number; rewarded: number }>(
        "SELECT COUNT(*)::int AS joined, COUNT(*) FILTER (WHERE u.referral_rewarded)::int AS rewarded FROM users u WHERE u.referred_by IN (SELECT handle FROM pages WHERE user_id = $1)",
        [user.id],
      ),
    },
  });
}
