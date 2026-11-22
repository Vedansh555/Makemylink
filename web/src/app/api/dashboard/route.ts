import { NextResponse } from "next/server";
import { all, one } from "@/lib/db";
import { getSession } from "@/lib/session";
import { pageForUser, planForUser } from "@/lib/account";
import { FREE_LIMITS } from "@/lib/plans";
import type { Profile } from "@/lib/types";

// GET /api/dashboard — everything the dashboard shows, for the logged-in creator.
export async function GET(req: Request) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const page = await pageForUser(session.userId, new URL(req.url).searchParams.get("page"));
  if (!page) return NextResponse.json({ error: "No page" }, { status: 404 });
  const profile = JSON.parse(page.profile_json) as Profile;
  const plan = await planForUser(session.userId);
  const pid = page.id;

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
  const recentSubs = await all<{ email: string; name: string | null; source: string | null; created_at: number }>("SELECT email, name, source, created_at FROM subscribers WHERE page_id = $1 ORDER BY created_at DESC LIMIT 25", [pid]);
  const bookings = await all("SELECT id, link_id, buyer_name, buyer_email, slot_start, note, amount, currency, status FROM bookings WHERE page_id = $1 ORDER BY slot_start DESC LIMIT 50", [pid]);
  const health = await all<{ link_id: string; url: string; status: number | null; ok: boolean; checked_at: number }>("SELECT link_id, url, status, ok, checked_at FROM link_health WHERE page_id = $1", [pid]);

  const verified = await one<{ email_verified: boolean }>("SELECT email_verified FROM users WHERE id = $1", [session.userId]);
  const totalViews = await one<{ n: number }>("SELECT COUNT(*)::int AS n FROM events WHERE page_id = $1 AND kind = 'view'", [pid]);
  const hasBooking = profile.links.some((l) => l.kind === "booking");
  const defaultName = !profile.name || profile.name.toLowerCase() === page.handle.toLowerCase();
  // Plain steps that lead a new person from "published" to "earning".
  const checklist = [
    { key: "profile", label: "Add your name and photo", done: !!profile.avatar && !defaultName, href: "/create" },
    { key: "earn", label: "Add a booking card or products", done: hasBooking || profile.looks.length > 0, href: "/create?focus=booking" },
    { key: "email", label: "Turn on the email sign-up box", done: profile.showSubscribe, href: "/create" },
    { key: "share", label: "Share your link and get your first visit", done: (totalViews?.n ?? 0) > 0, href: `/${page.handle}` },
    { key: "verify", label: "Confirm your email address", done: !!verified?.email_verified },
    { key: "first", label: "Get your first email or booking", done: (subs?.n ?? 0) > 0 || bookings.length > 0 },
  ];

  return NextResponse.json({
    checklist,
    plan,
    bookingPage: hasBooking,
    hasProducts: profile.looks.length > 0,
    hasChat: profile.links.some((l) => l.kind === "whatsapp"),
    pageId: page.id,
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
