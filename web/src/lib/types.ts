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

export type BlockSize = "1x1" | "2x1" | "2x2";

/** A bookable 1:1 session. Pro only. */
export interface BookingConfig {
  /** Whole rupees (INR) or whole dollars (USD). */
  price: number;
  currency: "INR" | "USD";
  durationMin: number;
  description?: string;
  /** Meeting link sent to the buyer after payment (Google Meet, Zoom...). */
  meetingUrl: string;
  /** 0 = Sunday ... 6 = Saturday. */
  days: number[];
  /** Hours of the day in the creator's time zone, 24h clock. */
  startHour: number;
  endHour: number;
  /** IANA time zone of the creator, e.g. Asia/Kolkata. */
  timeZone: string;
  /** INR sessions are paid straight to the creator's UPI ID (0% fee, no middleman). */
  upiId?: string;
  /** USD sessions are paid through the creator's own Stripe/PayPal payment link. */
  paymentUrl?: string;
}

export interface BioLink {
  id: string;
  title: string;
  url: string;
  featured?: boolean;
  /** Links sharing the same folder name are grouped under a collapsible heading. */
  folder?: string;
  /** "booking" renders a paid 1:1 booking card instead of a plain link. */
  kind?: "link" | "booking";
  booking?: BookingConfig;
  /** Card size in the Bento grid. Pro only; Free is always 1x1. */
  size?: BlockSize;
  /** Epoch ms. The link appears from this moment... */
  startsAt?: number;
  /** ...and disappears after this one. */
  expiresAt?: number;
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
  /** Pro only: remove the "Made with Showz" badge. */
  hideBadge?: boolean;
}
