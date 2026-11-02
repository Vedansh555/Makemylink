import { NextResponse } from "next/server";
import { clientIp, rateLimit, sameOriginOnly, safeHref } from "@/lib/security";

/**
 * POST /api/import {url} — reads a public Linktree page the user points us at and returns its name, bio and links.
 * Only linktr.ee pages are fetched, and only what the page already shows publicly (its embedded page data).
 */
export async function POST(req: Request) {
  const blocked = sameOriginOnly(req) ?? rateLimit(`import:${clientIp(req)}`, 10, 60 * 60 * 1000);
  if (blocked) return blocked;
  const { url } = (await req.json().catch(() => ({}))) as { url?: string };
  const m = /^(?:https?:\/\/)?(?:www\.)?linktr\.ee\/([A-Za-z0-9._-]{1,40})\/?$/.exec(String(url ?? "").trim());
  if (!m) return NextResponse.json({ error: "Paste a link like linktr.ee/yourname" }, { status: 400 });

  try {
    const res = await fetch(`https://linktr.ee/${m[1]}`, { signal: AbortSignal.timeout(10_000), headers: { "User-Agent": "Mozilla/5.0 (compatible; MakemylinkImport/1.0)" } });
    if (!res.ok) return NextResponse.json({ error: "We couldn't find that Linktree page" }, { status: 404 });
    const html = await res.text();
    const data = /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/.exec(html)?.[1];
    if (!data) return NextResponse.json({ error: "Couldn't read that page. Add your links by hand." }, { status: 422 });
    const props = JSON.parse(data)?.props?.pageProps ?? {};
    const account = props.account ?? props.pageProps?.account ?? {};
    const raw: { title?: string; url?: string }[] = props.links ?? account.links ?? [];
    const links = raw
      .filter((l) => l?.title && l?.url)
      .slice(0, 40)
      .map((l, i) => ({ id: `imp${i}`, title: String(l.title).slice(0, 120), url: safeHref(String(l.url)) }))
      .filter((l) => l.url !== "#");
    return NextResponse.json({
      name: String(account.pageTitle ?? account.username ?? m[1]).slice(0, 80),
      bio: String(account.description ?? "").slice(0, 400),
      links,
    });
  } catch {
    return NextResponse.json({ error: "Couldn't reach that page. Try again or add links by hand." }, { status: 502 });
  }
}
