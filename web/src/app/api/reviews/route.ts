import { NextResponse } from "next/server";
import crypto from "crypto";
import { one, run } from "@/lib/db";
import { getSession } from "@/lib/session";
import { clientIp, rateLimit, sameOriginOnly } from "@/lib/security";
import { actionOk } from "@/lib/bookingActions";
import { reviewsForUser } from "@/lib/sessionExtras";
import { esc, sendMail } from "@/lib/mail";
import { SITE_URL } from "@/lib/site";
import type { Profile, Review } from "@/lib/types";

// POST {id, k, rating, quote, name, role}: a buyer reviews their session from the link in the "How was it?" email.
export async function POST(req: Request) {
  const blocked = sameOriginOnly(req) ?? rateLimit(`review:${clientIp(req)}`, 10, 60 * 60 * 1000);
  if (blocked) return blocked;
  const b = (await req.json().catch(() => ({}))) as { id?: string; k?: string; rating?: number; quote?: string; name?: string; role?: string };
  const id = String(b.id ?? "");
  if (!actionOk(id, "review", String(b.k ?? ""))) return NextResponse.json({ error: "This link isn't valid" }, { status: 403 });
  const rating = Math.round(Number(b.rating));
  const quote = String(b.quote ?? "").trim().slice(0, 400);
  const name = String(b.name ?? "").trim().slice(0, 60);
  const role = String(b.role ?? "").trim().slice(0, 80);
  if (!(rating >= 1 && rating <= 5) || quote.length < 5 || !name) return NextResponse.json({ error: "Add a star rating, a few words and your name" }, { status: 400 });
  const bk = await one<{ page_id: string; status: string; owner: string; buyer_name: string }>("SELECT b.page_id, b.status, u.email AS owner, b.buyer_name FROM bookings b JOIN pages p ON p.id = b.page_id JOIN users u ON u.id = p.user_id WHERE b.id = $1", [id]);
  if (!bk || bk.status !== "confirmed") return NextResponse.json({ error: "This session can't be reviewed" }, { status: 404 });
  const added = await one("INSERT INTO buyer_reviews (id, booking_id, page_id, name, role, quote, rating, status, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,'pending',$8) ON CONFLICT (booking_id) DO NOTHING RETURNING id", [crypto.randomUUID(), id, bk.page_id, name, role || null, quote, rating, Date.now()]);
  if (!added) return NextResponse.json({ error: "You already reviewed this session. Thank you!" }, { status: 409 });
  await sendMail(bk.owner, `New ${rating}-star review from ${bk.buyer_name}`, `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto;line-height:1.55;color:#111"><h2 style="margin:0 0 8px">${"★".repeat(rating)}${"☆".repeat(5 - rating)}</h2><p>“${esc(quote)}”<br>– ${esc(name)}${role ? `, ${esc(role)}` : ""}</p><p><a href="${SITE_URL}/dashboard?tab=bookings" style="background:#111;color:#fff;padding:11px 18px;border-radius:10px;text-decoration:none;display:inline-block">Show it on my page</a></p><p style="color:#888;font-size:12px">It appears on your page only if you approve it.</p></div>`).catch(() => {});
  return NextResponse.json({ ok: true });
}

// GET: the creator's reviews from buyers.
export async function GET() {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ reviews: await reviewsForUser(session.userId) });
}

// PATCH {id, action: "approve" | "hide"}: approving adds the review to the page (newest first, up to 12).
export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const blocked = sameOriginOnly(req);
  if (blocked) return blocked;
  const { id, action } = (await req.json().catch(() => ({}))) as { id?: string; action?: string };
  const r = await one<{ id: string; page_id: string; name: string; role: string | null; quote: string; rating: number; profile_json: string }>(
    "SELECT r.id, r.page_id, r.name, r.role, r.quote, r.rating, p.profile_json FROM buyer_reviews r JOIN pages p ON p.id = r.page_id WHERE r.id = $1 AND p.user_id = $2",
    [String(id ?? ""), session.userId],
  );
  if (!r || (action !== "approve" && action !== "hide")) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const profile = JSON.parse(r.profile_json) as Profile;
  const others = (profile.reviews ?? []).filter((x) => x.id !== `buyer-${r.id}`);
  const review: Review = { id: `buyer-${r.id}`, name: r.name, role: r.role ?? undefined, quote: r.quote, rating: r.rating };
  profile.reviews = action === "approve" ? [review, ...others].slice(0, 12) : others;
  await run("UPDATE pages SET profile_json = $1, updated_at = $2 WHERE id = $3", [JSON.stringify(profile), Date.now(), r.page_id]);
  await run("UPDATE buyer_reviews SET status = $1 WHERE id = $2", [action === "approve" ? "approved" : "hidden", r.id]);
  return NextResponse.json({ ok: true });
}
