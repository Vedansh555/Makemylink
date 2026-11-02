import { NextResponse } from "next/server";
import dns from "dns/promises";
import { one, run } from "@/lib/db";
import { getSession } from "@/lib/session";
import { planForUser } from "@/lib/account";
import { rateLimit, sameOriginOnly } from "@/lib/security";
import { SITE_HOST } from "@/lib/site";

const HOST_RE = /^(?=.{4,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$/;

async function pointsHere(domain: string): Promise<boolean> {
  const site = SITE_HOST.replace(/:\d+$/, "");
  try {
    const cn = await dns.resolveCname(domain);
    if (cn.some((c) => c.replace(/\.$/, "").toLowerCase() === site)) return true;
  } catch {
    /* no CNAME: try A records */
  }
  try {
    const [mine, theirs] = await Promise.all([dns.resolve4(domain), dns.resolve4(site)]);
    return mine.some((ip) => theirs.includes(ip));
  } catch {
    return false;
  }
}

export async function GET() {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const row = await one<{ custom_domain: string | null; custom_domain_verified: boolean }>("SELECT custom_domain, custom_domain_verified FROM pages WHERE user_id = $1", [session.userId]);
  return NextResponse.json({ domain: row?.custom_domain ?? null, verified: !!row?.custom_domain_verified, target: SITE_HOST });
}

// POST {domain} saves a domain (Pro). POST {verify:true} checks that its DNS points at us.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const blocked = sameOriginOnly(req) ?? rateLimit(`domain:${session.userId}`, 30, 60 * 60 * 1000);
  if (blocked) return blocked;
  if ((await planForUser(session.userId)) !== "pro") return NextResponse.json({ error: "Custom domains are a Pro feature" }, { status: 402 });

  const body = (await req.json().catch(() => ({}))) as { domain?: string; verify?: boolean };
  if (body.verify) {
    const row = await one<{ custom_domain: string | null }>("SELECT custom_domain FROM pages WHERE user_id = $1", [session.userId]);
    if (!row?.custom_domain) return NextResponse.json({ error: "Save a domain first" }, { status: 400 });
    const ok = await pointsHere(row.custom_domain);
    await run("UPDATE pages SET custom_domain_verified = $1 WHERE user_id = $2", [ok, session.userId]);
    return NextResponse.json({ verified: ok });
  }

  const domain = String(body.domain ?? "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (!HOST_RE.test(domain) || domain === SITE_HOST || domain.endsWith(`.${SITE_HOST}`)) {
    return NextResponse.json({ error: "Enter a domain like links.yourname.com" }, { status: 400 });
  }
  if (await one("SELECT id FROM pages WHERE custom_domain = $1 AND user_id <> $2", [domain, session.userId])) {
    return NextResponse.json({ error: "That domain is already connected to another page" }, { status: 409 });
  }
  await run("UPDATE pages SET custom_domain = $1, custom_domain_verified = FALSE WHERE user_id = $2", [domain, session.userId]);
  return NextResponse.json({ ok: true, domain, verified: false, target: SITE_HOST });
}

export async function DELETE() {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await run("UPDATE pages SET custom_domain = NULL, custom_domain_verified = FALSE WHERE user_id = $1", [session.userId]);
  return NextResponse.json({ ok: true });
}
