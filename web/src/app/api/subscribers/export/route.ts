import { all } from "@/lib/db";
import { getSession } from "@/lib/session";
import { pageForUser, planForUser } from "@/lib/account";

// GET /api/subscribers/export — CSV of the creator's list. Pro only.
export async function GET(req: Request) {
  const session = await getSession();
  if (!session?.userId) return new Response("Unauthorized", { status: 401 });
  if ((await planForUser(session.userId)) !== "pro") return new Response("CSV export is a Pro feature", { status: 402 });
  const page = await pageForUser(session.userId, new URL(req.url).searchParams.get("page"));
  if (!page) return new Response("No page", { status: 404 });
  const rows = await all<{ email: string; name: string | null; source: string | null; created_at: number; consented_at: number | null }>("SELECT s.email, s.name, s.source, s.created_at, s.consented_at FROM subscribers s WHERE s.page_id = $1 ORDER BY s.created_at DESC", [page.id]);
  // Guard against CSV formula injection in spreadsheet apps.
  const cell = (v: string) => `"${(/^[=+\-@]/.test(v) ? "'" + v : v).replace(/"/g, '""')}"`;
  const csv = ["email,name,source,subscribed_at,consented_at", ...rows.map((r) => `${cell(r.email)},${cell(r.name ?? "")},${cell(r.source ?? "email box")},${new Date(r.created_at).toISOString()},${r.consented_at ? new Date(Number(r.consented_at)).toISOString() : ""}`)].join("\n");
  return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${page.handle}-subscribers.csv"` } });
}
