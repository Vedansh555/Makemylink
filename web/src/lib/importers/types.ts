export type SocialKind = "instagram" | "tiktok" | "youtube" | "pinterest" | "email";

export interface ImportedLink {
  title: string;
  url: string;
  /** Group heading the link sits under, if the platform has groups or sections. */
  folder?: string;
}

export interface ImportedProduct {
  title: string;
  url: string;
  /** https image address. */
  image?: string;
  /** Display price such as "₹499" or "$20", only if the page shows one. */
  price?: string;
}

export interface ImportResult {
  name?: string;
  bio?: string;
  /** https address of the profile picture. */
  avatarUrl?: string;
  /** Social handles WITHOUT the @ or domain: { instagram: "aria", tiktok: "aria", email: "a@b.com" }. */
  socials: Partial<Record<SocialKind, string>>;
  links: ImportedLink[];
  products: ImportedProduct[];
  /** True if the page uses a dark colour scheme. */
  dark?: boolean;
}

export interface Importer {
  /** Short id, e.g. "linktree". */
  id: string;
  /** Name shown to people, e.g. "Linktree". */
  label: string;
  /**
   * Given text the user pasted, return the canonical https URL of the public profile page to fetch,
   * or null when the text is not a profile of this platform. Accept inputs like "beacons.ai/name",
   * "https://www.beacons.ai/name" and "name" only if unambiguous (usually require the domain).
   */
  match(input: string): string | null;
  /** Pure function: turn the fetched HTML into an ImportResult, or null if nothing usable is found. Never throws. */
  extract(html: string, url: string): ImportResult | null;
  /**
   * Optional second step for platforms whose links live in a separate public JSON file.
   * Given the page HTML, return that file's URL; the caller fetches it and passes the text to extract() again,
   * then merges the two results.
   */
  followUp?(html: string): string | null;
}
