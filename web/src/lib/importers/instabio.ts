import type { Importer, ImportResult } from "./types";
import { decodeEntities, profileUrl, splitSocials } from "./helpers";

/**
 * Instabio (instabio.cc, a.k.a. Linkbio) needs TWO public requests, neither needs login or a key:
 *   1. GET the profile page HTML  -> window.__data = { ui: {title, desc, avatar, uid}, bio: {id}, vt }.
 *      `extract(html)` returns name, bio and avatar from this (links are NOT in the HTML; the page builds them in the browser).
 *   2. GET https://bio.linkcdn.cc/upload/lnkcmpts/{bio.id}.json?lnkcmpt={vt}  -> static JSON with the link components.
 *      `extract(jsonText)` accepts that JSON text and returns links + socials (no name/bio/avatar).
 * Use `instabioLinksUrl(html)` to get the second address. The caller merges the two results.
 */
export function instabioLinksUrl(html: string): string | null {
  try {
    const data = objectAfter(html, /window\.__data\s*=\s*\{/) as { bio?: { id?: string }; vt?: number } | undefined;
    const id = data?.bio?.id;
    if (!id || !/^[A-Za-z0-9]{6,40}$/.test(id)) return null;
    return `https://bio.linkcdn.cc/upload/lnkcmpts/${id}.json?lnkcmpt=${Number(data?.vt) || 0}`;
  } catch {
    return null;
  }
}

function objectAfter(html: string, marker: RegExp): unknown | undefined {
  const m = marker.exec(html);
  if (!m) return undefined;
  const start = m.index + m[0].length - 1;
  let depth = 0;
  let inStr = false;
  for (let i = start; i < html.length; i++) {
    const c = html[i]!;
    if (inStr) {
      if (c === "\\") i++;
      else if (c === '"') inStr = false;
    } else if (c === '"') inStr = true;
    else if (c === "{") depth++;
    else if (c === "}" && --depth === 0) {
      try {
        return JSON.parse(html.slice(start, i + 1));
      } catch {
        return undefined;
      }
    }
  }
  return undefined;
}

const normUrl = (u: unknown): string | undefined => {
  let v = typeof u === "string" ? decodeEntities(u).trim() : "";
  if (/^mailto:/i.test(v)) return v;
  if (/^[a-z0-9-]+(\.[a-z0-9-]+)+(\/|$)/i.test(v)) v = "https://" + v;
  return /^https?:\/\//i.test(v) ? v : undefined;
};
const httpsUrl = (u: unknown) => (typeof u === "string" && /^https:\/\//i.test(u.trim()) ? u.trim() : undefined);

interface Cmpt {
  title?: string | null;
  links?: { link?: string | null; title?: string | null; state?: number }[];
  subs?: { link?: string | null; title?: string | null; state?: number }[];
  subtype?: string;
  state?: number;
}

export const instabio: Importer = {
  id: "instabio",
  label: "Instabio",
  match: (input) => profileUrl(input, ["instabio.cc"], { pathPattern: /^\/[A-Za-z0-9._-]{1,60}$/ }),
  extract(text) {
    try {
      const trimmed = text.trimStart();
      const result: ImportResult = { socials: {}, links: [], products: [] };

      if (trimmed.startsWith("{")) {
        // Mode 2: the lnkcmpts JSON.
        const json = JSON.parse(trimmed) as { cmpts?: string };
        const cmpts = (typeof json.cmpts === "string" ? JSON.parse(json.cmpts) : json.cmpts) as Cmpt[] | undefined;
        if (!Array.isArray(cmpts)) return null;
        const socialUrls: string[] = [];
        const seen = new Set<string>();
        for (const c of cmpts) {
          if (c.state === 0) continue;
          const folder = c.title?.trim() || undefined;
          for (const l of c.links ?? []) {
            const url = normUrl(l.link);
            const title = l.title?.trim();
            if (l.state === 0 || !url || !title || /^mailto:/i.test(url) || seen.has(url + title)) continue;
            seen.add(url + title);
            result.links.push({ title, url, folder });
          }
          for (const s of c.subs ?? []) {
            const url = normUrl(s.link);
            if (s.state === 0 || !url) continue;
            const title = s.title?.trim();
            // Icon-only entries (no title) are social buttons; titled entries in graphic/banner cards are real links.
            if (!title || /social/.test(c.subtype ?? "")) socialUrls.push(url);
            else if (!/^mailto:/i.test(url) && !seen.has(url + title)) {
              seen.add(url + title);
              result.links.push({ title, url, folder });
            }
          }
        }
        const { socials, rest } = splitSocials(socialUrls);
        result.socials = socials;
        // Social-button URLs that are not a known network (Telegram, Patreon, Spotify...) are still useful as plain links.
        for (const url of rest) {
          if (/^mailto:/i.test(url) || seen.has(url)) continue;
          seen.add(url);
          let host = url;
          try {
            host = new URL(url).hostname.replace(/^www\./, "");
          } catch {
            /* keep raw */
          }
          result.links.push({ title: host, url });
        }
        return result.links.length || Object.keys(result.socials).length ? result : null;
      }

      // Mode 1: profile HTML.
      const data = objectAfter(text, /window\.__data\s*=\s*\{/) as { ui?: { title?: string; desc?: string; avatar?: string; logo?: string } } | undefined;
      if (!data?.ui) return null;
      result.name = data.ui.title?.trim() || undefined;
      result.bio = data.ui.desc?.trim() || undefined;
      result.avatarUrl = httpsUrl(data.ui.avatar) ?? httpsUrl(data.ui.logo);
      return result.name || result.avatarUrl ? result : null;
    } catch {
      return null;
    }
  },
};
