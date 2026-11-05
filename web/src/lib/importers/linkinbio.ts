import type { Importer, ImportResult, SocialKind } from "./types";
import { profileUrl, splitSocials } from "./helpers";

/**
 * Linkin.bio (Later) is a client-side Ember app: the HTML is an empty shell, so there is nothing to parse in it.
 * Its page loads one public JSON document, no login and no key:
 *     GET https://api-prod.linkin.bio/api/v2/pages?nickname={nickname}
 * Therefore `match` returns THAT endpoint URL (for input like "linkin.bio/nike") and `extract` takes that JSON text.
 * It reads the header block (display name, bio, avatar), button_list, featured_banner, multi_item_banner and
 * social_link_list blocks, and the connected Instagram/TikTok profiles. Instagram/TikTok post grids are not imported.
 */
const API = "https://api-prod.linkin.bio/api/v2/pages?nickname=";

const clean = (u: unknown): string | undefined => {
  if (typeof u !== "string") return undefined;
  try {
    const url = new URL(u.trim());
    if (url.protocol !== "https:" && url.protocol !== "http:") return undefined;
    for (const k of [...url.searchParams.keys()]) if (/^utm_/i.test(k)) url.searchParams.delete(k);
    return url.toString();
  } catch {
    return undefined;
  }
};
const https = (u: unknown) => (typeof u === "string" && /^https:\/\//i.test(u) ? u : undefined);

interface Item {
  url?: string;
  title?: string;
  enabled?: boolean;
}
interface Block {
  block_type?: string;
  block_data?: Record<string, unknown> & { enabled?: boolean; display_name?: string; bio?: string };
  linkinbio_attachments?: { name?: string; variants?: Record<string, { url?: string }> }[];
}

export const linkinbio: Importer = {
  id: "linkinbio",
  label: "Linkin.bio (Later)",
  match(input) {
    const url = profileUrl(input, ["linkin.bio"], { pathPattern: /^\/[A-Za-z0-9._-]{1,40}$/ });
    return url ? API + encodeURIComponent(new URL(url).pathname.slice(1)) : null;
  },
  extract(jsonText) {
    try {
      const page = (JSON.parse(jsonText) as { linkinbio_page?: { social_profiles?: Record<string, unknown>[]; linkinbio_blocks?: Block[] } }).linkinbio_page;
      if (!page) return null;
      const result: ImportResult = { socials: {}, links: [], products: [] };
      const profiles = page.social_profiles ?? [];
      const blocks = page.linkinbio_blocks ?? [];

      const header = blocks.find((b) => b.block_type === "header" && b.block_data?.enabled !== false);
      const first = profiles[0] as { name?: string; nickname?: string; avatar_url?: string } | undefined;
      result.name = header?.block_data?.display_name?.trim() || first?.name?.trim() || first?.nickname || undefined;
      result.bio = header?.block_data?.bio?.trim() || undefined;
      const att = header?.linkinbio_attachments?.find((a) => a.name === "avatar")?.variants;
      result.avatarUrl = https(att?.original?.url) ?? https(att?.thumb_md?.url) ?? https(first?.avatar_url);

      const socialUrls: string[] = [];
      const kinds: Record<string, SocialKind> = { InstagramProfile: "instagram", TikTokProfile: "tiktok" };
      for (const p of profiles as { profile_type?: string; nickname?: string }[]) {
        const kind = p.profile_type ? kinds[p.profile_type] : undefined;
        if (kind && p.nickname && !result.socials[kind]) result.socials[kind] = p.nickname;
      }

      const seen = new Set<string>();
      const add = (it: Item) => {
        const url = clean(it.url);
        const title = it.title?.trim();
        if (it.enabled === false || !url || !title || seen.has(url + title)) return;
        seen.add(url + title);
        result.links.push({ title, url });
      };
      for (const b of blocks) {
        const d = b.block_data;
        if (!d || d.enabled === false) continue;
        if (b.block_type === "button_list") for (const x of (d.buttons as Item[] | undefined) ?? []) add(x);
        else if (b.block_type === "featured_banner") add(d as Item);
        else if (b.block_type === "multi_item_banner") for (const x of (d.items as Item[] | undefined) ?? []) add(x);
        else if (b.block_type === "social_link_list") for (const x of (d.social_links as Item[] | undefined) ?? []) if (x.enabled !== false && x.url) socialUrls.push(x.url);
      }
      const { socials } = splitSocials(socialUrls);
      for (const [k, v] of Object.entries(socials)) if (!result.socials[k as SocialKind]) result.socials[k as SocialKind] = v;

      if (!result.name && !result.links.length) return null;
      return result;
    } catch {
      return null;
    }
  },
};
