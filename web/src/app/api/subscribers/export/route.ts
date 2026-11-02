import { all } from "@/lib/db";
import { getSession } from "@/lib/session";
import { pageForUser, planForUser } from "@/lib/account";

// GET /api/subscribers/export — CSV of the creator's list. Pro only.
export async function GET() {
  const session = await getSession();
  if (!session?.userId) return new Response("Unauthorized", { status: 401 });
  if ((await planForUser(session.userId)) !== "pro") return new Response("CSV export is a Pro feature", { status: 402 });
  const page = await pageForUser(session.userId);
  if (!page) return new Response("No page", { status: 404 });
  const rows = await all<{ email: string; created_at: number }>("SELECT s.email, s.created_at FROM subscribers s JOIN pages p ON p.id = s.page_id WHERE p.user_id = $1 ORDER BY s.created_at DESC", [session.userId]);
  // Guard against CSV formula injection in spreadsheet apps.
  const cell = (v: string) => `"${(/^[=+\-@]/.test(v) ? "'" + v : v).replace(/"/g, '""')}"`;
  const csv = ["email,subscribed_at", ...rows.map((r) => `${cell(r.email)},${new Date(r.created_at).toISOString()}`)].join("\n");
  return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${page.handle}-subscribers.csv"` } });
}
