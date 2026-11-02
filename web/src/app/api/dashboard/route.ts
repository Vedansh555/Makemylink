import { NextResponse } from "next/server";
import { all, one } from "@/lib/db";
import { getSession } from "@/lib/session";
import { pageForUser, planForUser } from "@/lib/account";
import { FREE_LIMITS } from "@/lib/plans";
import type { Profile } from "@/lib/types";

// GET /api/dashboard — everything the dashboard shows, for the logged-in creator.
export async function GET() {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const page = await pageForUser(session.userId);
  if (!page) return NextResponse.json({ error: "No page" }, { status: 404 });
  const profile = JSON.parse(page.profile_json) as Profile;
  const plan = await planForUser(session.userId);
  const pid = (await one<{ id: string }>("SELECT id FROM pages WHERE user_id = $1", [session.userId]))!.id;

  const days = plan === "pro" ? 30 : FREE_LIMITS.analyticsDays;
  const since = Date.now() - days * 86_400_000;
  const dayKey = "to_char(to_timestamp(created_at / 1000.0) AT TIME ZONE 'UTC', 'YYYY-MM-DD')";
  const daily = await all<{ day: string; kind: string; n: number }>(
    `SELECT ${dayKey} AS day, kind, COUNT(*)::int AS n FROM events WHERE page_id = $1 AND created_at >= $2 GROUP BY 1, 2 ORDER BY 1`,
    [pid, since],
  );
  const perLink = plan === "pro"
    ? await all<{ target: string; n: number }>("SELECT target, COUNT(*)::int AS n FROM events WHERE page_id = $1 AND kind = 'click' AND created_at >= $2 GROUP BY target ORDER BY n DESC LIMIT 20", [pid, since])
    : [];
  const countries = plan === "pro"
    ? await all<{ country: string; n: number }>("SELECT country, COUNT(*)::int AS n FROM events WHERE page_id = $1 AND kind = 'view' AND country IS NOT NULL AND created_at >= $2 GROUP BY country ORDER BY n DESC LIMIT 8", [pid, since])
    : [];
  const subs = await one<{ n: number }>("SELECT COUNT(*)::int AS n FROM subscribers WHERE page_id = $1", [pid]);
  const recentSubs = await all<{ email: string; created_at: number }>("SELECT email, created_at FROM subscribers WHERE page_id = $1 ORDER BY created_at DESC LIMIT 25", [pid]);
  const bookings = await all("SELECT id, link_id, buyer_name, buyer_email, slot_start, note, amount, currency, status FROM bookings WHERE page_id = $1 ORDER BY slot_start DESC LIMIT 50", [pid]);
  const health = await all<{ link_id: string; url: string; status: number | null; ok: boolean; checked_at: number }>("SELECT link_id, url, status, ok, checked_at FROM link_health WHERE page_id = $1", [pid]);

  return NextResponse.json({
    plan,
    handle: page.handle,
    days,
    daily,
    perLink: perLink.map((r) => ({ ...r, title: profile.links.find((l) => l.id === r.target)?.title ?? r.target })),
    countries,
    subscribers: { total: subs?.n ?? 0, recent: recentSubs, limit: plan === "free" ? FREE_LIMITS.subscribers : null },
    bookings: bookings.map((b) => ({ ...b, title: profile.links.find((l) => l.id === (b as { link_id: string }).link_id)?.title ?? "Session" })),
    health,
  });
}
