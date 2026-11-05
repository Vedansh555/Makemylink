import { NextResponse } from "next/server";
import { clientIp, rateLimit, sameOriginOnly, safeHref } from "@/lib/security";

/**
 * POST /api/import {url} — reads a public Linktree page the user points us at and returns what is on it:
 * name, bio, profile picture, social handles, links (with their group names) and shop products with images.
 * Only linktr.ee pages are fetched, and only what the page already shows publicly (its embedded page data).
 * Linktree's visual style can't be copied; the person picks one of our themes instead.
 */

interface LtLink {
  id: number | string;
  title?: string;
  url?: string;
  type?: string;
  thumbnail?: string;
  parent?: { id: number | string } | null;
}
interface LtSocial {
  type?: string;
  url?: string;
}

const UA = "Mozilla/5.0 (compatible; MakemylinkImport/1.0)";
const IMG_HOST = /(^|\.)linktr\.ee$/i;

/** Downloads a Linktree-hosted picture and returns it inline, so it survives if their link ever changes. */
async function inlineImage(raw: unknown, maxBytes = 700_000): Promise<string | undefined> {
  if (typeof raw !== "string") return undefined;
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:" || !IMG_HOST.test(u.hostname)) return undefined;
    const res = await fetch(u, { signal: AbortSignal.timeout(8000), headers: { "User-Agent": UA } });
    const type = res.headers.get("content-type")?.split(";")[0] ?? "";
    if (!res.ok || !/^image\/(jpeg|png|webp|gif)$/.test(type)) return undefined;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length <= maxBytes) return `data:${type};base64,${buf.toString("base64")}`;
    return u.toString(); // too big to store inline: keep the https address instead
  } catch {
    return undefined;
  }
}

const httpsImage = (raw: unknown) => {
  try {
    const u = new URL(String(raw));
    return u.protocol === "https:" && IMG_HOST.test(u.hostname) ? u.toString() : undefined;
  } catch {
    return undefined;
  }
};

/** instagram.com/aria -> "aria", tiktok.com/@aria -> "aria". Returns undefined when no handle can be found. */
function handleFrom(kind: string, url: string): string | undefined {
  try {
    const u = new URL(url);
    const first = u.pathname.split("/").filter(Boolean)[0];
    if (!first) return undefined;
    if (kind === "youtube" && !first.startsWith("@")) return undefined; // channel ids can't be turned into a handle
    return first.replace(/^@/, "").slice(0, 60);
  } catch {
    return undefined;
  }
}

export async function POST(req: Request) {
  const blocked = sameOriginOnly(req) ?? rateLimit(`import:${clientIp(req)}`, 10, 60 * 60 * 1000);
  if (blocked) return blocked;
  const { url } = (await req.json().catch(() => ({}))) as { url?: string };
  const m = /^(?:https?:\/\/)?(?:www\.)?linktr\.ee\/([A-Za-z0-9._-]{1,40})\/?$/.exec(String(url ?? "").trim());
  if (!m) return NextResponse.json({ error: "Paste a link like linktr.ee/yourname" }, { status: 400 });

  try {
    const res = await fetch(`https://linktr.ee/${m[1]}`, { signal: AbortSignal.timeout(10_000), headers: { "User-Agent": UA } });
    if (!res.ok) return NextResponse.json({ error: "We couldn't find that Linktree page" }, { status: 404 });
    const html = await res.text();
    const data = /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/.exec(html)?.[1];
    if (!data) return NextResponse.json({ error: "Couldn't read that page. Add your links by hand." }, { status: 422 });
    const props = JSON.parse(data)?.props?.pageProps ?? {};
    const account = props.account ?? {};
    const all: LtLink[] = Array.isArray(props.links) ? props.links : Array.isArray(account.links) ? account.links : [];

    // Group headings become folders for the links inside them.
    const groupName = new Map<string, string>();
    for (const l of all) if (l.type === "GROUP" && l.title) groupName.set(String(l.id), String(l.title).slice(0, 60));

    const links: { id: string; title: string; url: string; folder?: string }[] = [];
    const looks: { id: string; title: string; price: string; store: "Own store"; url: string; image?: string; art: "bag"; hue: number }[] = [];
    for (const l of all) {
      if (!l.title || !l.url || l.type === "GROUP") continue;
      const href = safeHref(String(l.url));
      if (href === "#") continue;
      if (l.type === "COMMERCE_PRODUCT") {
        if (looks.length < 12) looks.push({ id: `impp${looks.length}`, title: String(l.title).slice(0, 120), price: "", store: "Own store", url: href, image: httpsImage(l.thumbnail), art: "bag", hue: (looks.length * 47) % 360 });
        continue;
      }
      if (links.length >= 60) continue;
      links.push({ id: `imp${links.length}`, title: String(l.title).slice(0, 120), url: href, folder: l.parent ? groupName.get(String(l.parent.id)) : undefined });
    }

    const socials: Record<string, string> = {};
    for (const s of (Array.isArray(props.socialLinks) ? props.socialLinks : []) as LtSocial[]) {
      const kind = ({ INSTAGRAM: "instagram", TIKTOK: "tiktok", YOUTUBE: "youtube", PINTEREST: "pinterest" } as Record<string, string>)[String(s.type)];
      if (kind && s.url && !socials[kind]) {
        const h = handleFrom(kind, s.url);
        if (h) socials[kind] = h;
      }
      if (s.type === "EMAIL" && s.url && !socials.email) socials.email = String(s.url).replace(/^mailto:/i, "").slice(0, 254);
    }

    const name = String(account.pageTitle ?? "").replace(/^@/, "") || String(account.username ?? m[1]);
    return NextResponse.json({
      name: name.slice(0, 80),
      bio: String(account.description ?? "").slice(0, 400),
      avatar: await inlineImage(account.profilePictureUrl ?? account.customAvatar),
      socials,
      links,
      looks,
      darkTheme: props.theme?.luminance === "DARK" || props.theme?.mode === "dark",
    });
  } catch {
    return NextResponse.json({ error: "Couldn't reach that page. Try again or add links by hand." }, { status: 502 });
  }
}
