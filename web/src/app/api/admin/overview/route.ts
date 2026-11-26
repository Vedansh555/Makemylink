import { NextResponse } from "next/server";
import { all, one } from "@/lib/db";
import { adminUserId } from "@/lib/admin";
import { setupStatus } from "@/lib/setupStatus";

export const dynamic = "force-dynamic";

// GET ?q= — site totals and a searchable list of users, for the admin panel.
export async function GET(req: Request) {
  if (!(await adminUserId())) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().toLowerCase().slice(0, 80);
  const now = Date.now();
  const week = now - 7 * 86_400_000;

  const totals = await one<{ users: number; pro: number; new7: number; pages: number; suspended: number; subs: number; bookings: number }>(
    `SELECT
       (SELECT COUNT(*)::int FROM users) AS users,
       (SELECT COUNT(*)::int FROM users WHERE plan = 'pro' AND (plan_renews_at IS NULL OR plan_renews_at > $1)) AS pro,
       (SELECT COUNT(*)::int FROM users WHERE created_at > $2) AS new7,
       (SELECT COUNT(*)::int FROM pages) AS pages,
       (SELECT COUNT(*)::int FROM pages WHERE suspended = TRUE) AS suspended,
       (SELECT COUNT(*)::int FROM subscribers) AS subs,
       (SELECT COUNT(*)::int FROM bookings) AS bookings`,
    [now, week],
  );
  const users = await all(
    `SELECT u.id, u.email, u.plan, u.plan_renews_at, u.created_at, u.email_verified, u.verified_label, u.referred_by, p.handle, COALESCE(p.suspended, FALSE) AS suspended,
            (SELECT COUNT(*)::int FROM events e WHERE e.page_id = p.id AND e.kind = 'view') AS views
     FROM users u LEFT JOIN pages p ON p.user_id = u.id
     WHERE ($1 = '' OR LOWER(u.email) LIKE '%' || $1 || '%' OR LOWER(COALESCE(p.handle, '')) LIKE '%' || $1 || '%')
     ORDER BY u.created_at DESC LIMIT 100`,
    [q],
  );
  const payments = await all("SELECT provider, amount, currency, status, created_at FROM payments ORDER BY created_at DESC LIMIT 10");
  const reports = await all(
    `SELECT r.id, r.handle, r.reason, r.details, r.reporter_email, r.created_at, p.user_id, COALESCE(p.suspended, FALSE) AS suspended
     FROM reports r LEFT JOIN pages p ON p.handle = r.handle WHERE r.resolved_at IS NULL ORDER BY r.created_at DESC LIMIT 50`,
  );
  return NextResponse.json({ totals, users, payments, reports, setup: setupStatus() });
}
