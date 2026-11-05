import type { Importer, ImportResult } from "./types";
import { decodeEntities, profileUrl, splitSocials } from "./helpers";

const RESERVED = new Set(["landing", "blog", "support", "pricing", "login", "signup", "register", "about", "terms", "privacy", "api", "app", "dashboard", "templates", "features"]);

const clean = (s: string) => decodeEntities(s.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
const httpsOnly = (s: string | undefined) => (s && /^https:\/\//i.test(s) ? decodeEntities(s) : undefined);

/**
 * Campsite.bio is a server-rendered Nuxt page: the profile name, intro, avatar, social icons and link
 * buttons are all plain HTML (the __NUXT__ blob is an opaque function call, so we parse the markup).
 */
export const campsite: Importer = {
  id: "campsite",
  label: "Campsite.bio",
  match: (input) =>
    profileUrl(input, ["campsite.bio"], {
      pathPattern: /^\/[A-Za-z0-9._-]{1,40}$/,
      build: (_h, path) => (RESERVED.has(path.slice(1).toLowerCase()) ? "" : `https://campsite.bio${path}`),
    }) || null,
  extract(html) {
    try {
      if (!/class="site__header/.test(html)) return null;
      const result: ImportResult = { socials: {}, links: [], products: [] };
      const header = /<header[^>]*class="site__header[\s\S]*?<\/header>/.exec(html)?.[0] ?? "";
      const name = /<h1[^>]*site__username[^>]*>([\s\S]*?)<\/h1>/.exec(header)?.[1];
      const intro = /<p[^>]*site__intro[^>]*>([\s\S]*?)<\/p>/.exec(header)?.[1];
      if (name) result.name = clean(name);
      if (intro) result.bio = clean(intro);
      result.avatarUrl = httpsOnly(/<img[^>]+src="([^"]+)"[^>]*site__profile-img/.exec(header)?.[1]);

      const socialUrls: string[] = [];
      const ul = /<ul[^>]*site-social[\s\S]*?<\/ul>/.exec(header)?.[0] ?? "";
      for (const m of ul.matchAll(/<a[^>]+href="([^"]+)"/g)) socialUrls.push(decodeEntities(m[1]!));
      result.socials = splitSocials(socialUrls).socials;

      const seen = new Set<string>();
      for (const m of html.matchAll(/<a\b[^>]*class="v-profile-btn[^"]*"[^>]*>([\s\S]*?)<\/a>/g)) {
        const tag = m[0].slice(0, m[0].indexOf(">") + 1);
        const url = decodeEntities(/href="([^"]*)"/.exec(tag)?.[1] ?? "").trim();
        const title = clean(/site-btn__text[^>]*>([\s\S]*?)<\/span>/.exec(m[1]!)?.[1] ?? "");
        if (!title || !/^(https?:|mailto:)/i.test(url) || /^https?:\/\/(www\.)?campsite\.(bio|to)/i.test(url)) continue;
        if (seen.has(url + title)) continue;
        seen.add(url + title);
        result.links.push({ title, url });
      }
      if (!result.name && !result.links.length) return null;
      return result;
    } catch {
      return null;
    }
  },
};
