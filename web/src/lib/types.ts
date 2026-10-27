/** One of the ids in themeList (lib/themes.ts). */
export type ThemeId = string;

export type ArtKind =
  | "dress"
  | "bag"
  | "heel"
  | "shades"
  | "jacket"
  | "lipstick"
  | "ring"
  | "sneaker"
  | "vinyl"
  | "cup"
  | "camera"
  | "book"
  | "cat"
  | "dog"
  | "plane"
  | "building";

export type Store = "LTK" | "ShopMy" | "Amazon" | "Myntra" | "Nykaa" | "Own store";

export interface BioLink {
  id: string;
  title: string;
  url: string;
  featured?: boolean;
  /** Links sharing the same folder name are grouped under a collapsible heading. */
  folder?: string;
}

export interface Look {
  id: string;
  title: string;
  price: string;
  store: Store;
  url: string;
  /** Uploaded photo (data URL) — falls back to generated art. */
  image?: string;
  art: ArtKind;
  hue: number;
}

export interface Socials {
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  pinterest?: string;
  email?: string;
}

export interface MediaKit {
  followers: string;
  engagement: string;
  avgViews: string;
  audience: string;
  brands: string[];
}

export interface Profile {
  handle: string;
  name: string;
  bio: string;
  location?: string;
  avatar?: string;
  /** A full-width photo behind the header — the single biggest thing real creator pages have that ours were missing. */
  coverImage?: string;
  theme: ThemeId;
  /** Overrides the theme's own accent color when set. */
  accentOverride?: string;
  /** Overrides the theme's own name font when set — one of lib/themes.ts's FontKey values. */
  fontOverride?: string;
  socials: Socials;
  links: BioLink[];
  looks: Look[];
  /** Heading for the product grid, e.g. "Shop my looks" or "Merch". */
  shopTitle?: string;
  mediaKit?: MediaKit;
  showMediaKit: boolean;
  showSubscribe: boolean;
}
