import { NextResponse } from "next/server";
import { clientIp, rateLimit, sameOriginOnly, safeHref } from "@/lib/security";
import { generic, importers } from "@/lib/importers";
import { safeGetImage, safeGetText } from "@/lib/importers/fetch";
import type { ImportResult } from "@/lib/importers/types";

/**
 * POST /api/import {url} — reads a public link-in-bio page the person points us at and returns what is on it:
 * name, bio, profile picture, social handles, links (with group names) and shop products with images.
 * A platform-specific importer handles known sites; a generic reader handles other pages.
 * Another tool's visual style can't be copied; the person picks one of our themes instead.
 */

// Platforms whose pages are mostly paid sessions or digital products, which Showz does not host.
const NOT_SUPPORTED: Record<string, string> = {
  "topmate.io": "Topmate",
  "stan.store": "Stan Store",
  "gumroad.com": "Gumroad",
  "linkedin.com": "LinkedIn",
  "instagram.com": "Instagram",
  "facebook.com": "Facebook",
  "x.com": "X",
  "twitter.com": "X",
};

function unsupportedName(input: string): string | undefined {
  const host = /^(?:https?:\/\/)?(?:www\.)?([^/?#\s]+)/i.exec(input.trim())?.[1]?.toLowerCase();
  if (!host) return undefined;
  return Object.entries(NOT_SUPPORTED).find(([h]) => host === h || host.endsWith(`.${h}`))?.[1];
}

/** Resolves "//cdn.x/pic.jpg" and "/pic.jpg" against the page, and upgrades http to https (we only store https pictures). */
function absoluteHttps(raw: string | undefined, base: string): string | undefined {
  if (!raw) return undefined;
  try {
    const u = new URL(raw, base);
    if (u.protocol === "http:") u.protocol = "https:";
    return u.protocol === "https:" ? u.toString() : undefined;
  } catch {
    return undefined;
  }
}

const empty = (r: ImportResult | null) => !r || (!r.links.length && !r.products.length && !r.name && !r.bio);

export async function POST(req: Request) {
  const blocked = sameOriginOnly(req) ?? rateLimit(`import:${clientIp(req)}`, 10, 60 * 60 * 1000);
  if (blocked) return blocked;
  const { url } = (await req.json().catch(() => ({}))) as { url?: string };
  const input = String(url ?? "").trim().slice(0, 300);
  if (!input) return NextResponse.json({ error: "Paste the link to your page, like linktr.ee/yourname" }, { status: 400 });

  const nope = unsupportedName(input);
  if (nope) {
    return NextResponse.json({ error: `${nope} pages can't be imported. They are mostly sessions, posts or digital products, which Showz doesn't host. Paste your link-in-bio page instead.` }, { status: 400 });
  }

  // First platform importer that recognises the address, otherwise the generic reader.
  let importer = generic;
  let target: string | null = null;
  for (const imp of importers) {
    const t = imp.match(input);
    if (t) {
      importer = imp;
      target = t;
      break;
    }
  }
  target ??= generic.match(input);
  if (!target) return NextResponse.json({ error: "That doesn't look like a web address. Try something like yourname.carrd.co" }, { status: 400 });

  try {
    const page = await safeGetText(target);
    if (page.status === 403 || page.status === 429 || page.status === 503) {
      return NextResponse.json({ error: "That site blocks automated reading. Add your links by hand, or paste a different page." }, { status: 422 });
    }
    if (!page.ok) return NextResponse.json({ error: "We couldn't open that page. Check the address and that the page is public." }, { status: 404 });

    let result = importer.extract(page.text, page.finalUrl);
    // A known platform whose layout changed: try the generic reader on the same page before giving up.
    if (empty(result) && importer !== generic) result = generic.extract(page.text, page.finalUrl);

    // Some platforms keep the links in a separate public JSON file: fetch it and merge.
    const next = importer.followUp?.(page.text);
    if (next && result) {
      try {
        const more = await safeGetText(next);
        const extra = more.ok ? importer.extract(more.text, more.finalUrl) : null;
        if (extra) {
          result = {
            ...result,
            name: result.name || extra.name,
            bio: result.bio || extra.bio,
            avatarUrl: result.avatarUrl || extra.avatarUrl,
            socials: { ...extra.socials, ...result.socials },
            links: [...result.links, ...extra.links],
            products: [...result.products, ...extra.products],
          };
        }
      } catch {
        /* keep what the first page gave us */
      }
    }
    if (!result || (!result.links.length && !result.products.length)) {
      return NextResponse.json({ error: "We couldn't find links on that page. It may load its content with JavaScript, which we can't read. Add your links by hand." }, { status: 422 });
    }

    const links = result.links
      .map((l) => ({ title: l.title.trim().slice(0, 120), url: safeHref(l.url), folder: l.folder?.trim().slice(0, 60) || undefined }))
      .filter((l) => l.title && l.url !== "#")
      .slice(0, 100)
      .map((l, i) => ({ id: `imp${i}`, ...l }));
    const looks = result.products
      .map((p, i) => ({
        id: `impp${i}`,
        title: p.title.trim().slice(0, 120),
        price: (p.price ?? "").slice(0, 30),
        store: "Own store" as const,
        url: safeHref(p.url),
        image: p.image && /^https:\/\//i.test(p.image) && p.image.length < 2000 ? p.image : undefined,
        art: "bag" as const,
        hue: (i * 47) % 360,
      }))
      .filter((p) => p.title && p.url !== "#")
      .slice(0, 40);

    const socials: Record<string, string> = {};
    for (const [k, v] of Object.entries(result.socials)) if (v) socials[k] = String(v).slice(0, k === "email" ? 254 : 80);

    return NextResponse.json({
      source: importer.label,
      name: (result.name ?? "").replace(/^@/, "").trim().slice(0, 80),
      bio: (result.bio ?? "").trim().slice(0, 400),
      avatar: await safeGetImage(absoluteHttps(result.avatarUrl, page.finalUrl)),
      socials,
      links,
      looks,
      darkTheme: !!result.dark,
    });
  } catch {
    return NextResponse.json({ error: "Couldn't reach that page. Try again, or add your links by hand." }, { status: 502 });
  }
}
