import type { ImportedLink, Importer, ImportResult } from "./types";
import { decodeEntities, jsonLdBlocks, metaContent, splitSocials } from "./helpers";

/** Normalise pasted text to an https URL, rejecting localhost, IPs, credentials, odd ports and other schemes. */
export function normaliseWebUrl(input: string): string | null {
  try {
    let text = (input ?? "").trim();
    if (!text || /\s/.test(text) || text.length > 2000) return null;
    if (/^[a-z][a-z0-9+.-]*:/i.test(text) && !/^https?:\/\//i.test(text)) return null;
    if (!/^https?:\/\//i.test(text)) text = "https://" + text.replace(/^\/\//, "");
    const u = new URL(text);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    if (u.username || u.password) return null;
    if (u.port && u.port !== "80" && u.port !== "443") return null;
    const host = u.hostname.toLowerCase().replace(/\.$/, "");
    if (!host.includes(".") || host.startsWith("[") || /^\d+(\.\d+)*$/.test(host) || /^0x/i.test(host)) return null;
    if (host === "localhost" || /\.(localhost|local|internal|test|invalid|example)$/.test(host)) return null;
    if (!/^[a-z0-9.-]+$/.test(host) && !/^[a-z0-9.-]*xn--[a-z0-9.-]+$/.test(host)) return null;
    if (!/^[a-z]{2,}$|^xn--[a-z0-9-]+$/.test(host.split(".").pop()!)) return null;
    return `https://${host}${u.pathname}${u.search}`;
  } catch {
    return null;
  }
}

export function stripTags(s: string): string {
  return decodeEntities(
    s
      .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<svg[\s\S]*?<\/svg>/gi, " ")
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<[^>]*>/g, " "),
  )
    .replace(/&nbsp;| /g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function attr(tag: string, name: string): string | undefined {
  const m = new RegExp(`[\\s"']${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i").exec(tag);
  const v = m ? (m[1] ?? m[2] ?? m[3]) : undefined;
  return v === undefined || v === null ? undefined : decodeEntities(v).trim();
}

function absolute(href: string | undefined, base: string): string | undefined {
  if (!href) return undefined;
  try {
    return new URL(href.trim(), base).toString();
  } catch {
    return undefined;
  }
}

function httpsImage(src: string | undefined, base: string): string | undefined {
  const a = absolute(src, base);
  if (!a || a.startsWith("data:")) return undefined;
  if (!/^https?:/i.test(a)) return undefined;
  return a.replace(/^http:/i, "https:");
}

const NOISE_TEXT =
  /^(privacy|privacy policy|terms|terms of (use|service)|terms & conditions|terms and conditions|cookies?|cookie (policy|settings|preferences)|log ?in|sign ?in|sign ?up|register|skip to (main )?content|menu|home|close|back to top|report|report this page|contact us|about us|accept|decline|powered by.*|made with.*|built with.*|create your own.*|get started.*|join .*|copyright.*|©.*|all rights reserved.*|read more|learn more|more|next|previous|subscribe)$/i;
const NOISE_HREF = /(\/(privacy|terms|cookie|legal|login|log-in|signin|sign-in|signup|sign-up|register|tos|dmca|abuse|report)(\/|$|[-_.?#])|utm_source=powered)/i;
const NOISE_HOST = /(^|\.)(carrd\.co|linktr\.ee|beacons\.ai|bio\.link|wix\.com|squarespace\.com|webflow\.com|wordpress\.com|notion\.so|github\.com\/features)$/i;

function isNoise(text: string, href: string, pageHost: string): boolean {
  if (NOISE_TEXT.test(text)) return true;
  if (/^(powered|made|built|created|designed) (with|by|on)\b/i.test(text)) return true;
  try {
    const u = new URL(href);
    if (u.protocol === "mailto:") return false;
    const host = u.hostname.replace(/^www\./, "").toLowerCase();
    if (host === pageHost && (u.pathname === "/" || u.pathname === "") && !u.search) return true;
    if ((NOISE_HREF.test(u.pathname) || /^\/(help|support|about)(\/|$)/i.test(u.pathname)) && host === pageHost) return true;
    if (/\/(privacy|terms|cookie)/i.test(u.pathname) && /privacy|terms|cookie/i.test(text)) return true;
    // Builder marketing links ("Made with Carrd") but not the builder's own user pages.
    if (NOISE_HOST.test(host) && host !== pageHost && (u.pathname === "/" || u.pathname === "") && /made|powered|built|create|free|start|try|sign|join/i.test(text)) return true;
  } catch {
    return true;
  }
  return false;
}

function firstString(v: unknown): string | undefined {
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return firstString(v[0]);
  if (v && typeof v === "object") return firstString((v as Record<string, unknown>).url ?? (v as Record<string, unknown>).contentUrl);
  return undefined;
}

function walkJsonLd(node: unknown, out: Record<string, unknown>[], depth = 0): void {
  if (!node || typeof node !== "object" || depth > 6) return;
  if (Array.isArray(node)) {
    for (const n of node) walkJsonLd(n, out, depth + 1);
    return;
  }
  const o = node as Record<string, unknown>;
  out.push(o);
  for (const k of ["@graph", "mainEntity", "about"]) if (o[k]) walkJsonLd(o[k], out, depth + 1);
}

function typeOf(o: Record<string, unknown>): string {
  const t = o["@type"];
  return (Array.isArray(t) ? t.join(",") : String(t ?? "")).toLowerCase();
}

function cleanTitle(t: string, host: string): string {
  let s = t.trim();
  const parts = s.split(/\s+[|–—·•]\s+|\s+-\s+/);
  if (parts.length > 1) {
    const h = host.split(".")[0]!.toLowerCase();
    const keep = parts.filter((p) => !/^(home|welcome|links?|linktree|carrd|bio)$/i.test(p.trim()) && p.trim().toLowerCase() !== h);
    s = (keep[0] ?? parts[0]!).trim();
  }
  return s;
}

interface Item {
  pos: number;
  heading?: string;
  link?: { title: string; url: string };
}

function anchorLinks(html: string, base: string, pageHost: string): ImportedLink[] {
  const body = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|noscript|template|svg)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<(nav|footer|header)\b[\s\S]*?<\/\1>/gi, (m) => (/<h[12]\b/i.test(m) ? m.replace(/<a\b[\s\S]*?<\/a>/gi, " ") : " "));
  const items: Item[] = [];
  const re = /<(h[1-4])\b[^>]*>([\s\S]*?)<\/\1>|<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body))) {
    if (m[1]) {
      const t = stripTags(m[2]!);
      if (t && t.length <= 60 && /^h[23]$/i.test(m[1])) items.push({ pos: m.index, heading: t });
      continue;
    }
    const tag = m[3]!;
    const inner = m[4]!;
    const href = attr(" " + tag, "href");
    if (!href || /^(#|javascript:|tel:|sms:|data:)/i.test(href)) continue;
    const url = absolute(href, base);
    if (!url || !/^(https?:|mailto:)/i.test(url)) continue;
    let text = stripTags(inner);
    if (!text) text = attr(" " + tag, "aria-label") ?? attr(" " + tag, "title") ?? attr(" " + (/<img[^>]*>/i.exec(inner)?.[0] ?? ""), "alt") ?? "";
    text = text.replace(/\s+/g, " ").trim();
    if (!text) {
      try {
        const u = new URL(url);
        text = u.protocol === "mailto:" ? url.slice(7).split("?")[0]! : u.hostname.replace(/^www\./, "");
      } catch {
        continue;
      }
    }
    if (text.length > 120) text = text.slice(0, 117) + "...";
    if (isNoise(text, url, pageHost)) continue;
    items.push({ pos: m.index, link: { title: text, url } });
  }

  // Folder = the nearest preceding h2/h3 provided at least two links follow it before the next heading.
  const out: ImportedLink[] = [];
  const seen = new Set<string>();
  let folder: string | undefined;
  for (let i = 0; i < items.length; i++) {
    const it = items[i]!;
    if (it.heading) {
      let n = 0;
      for (let j = i + 1; j < items.length && !items[j]!.heading; j++) n++;
      folder = n >= 2 ? it.heading : undefined;
      continue;
    }
    const key = it.link!.url.replace(/\/$/, "").toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ ...it.link!, ...(folder ? { folder } : {}) });
    if (out.length >= 100) break;
  }
  return out;
}

function findAvatar(html: string, base: string): string | undefined {
  const imgs: { src: string; score: number }[] = [];
  const re = /<img\b[^>]*>/gi;
  let m: RegExpExecArray | null;
  let idx = 0;
  while ((m = re.exec(html)) && idx < 40) {
    idx++;
    const tag = m[0];
    const src = attr(tag, "src") ?? attr(tag, "data-src") ?? attr(tag, "data-lazy-src") ?? (attr(tag, "srcset") ?? "").split(/\s+/)[0];
    const abs = httpsImage(src, base);
    if (!abs || /\.(svg|gif)(\?|$)/i.test(abs) || /logo|icon|sprite|pixel|badge|favicon|banner|tracking/i.test(abs)) continue;
    const hay = `${attr(tag, "class") ?? ""} ${attr(tag, "alt") ?? ""} ${abs} ${attr(tag, "id") ?? ""}`;
    let score = 0;
    if (/avatar|profile|portrait|headshot|photo|pfp|me\b|author/i.test(hay)) score += 5;
    const w = Number(attr(tag, "width") ?? 0);
    if (w >= 80) score += 2;
    if (w && w < 40) score -= 5;
    score += Math.max(0, 3 - idx / 3);
    imgs.push({ src: abs, score });
  }
  imgs.sort((a, b) => b.score - a.score);
  return imgs[0] && imgs[0].score >= 3 ? imgs[0].src : undefined;
}

/** Generic heuristic extractor for any link-in-bio style web page. */
export const generic: Importer = {
  id: "generic",
  label: "Web page",
  match: normaliseWebUrl,
  extract(html, url) {
    try {
      if (!html || typeof html !== "string") return null;
      let pageHost = "";
      try {
        pageHost = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
      } catch {
        return null;
      }
      const result: ImportResult = { socials: {}, links: [], products: [] };
      const sameAs: string[] = [];

      // 1. JSON-LD
      const nodes: Record<string, unknown>[] = [];
      for (const b of jsonLdBlocks(html)) walkJsonLd(b, nodes);
      const person = nodes.find((n) => /person|profilepage|organization/.test(typeOf(n)) && (n.name || n.sameAs)) ?? nodes.find((n) => n.sameAs);
      if (person) {
        const ent = (typeOf(person).includes("profilepage") ? (person.mainEntity as Record<string, unknown> | undefined) : undefined) ?? person;
        const name = firstString(ent.name) ?? firstString(person.name);
        if (name) result.name = stripTags(name);
        const d = firstString(ent.description) ?? firstString(person.description);
        if (d) result.bio = stripTags(d);
        result.avatarUrl = httpsImage(firstString(ent.image) ?? firstString(ent.thumbnailUrl), url);
        const sa = ent.sameAs ?? person.sameAs;
        for (const s of Array.isArray(sa) ? sa : sa ? [sa] : []) if (typeof s === "string") sameAs.push(s);
      }

      // 2. OpenGraph / Twitter
      const ogTitle = metaContent(html, "og:title") ?? metaContent(html, "twitter:title");
      const ogDesc = metaContent(html, "og:description") ?? metaContent(html, "twitter:description") ?? metaContent(html, "description");
      const ogImg = metaContent(html, "og:image") ?? metaContent(html, "twitter:image") ?? metaContent(html, "og:image:url");
      if (!result.name && ogTitle) result.name = cleanTitle(stripTags(ogTitle), pageHost);
      if (!result.bio && ogDesc) result.bio = stripTags(ogDesc);
      if (!result.avatarUrl) result.avatarUrl = httpsImage(ogImg, url);

      // 3. title / h1
      if (!result.name) {
        const h1 = /<h1\b[^>]*>([\s\S]*?)<\/h1>/i.exec(html)?.[1];
        const title = /<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1];
        const t = (h1 && stripTags(h1)) || (title && cleanTitle(stripTags(title), pageHost));
        if (t) result.name = t;
      }

      // 6. avatar fallback (before anchors so we can skip it)
      if (!result.avatarUrl) result.avatarUrl = findAvatar(html, url);

      // 4/5. links
      const links = anchorLinks(html, url, pageHost);
      const urls = [...sameAs, ...links.map((l) => l.url)];
      const { socials } = splitSocials(urls);
      result.socials = socials;
      const socialSet = new Set<string>();
      for (const l of links) {
        const { socials: s } = splitSocials([l.url]);
        if (Object.keys(s).length) socialSet.add(l.url);
      }
      result.links = links.filter((l) => !socialSet.has(l.url));

      if (/^(just a moment|attention required|access denied|page not found|404|403|are you a robot)/i.test(result.name ?? "")) return null;
      if (result.name) result.name = result.name.slice(0, 80);
      if (result.bio) result.bio = result.bio.slice(0, 300);
      if (!result.links.length && !Object.keys(result.socials).length) return null;
      return result;
    } catch {
      return null;
    }
  },
};
