import { NextResponse } from "next/server";
import crypto from "crypto";
import { all, one, transaction } from "@/lib/db";
import { getSession } from "@/lib/session";
import { planForUser } from "@/lib/account";
import { PAGE_LIMITS } from "@/lib/plans";
import { blankProfile } from "@/lib/demo";
import { RESERVED_HANDLES, rateLimit, sameOriginOnly } from "@/lib/security";

// GET /api/pages — every page of the logged-in account, with simple numbers.
export async function GET() {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const plan = await planForUser(session.userId);
  const since = Date.now() - 30 * 86_400_000;
  const rows = await all<{ id: string; handle: string; profile_json: string; created_at: number; views: number; subs: number }>(
    `SELECT p.id, p.handle, p.profile_json, p.created_at,
       (SELECT COUNT(*)::int FROM events e WHERE e.page_id = p.id AND e.kind = 'view' AND e.created_at >= $2) AS views,
       (SELECT COUNT(*)::int FROM subscribers s WHERE s.page_id = p.id) AS subs
     FROM pages p WHERE p.user_id = $1 ORDER BY p.created_at ASC`,
    [session.userId, since],
  );
  const pages = rows.map((r, i) => {
    let name = r.handle;
    try { name = (JSON.parse(r.profile_json) as { name?: string }).name || r.handle; } catch {}
    return { id: r.id, handle: r.handle, name, views: r.views, subs: r.subs, primary: i === 0 };
  });
  return NextResponse.json({ pages, plan, limit: PAGE_LIMITS[plan] });
}

// POST /api/pages {handle} — add another page. Free accounts have one; Pro has up to five.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const blocked = sameOriginOnly(req) ?? rateLimit(`newpage:${session.userId}`, 10, 60 * 60 * 1000);
  if (blocked) return blocked;
  const { handle } = (await req.json().catch(() => ({}))) as { handle?: string };
  if (!handle || !/^[a-zA-Z0-9_-]{2,30}$/.test(handle)) return NextResponse.json({ error: "Handle must be 2-30 characters (letters, numbers, dashes, underscores)" }, { status: 400 });
  const clean = handle.toLowerCase();
  if (RESERVED_HANDLES.has(clean)) return NextResponse.json({ error: "That handle is reserved" }, { status: 400 });

  const plan = await planForUser(session.userId);
  const id = crypto.randomUUID();
  const now = Date.now();
  const profile = { ...blankProfile, handle: clean, name: clean.charAt(0).toUpperCase() + clean.slice(1) };
  try {
    await transaction(async (tx) => {
      const c = (await tx.query("SELECT COUNT(*)::int AS n FROM pages WHERE user_id = $1", [session.userId])) as { n: number }[];
      if ((c[0]?.n ?? 0) >= PAGE_LIMITS[plan]) throw new Error("LIMIT");
      if (((await tx.query("SELECT id FROM pages WHERE handle = $1", [clean])) as unknown[]).length) throw new Error("TAKEN");
      await tx.query("INSERT INTO pages (id, user_id, handle, profile_json, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6)", [id, session.userId, clean, JSON.stringify(profile), now, now]);
    });
  } catch (e) {
    const m = (e as Error).message;
    if (m === "LIMIT") return NextResponse.json({ error: plan === "free" ? "Free accounts have 1 page. Go Pro for up to 5." : "You have reached the 5 page limit." }, { status: 402 });
    if (m === "TAKEN") return NextResponse.json({ error: "That handle is already claimed" }, { status: 409 });
    console.error("create page", e);
    return NextResponse.json({ error: "Could not create the page" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, id, handle: clean });
}

// DELETE /api/pages?id= — remove one extra page and its emails, bookings and stats. Your first page cannot be removed here.
export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const blocked = sameOriginOnly(req);
  if (blocked) return blocked;
  const id = new URL(req.url).searchParams.get("id");
  const first = await one<{ id: string }>("SELECT id FROM pages WHERE user_id = $1 ORDER BY created_at ASC LIMIT 1", [session.userId]);
  const target = id ? await one<{ id: string }>("SELECT id FROM pages WHERE id = $1 AND user_id = $2", [id, session.userId]) : null;
  if (!target) return NextResponse.json({ error: "Page not found" }, { status: 404 });
  if (target.id === first?.id) return NextResponse.json({ error: "Your first page can only be removed by deleting your account." }, { status: 400 });
  await transaction(async (tx) => {
    for (const t of ["subscribers", "bookings", "events", "link_health"]) await tx.query(`DELETE FROM ${t} WHERE page_id = $1`, [target.id]);
    await tx.query("DELETE FROM pages WHERE id = $1", [target.id]);
  });
  return NextResponse.json({ ok: true });
}
