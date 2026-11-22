import { NextResponse } from "next/server";
import { all, one } from "@/lib/db";
import { getSession } from "@/lib/session";
import { rateLimit } from "@/lib/security";
import { esc } from "@/lib/mail";
import type { Profile } from "@/lib/types";

/**
 * GET /api/export?format=json|html — "Your page can never vanish."
 * json: everything you own on Showz (pages, links, products, email list, bookings).
 * html: a plain web page per account that works anywhere, even if Showz were gone.
 */
export async function GET(req: Request) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const blocked = rateLimit(`export:${session.userId}`, 20, 60 * 60 * 1000);
  if (blocked) return blocked;
  const format = new URL(req.url).searchParams.get("format") === "html" ? "html" : "json";

  const user = await one<{ email: string; created_at: number }>("SELECT email, created_at FROM users WHERE id = $1", [session.userId]);
  const pages = await all<{ id: string; handle: string; profile_json: string }>("SELECT id, handle, profile_json FROM pages WHERE user_id = $1 ORDER BY created_at ASC", [session.userId]);
  const parsed = pages.map((p) => ({ id: p.id, handle: p.handle, profile: JSON.parse(p.profile_json) as Profile }));
  const day = new Date().toISOString().slice(0, 10);

  if (format === "html") {
    const body = parsed.map(({ handle, profile }) => {
      const links = profile.links
        .map((l) => {
          const href = l.url || l.booking?.paymentUrl || "";
          const extra = l.booking ? ` (${l.booking.durationMin} min, ${l.booking.currency === "INR" ? "₹" : "$"}${l.booking.price})` : "";
          return href ? `<li><a href="${esc(href)}">${esc(l.title)}</a>${esc(extra)}</li>` : `<li>${esc(l.title)}${esc(extra)}</li>`;
        })
        .join("");
      const looks = profile.looks.map((l) => `<li>${l.url ? `<a href="${esc(l.url)}">${esc(l.title)}</a>` : esc(l.title)}${l.price ? ` · ${esc(String(l.price))}` : ""}</li>`).join("");
      const socials = Object.entries(profile.socials).filter(([, v]) => v).map(([k, v]) => `<li>${esc(k)}: ${esc(String(v))}</li>`).join("");
      return `<section><h1>${esc(profile.name)}</h1><p class="h">@${esc(handle)}</p>${profile.bio ? `<p>${esc(profile.bio)}</p>` : ""}${links ? `<h2>Links</h2><ul>${links}</ul>` : ""}${looks ? `<h2>${esc(profile.shopTitle || "Shop")}</h2><ul>${looks}</ul>` : ""}${socials ? `<h2>Socials</h2><ul>${socials}</ul>` : ""}</section>`;
    });
    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(parsed[0]?.profile.name ?? "My page")}</title><style>body{font:16px/1.6 system-ui,sans-serif;max-width:560px;margin:40px auto;padding:0 16px;color:#111;background:#fff}h1{margin:0}.h{color:#777;margin-top:0}a{color:#111}li{margin:6px 0}section{margin-bottom:56px}footer{color:#999;font-size:13px}</style></head><body>${body.join("")}<footer>Backup made ${day}. You can put this file on any website host.</footer></body></html>`;
    return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Content-Disposition": `attachment; filename="showz-page-backup-${day}.html"` } });
  }

  const ids = pages.map((p) => p.id);
  const subscribers = ids.length ? await all("SELECT page_id, email, name, source, created_at, consented_at FROM subscribers WHERE page_id = ANY($1)", [ids]) : [];
  const bookings = ids.length ? await all("SELECT page_id, link_id, buyer_name, buyer_email, slot_start, note, amount, currency, status, created_at FROM bookings WHERE page_id = ANY($1)", [ids]) : [];
  const data = { exportedAt: new Date().toISOString(), account: { email: user?.email, createdAt: user?.created_at }, pages: parsed, emailList: subscribers, bookings };
  return new NextResponse(JSON.stringify(data, null, 2), { headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="showz-everything-${day}.json"` } });
}
