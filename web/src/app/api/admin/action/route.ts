import { NextResponse } from "next/server";
import { one, run } from "@/lib/db";
import { adminUserId } from "@/lib/admin";
import { deleteAccount } from "@/lib/account";
import { runLinkCheck } from "@/lib/linkcheck";
import { rateLimit, sameOriginOnly } from "@/lib/security";

type Body = { action?: string; userId?: string; days?: number; reportId?: string };

// POST — admin actions. Every action here is limited to admins, and destructive ones need the user id.
export async function POST(req: Request) {
  const admin = await adminUserId();
  if (!admin) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const blocked = sameOriginOnly(req) ?? rateLimit(`admin:${admin}`, 60, 60 * 1000);
  if (blocked) return blocked;
  const b = (await req.json().catch(() => ({}))) as Body;

  if (b.action === "resolve_report") {
    if (typeof b.reportId !== "string") return NextResponse.json({ error: "Report not found" }, { status: 404 });
    await run("UPDATE reports SET resolved_at = $1 WHERE id = $2", [Date.now(), b.reportId]);
    return NextResponse.json({ ok: true });
  }

  if (b.action === "linkcheck") {
    return NextResponse.json({ checked: await runLinkCheck() });
  }

  const target = typeof b.userId === "string" ? await one<{ id: string }>("SELECT id FROM users WHERE id = $1", [b.userId]) : undefined;
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  switch (b.action) {
    case "grant_pro": {
      const days = Math.min(3650, Math.max(1, Math.round(Number(b.days) || 30)));
      const u = await one<{ plan_renews_at: number | null }>("SELECT plan_renews_at FROM users WHERE id = $1", [target.id]);
      const base = u?.plan_renews_at && u.plan_renews_at > Date.now() ? u.plan_renews_at : Date.now();
      await run("UPDATE users SET plan = 'pro', plan_provider = 'admin', plan_renews_at = $1 WHERE id = $2", [base + days * 86_400_000, target.id]);
      break;
    }
    case "revoke_pro":
      await run("UPDATE users SET plan = 'free', plan_renews_at = NULL WHERE id = $1", [target.id]);
      break;
    case "suspend":
      await run("UPDATE pages SET suspended = TRUE WHERE user_id = $1", [target.id]);
      break;
    case "unsuspend":
      await run("UPDATE pages SET suspended = FALSE WHERE user_id = $1", [target.id]);
      break;
    case "delete":
      if (target.id === admin) return NextResponse.json({ error: "You can't delete your own admin account here" }, { status: 400 });
      await deleteAccount(target.id);
      break;
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
  console.log(`[admin] ${admin} ${b.action} ${target.id}`);
  return NextResponse.json({ ok: true });
}
