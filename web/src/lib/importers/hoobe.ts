import type { Importer, ImportResult } from "./types";
import { decodeEntities, jsonLdBlocks, profileUrl, socialFromUrl, splitSocials } from "./helpers";

const GENERIC_LABEL = /^(link|instagram|tik ?tok|youtube|x|twitter|pinterest|e-?mail)$/i;

const RESERVED = new Set(["members", "music", "for-creators", "support", "signup", "login", "pricing", "blog", "about", "terms", "privacy", "contact", "careers", "press", "legal", "api", "explore"]);

const httpUrl = (u: string | undefined) => {
  const v = u ? decodeEntities(u).trim() : "";
  return /^https?:\/\//i.test(v) ? v : undefined;
};

const textOf = (html: string) =>
  decodeEntities(html.replace(/<[^>]+>/g, " "))
    .replace(/ /g, " ")
    .replace(/\s+/g, " ")
    .trim();

interface LdPerson {
  name?: string;
  description?: string;
  image?: string;
  sameAs?: string[];
}

/**
 * Hoo.be pages are server-rendered Next.js. Profile data is in a schema.org ProfilePage JSON-LD block
 * (name, image, description, sameAs = social icons); the link buttons are plain <a> tags with visible text.
 */
export const hoobe: Importer = {
  id: "hoobe",
  label: "Hoo.be",
  match(input) {
    const url = profileUrl(input, ["hoo.be"], { pathPattern: /^\/[A-Za-z0-9._-]{1,40}$/ });
    if (!url) return null;
    return RESERVED.has(new URL(url).pathname.slice(1).toLowerCase()) ? null : url;
  },
  extract(html) {
    try {
      let person: LdPerson | undefined;
      for (const b of jsonLdBlocks(html)) {
        const block = b as { "@type"?: string; mainEntity?: LdPerson };
        if (block?.["@type"] === "ProfilePage" && block.mainEntity) person = block.mainEntity;
      }
      if (!person) return null;

      const result: ImportResult = { socials: {}, links: [], products: [] };
      result.name = person.name?.trim() || undefined;
      const desc = person.description?.trim();
      // Hoo.be fills in "Every link from X, in one place." when the owner wrote no bio.
      result.bio = desc && !/^Every link from .* in one place\.?$/i.test(desc) ? desc : undefined;
      const img = httpUrl(person.image);
      result.avatarUrl = img && !/\/placeholders\//.test(img) ? img : undefined; // skip Hoo.be's default grey avatar

      const sameAs = (Array.isArray(person.sameAs) ? person.sameAs : []).filter((s): s is string => typeof s === "string");
      const socialUrls = [...sameAs];

      const seen = new Set<string>();
      for (const m of html.matchAll(/<a\s[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)) {
        const href = httpUrl(m[1]);
        const title = textOf(m[2]!);
        if (!href || !title) continue;
        let host = "";
        try {
          host = new URL(href).hostname.replace(/^www\./, "");
        } catch {
          continue;
        }
        if (host === "hoo.be" || host === "hoobe.media") continue; // own branding / signup banner
        const isSocial = !!socialFromUrl(href);
        if (isSocial) socialUrls.push(href);
        if (isSocial && GENERIC_LABEL.test(title)) continue; // icon-style button already covered by socials
        const key = href + "|" + title;
        if (seen.has(key)) continue;
        seen.add(key);
        result.links.push({ title: title.slice(0, 200), url: href });
      }

      result.socials = splitSocials(socialUrls).socials;
      if (!result.name && !result.links.length) return null;
      return result;
    } catch {
      return null;
    }
  },
};
