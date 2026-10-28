import { NextResponse } from "next/server";
import { getSession, setSessionCookie } from "@/lib/session";
import { getDb } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Sliding session: each visit renews the cookie, so active users are never logged out.
  await setSessionCookie({ userId: session.userId });

  const db = getDb();
  const user = db.prepare("SELECT id, email, created_at FROM users WHERE id = ?").get(session.userId) as
    | { id: string; email: string; created_at: number }
    | undefined;

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 401 });
  }

  const page = db.prepare("SELECT handle FROM pages WHERE user_id = ?").get(session.userId) as
    | { handle: string }
    | undefined;

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      createdAt: user.created_at,
      handle: page?.handle,
    },
  });
}
