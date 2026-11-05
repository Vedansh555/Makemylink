import type { Importer, ImportResult } from "./types";
import { decodeEntities, profileUrl, splitSocials } from "./helpers";

const RESERVED = new Set(["login", "signup", "register", "terms", "privacy", "help", "about", "blog", "pricing", "api", "app"]);

const httpUrl = (u: unknown) => {
  const v = typeof u === "string" ? decodeEntities(u).trim() : "";
  return /^https?:\/\//i.test(v) ? v : undefined;
};

/** Pull the balanced JSON object that follows `marker` (handles strings and escapes; ignores trailing statements). */
function objectAfter(html: string, marker: RegExp): unknown | undefined {
  const m = marker.exec(html);
  if (!m) return undefined;
  const start = html.indexOf("{", m.index + m[0].length - 1);
  if (start < 0) return undefined;
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

interface BsLink {
  name?: string;
  url?: string;
  price?: string | number;
  thumbnail_url?: string;
}
interface BsSection {
  type?: string;
  section?: { handles?: { type?: string; value?: string; url?: string }[]; links?: BsLink[] };
}

/**
 * Bio.site (Squarespace / Unfold) is server-rendered and also embeds the whole page as
 * `window.initial_state = {...}`: header {name, bio, profile_photo} plus body sections
 * (section_social.handles, section_links.links).
 */
export const biosite: Importer = {
  id: "biosite",
  label: "Bio.site",
  match(input) {
    const url = profileUrl(input, ["bio.site"], { pathPattern: /^\/[A-Za-z0-9._-]{1,40}$/ });
    if (!url) return null;
    return RESERVED.has(new URL(url).pathname.slice(1).toLowerCase()) ? null : url;
  },
  extract(html) {
    try {
      const state = objectAfter(html, /window\.initial_state\s*=\s*\{/) as
        | { header?: { name?: string; bio?: string; profile_photo?: string }; body?: BsSection[]; background?: string; theme?: { background?: { appearance?: string } } }
        | undefined;
      if (!state || typeof state !== "object") return null;

      const result: ImportResult = { socials: {}, links: [], products: [] };
      result.name = state.header?.name?.trim() || undefined;
      result.bio = state.header?.bio?.trim() || undefined;
      result.avatarUrl = httpUrl(state.header?.profile_photo);

      const socialUrls: string[] = [];
      const seen = new Set<string>();
      for (const sec of Array.isArray(state.body) ? state.body : []) {
        if (sec.type === "section_social") {
          for (const h of sec.section?.handles ?? []) {
            if (h.type === "email" && h.value) socialUrls.push("mailto:" + h.value);
            else if (httpUrl(h.url)) socialUrls.push(h.url!);
          }
        } else if (sec.type === "section_links") {
          for (const l of sec.section?.links ?? []) {
            const url = httpUrl(l.url);
            const title = l.name?.trim();
            if (!url || !title || seen.has(url + title)) continue;
            seen.add(url + title);
            const price = l.price !== undefined && l.price !== null && String(l.price).trim() ? String(l.price).trim() : undefined;
            if (price) result.products.push({ title, url, image: httpUrl(l.thumbnail_url), price });
            else result.links.push({ title, url });
          }
        }
      }
      result.socials = splitSocials(socialUrls).socials;
      result.dark = state.theme?.background?.appearance === "dark";

      if (!result.name && !result.links.length && !result.products.length) return null;
      return result;
    } catch {
      return null;
    }
  },
};
