import type { Importer, ImportResult } from "./types";
import { profileUrl, scriptJsonById, splitSocials } from "./helpers";

interface LtLink {
  id: number | string;
  title?: string;
  url?: string;
  type?: string;
  thumbnail?: string;
  parent?: { id: number | string } | null;
}

/** Linktree embeds the whole public page as JSON in <script id="__NEXT_DATA__">. */
export const linktree: Importer = {
  id: "linktree",
  label: "Linktree",
  match: (input) => profileUrl(input, ["linktr.ee"], { pathPattern: /^\/[A-Za-z0-9._-]{1,40}$/ }),
  extract(html) {
    try {
      const props = (scriptJsonById(html, "__NEXT_DATA__") as { props?: { pageProps?: Record<string, unknown> } } | undefined)?.props?.pageProps;
      if (!props) return null;
      const account = (props.account ?? {}) as Record<string, unknown>;
      const all = (Array.isArray(props.links) ? props.links : []) as LtLink[];

      const group = new Map<string, string>();
      for (const l of all) if (l.type === "GROUP" && l.title) group.set(String(l.id), String(l.title));

      const result: ImportResult = { socials: {}, links: [], products: [] };
      for (const l of all) {
        if (!l.title || !l.url || l.type === "GROUP") continue;
        if (l.type === "COMMERCE_PRODUCT") result.products.push({ title: l.title, url: l.url, image: l.thumbnail });
        else result.links.push({ title: l.title, url: l.url, folder: l.parent ? group.get(String(l.parent.id)) : undefined, image: l.thumbnail });
      }
      const urls = ((Array.isArray(props.socialLinks) ? props.socialLinks : []) as { url?: string }[]).map((s) => s.url ?? "").filter(Boolean);
      result.socials = splitSocials(urls).socials;
      result.name = String(account.pageTitle ?? "").replace(/^@/, "") || String(account.username ?? "");
      result.bio = String(account.description ?? "");
      result.avatarUrl = String(account.profilePictureUrl ?? account.customAvatar ?? "") || undefined;
      const theme = props.theme as { luminance?: string; mode?: string } | undefined;
      result.dark = theme?.luminance === "DARK" || theme?.mode === "dark";
      return result;
    } catch {
      return null;
    }
  },
};
