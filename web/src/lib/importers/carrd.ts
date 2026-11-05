import type { Importer } from "./types";
import { generic, normaliseWebUrl, stripTags } from "./generic";

const RESERVED = new Set(["www", "carrd", "try", "app", "help", "api", "build", "go", "blog"]);
const GENERIC_HEADING = /^(hey|hi|hello|welcome|links?|my links|about( me)?|contact|portfolio|menu|home|follow me|find me)[!.:\s]*$/i;

function carrdHost(url: string): string | null {
  try {
    const host = new URL(url).hostname.toLowerCase();
    const m = /^([a-z0-9-]+)\.carrd\.co$/.exec(host);
    return m && !RESERVED.has(m[1]!) ? host : null;
  } catch {
    return null;
  }
}

/**
 * Carrd one-page sites are plain static HTML: a profile image in assets/images, h1/h2/p text blocks,
 * and links styled as buttons. The generic extractor handles the links; here we pick the name from the
 * on-page heading (the <title> is usually a generic page title) and the avatar from the first Carrd image.
 */
export const carrd: Importer = {
  id: "carrd",
  label: "Carrd",
  match(input) {
    const url = normaliseWebUrl(input);
    if (!url) return null;
    const host = carrdHost(url);
    return host ? `https://${host}/` : null;
  },
  extract(html, url) {
    try {
      const base = generic.extract(html, url);
      if (!base) return null;
      const main = html.replace(/<(script|style|noscript)\b[\s\S]*?<\/\1>/gi, " ");

      for (const m of main.matchAll(/<(h[12])\b[^>]*>([\s\S]*?)<\/\1>/gi)) {
        const t = stripTags(m[2]!);
        if (t && t.length <= 40 && !GENERIC_HEADING.test(t)) {
          base.name = t;
          break;
        }
      }

      const img = /<img\b[^>]*\ssrc=["']([^"']*assets\/images\/[^"']+)["']/i.exec(main)?.[1];
      if (img) {
        try {
          const abs = new URL(img.replace(/&amp;/g, "&"), url).toString();
          if (/^https?:/i.test(abs) && !/\.svg(\?|$)/i.test(abs)) base.avatarUrl = abs.replace(/^http:/i, "https:");
        } catch {
          /* keep generic avatar */
        }
      }

      base.links = base.links.filter((l) => !/carrd\.co\/build|\/\/(www\.)?carrd\.co\/?$/i.test(l.url) && !/^(made with|powered by)/i.test(l.title));
      // Carrd headings like "Links" are just section labels; keep folders only when there are several groups.
      const folders = new Set(base.links.map((l) => l.folder).filter(Boolean));
      if (folders.size < 2) for (const l of base.links) delete l.folder;
      if (!base.links.length && !Object.keys(base.socials).length) return null;
      return base;
    } catch {
      return null;
    }
  },
};
