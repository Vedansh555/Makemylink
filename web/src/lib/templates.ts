import { blankProfile } from "./demo";
import { themeList } from "./themes";
import type { BioLink, Look, Profile } from "./types";

/**
 * Starting points, one per goal. Each gives a page that already looks finished, so a new person edits
 * words instead of facing an empty form. Pro-only pieces (booking cards, card sizes) are included on purpose:
 * people can try them in the editor, and the publish step explains what needs Pro.
 */
export type Goal = "booking" | "products" | "email" | "import";

export const GOALS: { id: Goal; title: string; blurb: string; who: string }[] = [
  { id: "booking", title: "Get booked", blurb: "Followers pick a time and pay you for a 1:1 call. You keep 100%.", who: "Coaches, mentors, consultants" },
  { id: "products", title: "Show my products", blurb: "A photo grid of what you sell or recommend, each one a tap to the store.", who: "Creators, stylists, small shops" },
  { id: "email", title: "Grow my email list", blurb: "A sign-up box on a clean page, so every follower can become a subscriber.", who: "Writers, educators, anyone with a newsletter" },
  { id: "import", title: "Bring my existing page", blurb: "Paste the link of your Linktree or similar page. We copy everything over.", who: "Already have a link page" },
];

export const isGoal = (v: string | null | undefined): v is Goal => v === "booking" || v === "products" || v === "email" || v === "import";

const firstThemeOf = (family: string, fallback: string) => themeList.find((t) => t.family === family)?.id ?? fallback;

const link = (id: string, title: string, extra: Partial<BioLink> = {}): BioLink => ({ id, title, url: "https://", ...extra });
const look = (id: string, title: string, price: string, store: Look["store"], art: Look["art"], hue: number): Look => ({ id, title, price, store, url: "https://", art, hue });

/** The starting page for a goal. Name, handle and picture stay the person's own. */
export function starterFor(goal: Goal): Profile {
  const base: Profile = { ...blankProfile, socials: {}, links: [], looks: [], showMediaKit: false };
  switch (goal) {
    case "booking":
      return {
        ...base,
        theme: "navy-ink",
        bio: "Career coach. Book a 1:1 call and get a clear plan for your next step.",
        showSubscribe: true,
        links: [
          {
            id: "b1",
            title: "Book a 30-minute call",
            url: "",
            kind: "booking",
            featured: true,
            booking: { price: 999, currency: "INR", durationMin: 30, description: "A focused 1:1 session. Bring your questions.", meetingUrl: "https://meet.google.com/", days: [1, 2, 3, 4, 5], startHour: 10, endHour: 18, timeZone: "Asia/Kolkata" },
          },
          link("l1", "Free guide: add your link", { size: "1x1" }),
          link("l2", "My latest video", { size: "1x1" }),
        ],
      };
    case "products":
      return {
        ...base,
        theme: firstThemeOf("pop", "editorial"),
        bio: "Outfits and picks I love. Tap anything to shop it.",
        shopTitle: "Shop my picks",
        showSubscribe: true,
        links: [link("l1", "Today's video", { featured: true, image: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=240&q=80" }), link("l2", "My full shop")],
        looks: [
          look("k1", "Everyday dress", "₹1,499", "Myntra", "dress", 340),
          look("k2", "Tote bag", "₹899", "Amazon", "bag", 30),
          look("k3", "Block heels", "₹1,999", "Myntra", "heel", 10),
          look("k4", "Sunglasses", "₹699", "Nykaa", "shades", 210),
        ],
      };
    case "email":
      return {
        ...base,
        theme: firstThemeOf("minimal", "editorial"),
        bio: "One useful email a week. Join free below.",
        showSubscribe: true,
        links: [link("l1", "Read my latest post", { featured: true, image: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=240&q=80" }), link("l2", "Free starter guide"), link("l3", "About me")],
      };
    case "import":
    default:
      return { ...base, links: [link("l1", "My latest post", { featured: true })], showSubscribe: true };
  }
}

/** Design families that suit each goal. The first theme of each family is free on every plan. */
const LOOK_FAMILIES: Record<Exclude<Goal, "import">, string[]> = {
  booking: ["luxury", "editorial", "minimal", "glass", "mono", "brutalist"],
  products: ["pop", "gradient", "glass", "editorial", "neon", "chrome"],
  email: ["minimal", "editorial", "luxury", "mono", "gradient", "brutalist"],
};

/** Six theme ids to offer for a goal, each the first (free) theme of its family. */
export function looksFor(goal: Goal): { id: string; label: string }[] {
  if (goal === "import") return [];
  return LOOK_FAMILIES[goal]
    .map((f) => themeList.find((t) => t.family === f))
    .filter((t): t is NonNullable<typeof t> => !!t)
    .map((t) => ({ id: t.id, label: t.label }));
}

/** True when a profile is still the empty starter, so applying a template can't overwrite real work. */
export function isBlankProfile(p: Profile): boolean {
  const realLinks = p.links.filter((l) => (l.url && l.url !== "https://") || l.kind === "booking");
  return realLinks.length === 0 && p.looks.length === 0 && !p.avatar && (!p.bio || p.bio === blankProfile.bio);
}
