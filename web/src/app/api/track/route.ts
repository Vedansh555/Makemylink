import { NextResponse } from "next/server";
import { one, run } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/security";

// POST /api/track {handle, target} — records a link click. Sent with sendBeacon, so no CSRF token.
export async function POST(req: Request) {
  if (rateLimit(`track:${clientIp(req)}`, 120, 60 * 1000)) return NextResponse.json({ ok: true });
  const { handle, target } = (await req.json().catch(() => ({}))) as { handle?: string; target?: string };
  if (!handle || !target) return NextResponse.json({ ok: true });
  const page = await one<{ id: string }>("SELECT id FROM pages WHERE handle = $1", [String(handle).toLowerCase()]);
  if (page) {
    const country = req.headers.get("cf-ipcountry") ?? req.headers.get("x-vercel-ip-country");
    await run("INSERT INTO events (page_id, kind, target, country, created_at) VALUES ($1,'click',$2,$3,$4)", [page.id, String(target).slice(0, 64), country, Date.now()]);
  }
  return NextResponse.json({ ok: true });
}
