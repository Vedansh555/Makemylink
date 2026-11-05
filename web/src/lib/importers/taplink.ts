/* eslint-disable @typescript-eslint/no-explicit-any -- parses untyped JSON embedded in third-party pages */
import type { Importer, ImportResult } from "./types";
import { decodeEntities, metaContent, profileUrl, splitSocials } from "./helpers";

const RESERVED = new Set(["ru", "en", "es", "pt", "de", "fr", "tr", "id", "login", "signup", "pricing", "blog", "guide", "help", "api"]);

const clean = (s: string) => decodeEntities(s.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ")).replace(/\s+/g, " ").trim();

/** Read the JSON object assigned to `window.<name> = {...};` by brace matching. */
function windowJson(html: string, name: string): any {
  const start = html.indexOf(`window.${name} =`);
  if (start < 0) return undefined;
  const i = html.indexOf("{", start);
  let depth = 0, inStr = false, esc = false;
  for (let j = i; j < html.length; j++) {
    const c = html[j]!;
    if (inStr) { if (esc) esc = false; else if (c === "\\") esc = true; else if (c === '"') inStr = false; continue; }
    if (c === '"') inStr = true;
    else if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return JSON.parse(html.slice(i, j + 1));
  }
  return undefined;
}

/**
 * Taplink pages are a Vue app, but the page data is inlined as `window.data = {...}` (blocks) and
 * `window.account = {...}` (profile) in the raw HTML. Blocks of type "link" carry options.title/value,
 * "text" blocks hold the display name and bio, and "section" objects group links.
 */
export const taplink: Importer = {
  id: "taplink",
  label: "Taplink",
  match: (input) =>
    profileUrl(input, ["taplink.cc"], {
      pathPattern: /^\/[A-Za-z0-9._-]{2,40}$/,
      build: (_h, path) => (RESERVED.has(path.slice(1).toLowerCase()) ? "" : `https://taplink.cc${path}`),
    }) || null,
  extract(html) {
    try {
      const data = windowJson(html, "data");
      if (!data || !Array.isArray(data.fields)) return null;
      const account = windowJson(html, "account") ?? {};
      const result: ImportResult = { socials: {}, links: [], products: [] };
      const texts: string[] = [];
      let heading: string | undefined;
      const socialUrls: string[] = [];
      const seen = new Set<string>();

      for (const field of data.fields as any[]) {
        const folder = typeof field?.section?.heading?.text === "string" ? clean(field.section.heading.text) : undefined;
        for (const b of (field?.items ?? []) as any[]) {
          const o = b?.options ?? {};
          if (b.block_type_name === "text" && typeof o.text === "string") {
            const t = clean(o.text);
            if (t) { texts.push(t); if (!heading && /^h[1-3]$/.test(String(o.text_size))) heading = t; }
          } else if (b.block_type_name === "link") {
            const url = typeof o.value === "string" ? o.value.trim() : "";
            const title = typeof o.title === "string" ? clean(o.title) : "";
            if (!title || !/^(https?:|mailto:)/i.test(url)) continue;
            if (/^https?:\/\/([a-z0-9-]+\.)?taplink\.(cc|at|ru)/i.test(url)) continue;
            if (splitSocials([url]).rest.length === 0) { socialUrls.push(url); continue; }
            if (seen.has(url)) continue;
            seen.add(url);
            result.links.push({ title, url, folder: folder || undefined });
          }
        }
      }
      result.socials = splitSocials(socialUrls).socials;
      result.name = heading ?? (metaContent(html, "og:title") ?? "").replace(/s+at Taplink$/i, "");
      const bio = texts.find((t) => t !== heading);
      if (bio) result.bio = bio;
      const img = metaContent(html, "og:image");
      if (img && /^https:\/\//i.test(img)) result.avatarUrl = img;
      if (!result.name && !result.links.length) return null;
      void account;
      return result;
    } catch {
      return null;
    }
  },
};
