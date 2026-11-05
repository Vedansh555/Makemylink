import type { Importer, ImportResult } from "./types";
import { decodeEntities, profileUrl, socialFromUrl, splitSocials } from "./helpers";

const httpUrl = (u: string | undefined) => {
  const v = u ? decodeEntities(u).trim() : "";
  return /^https?:\/\//i.test(v) ? v : undefined;
};

const textOf = (html: string) =>
  decodeEntities(html.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();

const GENERIC_NAME = /^(my links?|links?|link in bio|my website|home)\W*$/i;
const PLATFORM_LABEL = /^(instagram|facebook|tik ?tok|youtube|twitter|x|pinterest|e-?mail|gmail)\W*$/i;

/**
 * Milkshake (msha.ke) is server-rendered but built from swappable "look" cards, so there is no stable JSON.
 * What is stable: the <title> ("Name • @handle • Milkshake Website Builder"), <meta profile:username>, the first
 * images.msha.ke image (profile/cover photo), look*__subheading/__body text (bio), and every outbound link is an
 * <a rel="ugc nofollow noopener" target="_blank">. Layout-specific extras (YouTube embeds, shop cards) are not imported.
 */
export const milkshake: Importer = {
  id: "milkshake",
  label: "Milkshake",
  match: (input) =>
    profileUrl(input, ["msha.ke"], {
      pathPattern: /^\/[A-Za-z0-9._-]{1,40}$/,
      build: (host, path) => `https://${host}${path}/`,
    }),
  extract(html) {
    try {
      if (!/Milkshake Website Builder|milkshake-site/.test(html)) return null;
      const result: ImportResult = { socials: {}, links: [], products: [] };

      const handle = /<meta[^>]+property="profile:username"[^>]+content="([^"]+)"/i.exec(html)?.[1];
      const title = /<title>([\s\S]*?)<\/title>/i.exec(html)?.[1];
      let name = title ? decodeEntities(title).split("•")[0]!.trim().replace(/^@/, "") : "";
      if (!name || GENERIC_NAME.test(name)) name = handle ?? "";
      result.name = name || undefined;

      const body = html.slice(Math.max(0, html.indexOf("<body")));
      const bio = /<(?:h2|p|div)[^>]*class="look\d+-[a-z-]+__(?:subheading|body)"[^>]*>([\s\S]*?)<\/(?:h2|p|div)>/i.exec(body)?.[1];
      result.bio = bio ? textOf(bio) || undefined : undefined;
      result.avatarUrl = httpUrl(/<img[^>]+src="(https:\/\/images\.msha\.ke\/[^"]+)"/i.exec(body)?.[1]);

      const seen = new Set<string>();
      const socialUrls: string[] = [];
      for (const m of body.matchAll(/<a\s[^>]*>[\s\S]*?<\/a>/gi)) {
        const tag = m[0].slice(0, m[0].indexOf(">") + 1);
        if (!/rel="[^"]*\bugc\b/i.test(tag)) continue; // only the owner's own outbound links
        const href = httpUrl(/href="([^"]*)"/i.exec(tag)?.[1]);
        if (!href) continue;
        let host = "";
        try {
          host = new URL(href).hostname;
        } catch {
          continue;
        }
        if (/(^|\.)(msha\.ke|milkshake\.app)$/.test(host)) continue;
        const label = textOf(m[0].replace(/<svg[\s\S]*?<\/svg>/gi, ""));
        if (socialFromUrl(href)) socialUrls.push(href);
        if (!label || (socialFromUrl(href) && PLATFORM_LABEL.test(label)) || /^subscribe$/i.test(label)) continue;
        const key = href + "|" + label;
        if (seen.has(key)) continue;
        seen.add(key);
        result.links.push({ title: label.slice(0, 200), url: href });
      }
      result.socials = splitSocials(socialUrls).socials;

      if (!result.links.length && !result.name) return null;
      return result;
    } catch {
      return null;
    }
  },
};
