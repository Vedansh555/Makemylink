import type { ImportResult, SocialKind } from "./types";

/** Decode the few HTML entities that appear in meta tags and titles. */
export function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)));
}

/** Read <meta property|name="key" content="..."> from HTML. */
export function metaContent(html: string, key: string): string | undefined {
  const escaped = key.replace(/[.*+?^$()|{}[\]\\]/g, "\\$&");
  const re = new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]*>`, "i");
  const tag = re.exec(html)?.[0];
  const content = tag && /content=["']([^"']*)["']/i.exec(tag)?.[1];
  return content ? decodeEntities(content).trim() : undefined;
}

/** Extract and parse every <script type="application/ld+json"> block. */
export function jsonLdBlocks(html: string): unknown[] {
  const out: unknown[] = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    try {
      out.push(JSON.parse(m[1]!));
    } catch {
      /* ignore bad block */
    }
  }
  return out;
}

/** Parse the JSON inside <script id="..." type="application/json"> (e.g. __NEXT_DATA__). */
export function scriptJsonById(html: string, id: string): unknown | undefined {
  const re = new RegExp(String.raw`<script[^>]+id=["']${id}["'][^>]*>([\s\S]*?)</script>`, "i");
  const raw = re.exec(html)?.[1];
  if (!raw) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

/** Turn a social profile URL into a bare handle for our Socials, or undefined. */
export function socialFromUrl(url: string): { kind: SocialKind; handle: string } | undefined {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "").toLowerCase();
    const first = u.pathname.split("/").filter(Boolean)[0]?.replace(/^@/, "");
    if (u.protocol === "mailto:") return { kind: "email", handle: url.replace(/^mailto:/i, "").split("?")[0]! };
    if (!first) return undefined;
    if (host === "instagram.com" && !["p", "reel", "reels", "explore", "stories"].includes(first)) return { kind: "instagram", handle: first };
    if (host === "tiktok.com" && u.pathname.split("/").filter(Boolean)[0]?.startsWith("@")) return { kind: "tiktok", handle: first };
    if ((host === "youtube.com" || host === "m.youtube.com") && u.pathname.split("/").filter(Boolean)[0]?.startsWith("@")) return { kind: "youtube", handle: first };
    if (/^([a-z]{2}\.)?pinterest\.[a-z.]+$/.test(host) && !["pin", "ideas"].includes(first)) return { kind: "pinterest", handle: first };
    return undefined;
  } catch {
    if (/^mailto:/i.test(url)) return { kind: "email", handle: url.replace(/^mailto:/i, "").split("?")[0]! };
    return undefined;
  }
}

/** Split a flat list of URLs into social handles (first of each kind) and the rest. */
export function splitSocials(urls: string[]): { socials: ImportResult["socials"]; rest: string[] } {
  const socials: ImportResult["socials"] = {};
  const rest: string[] = [];
  for (const url of urls) {
    const s = socialFromUrl(url);
    if (s && !socials[s.kind]) socials[s.kind] = s.handle.slice(0, 80);
    else if (!s) rest.push(url);
  }
  return { socials, rest };
}

/** Normalise an input like "beacons.ai/aria" or "https://www.beacons.ai/aria/" to a profile URL for the given host(s). */
export function profileUrl(input: string, hosts: string[], opts: { pathPattern?: RegExp; build?: (host: string, path: string) => string } = {}): string | null {
  const text = input.trim();
  const m = /^(?:https?:\/\/)?(?:www\.)?([a-z0-9.-]+\.[a-z]{2,})(\/[^?#\s]*)?(?:[?#].*)?$/i.exec(text);
  if (!m) return null;
  const host = m[1]!.toLowerCase();
  if (!hosts.includes(host)) return null;
  const path = (m[2] ?? "/").replace(/\/+$/, "") || "/";
  if (opts.pathPattern && !opts.pathPattern.test(path)) return null;
  return opts.build ? opts.build(host, path) : `https://${host}${path}`;
}
