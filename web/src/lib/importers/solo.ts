import type { Importer, ImportResult } from "./types";
import { decodeEntities, metaContent, profileUrl, splitSocials } from "./helpers";

const RESERVED = new Set(["pricing", "register", "login", "homepage", "how-it-works", "help", "blog", "terms", "privacy", "contact", "about", "css", "js", "images", "api"]);

const text = (html: string) =>
  decodeEntities(
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "")
  )
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim();

const httpUrl = (u: string | undefined) => {
  const v = u ? decodeEntities(u).trim() : "";
  return /^https?:\/\//i.test(v) ? v : undefined;
};

/**
 * Solo.to renders the whole public page on the server (plain HTML, no embedded JSON):
 * h1.profile-name, p.profile-bio, img.profile-image, a.link-button (> .link-name), social icon anchors
 * (.minimal-button / .action-button) and an obfuscated contact e-mail in data-em (base64 of a URL-encoded address).
 */
export const solo: Importer = {
  id: "solo",
  label: "Solo.to",
  match(input) {
    const url = profileUrl(input, ["solo.to"], { pathPattern: /^\/[A-Za-z0-9._-]{1,40}$/ });
    if (!url) return null;
    return RESERVED.has(new URL(url).pathname.slice(1).toLowerCase()) ? null : url;
  },
  extract(html) {
    try {
      if (!/profile-name/.test(html)) return null;
      const result: ImportResult = { socials: {}, links: [], products: [] };

      const name = /<h1[^>]*class="[^"]*profile-name[^"]*"[^>]*>([\s\S]*?)<\/h1>/i.exec(html)?.[1];
      result.name = name ? text(name) : undefined;
      const bio = /<p[^>]*class="[^"]*profile-bio[^"]*"[^>]*>([\s\S]*?)<\/p>/i.exec(html)?.[1];
      result.bio = bio ? text(bio) : undefined;
      const avatar = /<img[^>]+src="([^"]+)"[^>]*class="[^"]*\bprofile-image\b/i.exec(html)?.[1];
      result.avatarUrl = httpUrl(avatar) ?? httpUrl(metaContent(html, "og:image"));

      const socialUrls: string[] = [];
      for (const m of html.matchAll(/<a\s[^>]*href="([^"]+)"[^>]*class="[^"]*(?:minimal-button|action-button)[^"]*"/gi)) socialUrls.push(decodeEntities(m[1]!));
      for (const m of html.matchAll(/<a\s[^>]*class="[^"]*(?:minimal-button|action-button)[^"]*"[^>]*href="([^"]+)"/gi)) socialUrls.push(decodeEntities(m[1]!));
      const em = /data-em="([A-Za-z0-9+/=]+)"/.exec(html)?.[1];
      if (em) {
        try {
          const addr = decodeURIComponent(Buffer.from(em, "base64").toString("utf8"));
          if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(addr)) socialUrls.push("mailto:" + addr);
        } catch {
          /* ignore */
        }
      }
      result.socials = splitSocials(socialUrls).socials;

      const seen = new Set<string>();
      for (const m of html.matchAll(/<a\s[^>]*class="[^"]*\blink-button\b[^"]*"[^>]*>([\s\S]*?)<\/a>/gi)) {
        const tag = m[0].slice(0, m[0].indexOf(">") + 1);
        const href = httpUrl(/href="([^"]*)"/i.exec(tag)?.[1]);
        const title = /<div[^>]*class="link-name"[^>]*>([\s\S]*?)<\/div>/i.exec(m[1]!)?.[1];
        const t = title ? text(title) : "";
        if (!href || !t || seen.has(href + t)) continue;
        seen.add(href + t);
        result.links.push({ title: t, url: href });
      }

      result.dark = /profile-info-wrapper-(?:dark|void)/.test(html);
      if (!result.name && !result.links.length) return null;
      return result;
    } catch {
      return null;
    }
  },
};
