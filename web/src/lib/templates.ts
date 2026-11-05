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
        links: [link("l1", "Today's video", { featured: true }), link("l2", "My full shop")],
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
        links: [link("l1", "Read my latest post", { featured: true }), link("l2", "Free starter guide"), link("l3", "About me")],
      };
    case "import":
    default:
      return { ...base, links: [link("l1", "My latest post", { featured: true })], showSubscribe: true };
  }
}

/**
 * Made-up people for the style gallery, goal cards and homepage, so previews do not all show the same person.
 * Each has a real photo, a believable page and photos that fit what they do. This is for looking at only:
 * the editor starts from `starterFor`, which carries none of it.
 */
interface Persona {
  name: string;
  handle: string;
  avatar: string;
  city: string;
  bio: string;
  /** Booking card title, price in rupees, minutes and a line about the call. */
  call?: { title: string; price: number; min: number; text: string; currency?: "INR" | "USD" };
  /** Link titles with a photo for each. */
  links: [string, string][];
  looks?: { title: string; price: string; store: Look["store"]; art: Look["art"]; hue: number; photo: string }[];
}

const u = (id: string, w = 400) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

const PERSONAS: Record<Exclude<Goal, "import">, Persona[]> = {
  booking: [
    { name: "Priya Sharma", handle: "priya", avatar: u("1573497019940-1c28c88b4f3e"), city: "Bengaluru", bio: "Career coach. Book a 1:1 call and get a clear plan for your next step.", call: { title: "Career strategy call", price: 999, min: 30, text: "A focused 1:1 session. Bring your questions and leave with a clear plan." }, links: [["Free CV checklist", u("1498050108023-c5249f4df085", 640)], ["My reading list", u("1512820790803-83ca734da794", 640)]] },
    { name: "Arjun Mehta", handle: "arjunm", avatar: u("1519085360753-af0119f7cbe7"), city: "Mumbai", bio: "Startup mentor. I help first-time founders sort out pricing and their first ten customers.", call: { title: "Founder strategy call", price: 2499, min: 45, text: "Bring your idea or your numbers. We will pick the next three moves." }, links: [["The founder reading list", u("1512820790803-83ca734da794", 640)], ["My pricing teardown", u("1517694712202-14dd9538aa97", 640)]] },
    { name: "Kavya Nair", handle: "kavya", avatar: u("1567532939604-b6b5b0db2604"), city: "Kochi", bio: "Yoga and breathwork teacher. Gentle classes for stiff desk bodies.", call: { title: "1:1 yoga session", price: 799, min: 40, text: "A private class built around your body, your pace and your goals." }, links: [["Morning flow, free", u("1544367567-0f2fcb009e0b", 640)], ["Join the 21-day reset", u("1571019613454-1cb2f99b2d8b", 640)]] },
    { name: "Rohan Kapoor", handle: "rohank", avatar: u("1500648767791-00dcc994a43e"), city: "Delhi", bio: "Strength coach. Simple plans for busy people. No fads, no guilt.", call: { title: "Training plan call", price: 1499, min: 30, text: "We look at your week and build a plan you can actually keep." }, links: [["Free 4-week plan", u("1534438327276-14e5300c3a48", 640)], ["Home workout guide", u("1571019613454-1cb2f99b2d8b", 640)]] },
    { name: "Meera Iyer", handle: "meera", avatar: u("1531746020798-e6953c6e8e04"), city: "Chennai", bio: "Skin consultant. Honest routines that work on Indian skin and Indian budgets.", call: { title: "Skin routine consult", price: 899, min: 25, text: "Send a photo, get a routine you can follow with products you can find." }, links: [["My 5-step routine", u("1556228720-195a672e8a03", 640)], ["Facial at home, simple", u("1570172619644-dfd03ed5d881", 640)]] },
    { name: "Dana Cole", handle: "danacole", avatar: u("1438761681033-6461ffad8d80"), city: "Lisbon", bio: "Travel photographer. I teach you to shoot trips you will want to print.", call: { title: "Portfolio review call", price: 1999, min: 40, text: "Share your best twelve photos. I will tell you what to keep and what to fix." }, links: [["My camera bag", u("1488646953014-85cb44e25828", 640)], ["Editing presets", u("1498050108023-c5249f4df085", 640)]] },
  ],
  products: [
    { name: "Mira Kapoor", handle: "mirak", avatar: u("1544005313-94ddf0286df2"), city: "Mumbai", bio: "Things I love and actually use. Tap anything to shop it.", links: [] },
    { name: "Chloe Bennett", handle: "chloeb", avatar: u("1508214751196-bcfd4ca60f91"), city: "London", bio: "My favourite finds, with honest notes. Tap anything to shop it.", links: [] },
    { name: "Nisha Rao", handle: "nisharao", avatar: u("1580489944761-15a19d654956"), city: "Hyderabad", bio: "Picks I would tell a friend about. Real prices, no hype.", links: [] },
    { name: "Jack Morgan", handle: "jackm", avatar: u("1507591064344-4c6ce005b128"), city: "Austin", bio: "Stuff I buy twice. Reviews you can trust, links below.", links: [] },
    { name: "Isha Verma", handle: "ishav", avatar: u("1524504388940-b1c1722653e1"), city: "Pune", bio: "A small shop of things I rate. Tap anything to see it.", links: [] },
    { name: "Grace Miller", handle: "gracem", avatar: u("1558898479-33c0057a5d12"), city: "Toronto", bio: "What is in my cart this month. Tap anything to shop it.", links: [] },
  ],
  email: [
    { name: "Leela Menon", handle: "leela", avatar: u("1438761681033-6461ffad8d80"), city: "Delhi", bio: "One useful email a week on money and careers. Join free below.", links: [["Read this week's issue", u("1512820790803-83ca734da794", 640)], ["Start here: 5 best issues", u("1498050108023-c5249f4df085", 640)]] },
    { name: "Sam Fernandes", handle: "samf", avatar: u("1500648767791-00dcc994a43e"), city: "Goa", bio: "I write about slow living and small businesses. One email a week, never more.", links: [["The latest letter", u("1495474472287-4d71bcdd2085", 640)], ["My free starter guide", u("1512820790803-83ca734da794", 640)]] },
    { name: "Anika Bose", handle: "anikab", avatar: u("1580489944761-15a19d654956"), city: "Kolkata", bio: "Teacher turned writer. Plain-English lessons on design, every Sunday.", links: [["Sunday lesson", u("1517694712202-14dd9538aa97", 640)], ["Design basics, free", u("1498050108023-c5249f4df085", 640)]] },
  ],
};

const EN: Record<Exclude<Goal, "import">, Persona[]> = {
  booking: [
    { name: "Emma Carter", handle: "emmac", avatar: u("1529626455594-4ff0802cfb7e"), city: "London", bio: "Life coach. One honest conversation to get you unstuck.", call: { title: "Clarity call", price: 80, min: 45, text: "Tell me what is stuck. We leave with three clear next steps.", currency: "USD" }, links: [["My morning routine", u("1495474472287-4d71bcdd2085", 640)], ["Free reflection guide", u("1512820790803-83ca734da794", 640)]] },
    { name: "Daniel Brooks", handle: "danb", avatar: u("1530268729831-4b0b9e170218"), city: "Austin", bio: "Finance mentor. Plain-English money advice for freelancers.", call: { title: "Money review call", price: 120, min: 30, text: "Bring your numbers. I will tell you where the leaks are.", currency: "USD" }, links: [["Freelancer tax checklist", u("1498050108023-c5249f4df085", 640)], ["Books that changed my money", u("1512820790803-83ca734da794", 640)]] },
    { name: "Olivia Hayes", handle: "oliviah", avatar: u("1534751516642-a1af1ef26a56"), city: "Sydney", bio: "Nutritionist. Eating well without the rules and the guilt.", call: { title: "Nutrition consult", price: 60, min: 30, text: "We look at your week and build meals you will actually enjoy.", currency: "USD" }, links: [["Easy weeknight meals", u("1495474472287-4d71bcdd2085", 640)], ["Grocery list, free", u("1485955900006-10f4d324d411", 640)]] },
    { name: "James Walker", handle: "jwalker", avatar: u("1472099645785-5658abf4ff4e"), city: "Toronto", bio: "Executive coach. I help new managers lead with confidence.", call: { title: "Leadership session", price: 150, min: 50, text: "A private session on your hardest people problem right now.", currency: "USD" }, links: [["First 90 days guide", u("1517694712202-14dd9538aa97", 640)], ["My reading list", u("1512820790803-83ca734da794", 640)]] },
    { name: "Sophie Turner", handle: "sophiet", avatar: u("1548142813-c348350df52b"), city: "Melbourne", bio: "Portrait photographer. I teach you to shoot people naturally.", call: { title: "Portfolio review", price: 90, min: 40, text: "Send twelve photos. I will tell you what to keep and what to fix.", currency: "USD" }, links: [["My camera bag", u("1488646953014-85cb44e25828", 640)], ["Editing presets", u("1498050108023-c5249f4df085", 640)]] },
  ],
  products: [
    { name: "Ella Rivera", handle: "ellar", avatar: u("1488426862026-3ee34a7d66df"), city: "Los Angeles", bio: "Small-batch finds and daily favourites. Tap anything to shop.", links: [] },
    { name: "Noah Fischer", handle: "noahf", avatar: u("1552058544-f2b08422138a"), city: "Berlin", bio: "Gear I have used for a year before recommending. Links below.", links: [] },
  ],
  email: [
    { name: "Hannah Lee", handle: "hannahl", avatar: u("1488426862026-3ee34a7d66df"), city: "Seattle", bio: "One short email a week on design and focus. Join free below.", links: [["This week's issue", u("1517694712202-14dd9538aa97", 640)], ["Start here: best issues", u("1498050108023-c5249f4df085", 640)]] },
    { name: "Oliver Grant", handle: "oliverg", avatar: u("1463453091185-61582044d556"), city: "Manchester", bio: "Writing about small business and slow mornings, once a week.", links: [["Latest letter", u("1495474472287-4d71bcdd2085", 640)], ["Free starter guide", u("1512820790803-83ca734da794", 640)]] },
  ],
};
const mix = <T,>(a: T[], b: T[]): T[] => a.flatMap((x, i) => (b[i] ? [x, b[i]!] : [x])).concat(b.slice(a.length));
const POOL: Record<Exclude<Goal, "import">, Persona[]> = { booking: mix(PERSONAS.booking, EN.booking), products: mix(PERSONAS.products, EN.products), email: mix(PERSONAS.email, EN.email) };

const hexRgb = (hex: string) => {
  const h = hex.replace("#", "");
  const f = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6);
  return [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16) / 255) as [number, number, number];
};
function hueSat(hex: string): { h: number; sat: number } {
  const [r, g, b] = hexRgb(hex);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  if (d === 0) return { h: 0, sat: 0 };
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: (h * 60 + 360) % 360, sat: d / (1 - Math.abs(max + min - 1)) };
}

/** Graphic products for the demo pages. Each is drawn by the page itself, in the page's colour. */
const ART_SET: { title: string; inr: string; usd: string; store: Look["store"]; art: Look["art"] }[] = [
  { title: "Satin slip dress", inr: "₹2,499", usd: "$64", store: "Myntra", art: "dress" },
  { title: "Structured tote", inr: "₹1,899", usd: "$48", store: "Amazon", art: "bag" },
  { title: "Block heels", inr: "₹2,199", usd: "$59", store: "Nykaa", art: "heel" },
  { title: "Round sunglasses", inr: "₹1,299", usd: "$32", store: "Amazon", art: "shades" },
  { title: "Wrap coat", inr: "₹4,299", usd: "$110", store: "Myntra", art: "jacket" },
  { title: "Matte lipstick", inr: "₹699", usd: "$18", store: "Nykaa", art: "lipstick" },
  { title: "Signet ring", inr: "₹1,499", usd: "$38", store: "Own store", art: "ring" },
  { title: "Everyday trainers", inr: "₹5,999", usd: "$85", store: "Own store", art: "sneaker" },
  { title: "Ceramic mug", inr: "₹599", usd: "$16", store: "Amazon", art: "cup" },
  { title: "Mirrorless camera", inr: "₹48,999", usd: "$690", store: "Amazon", art: "camera" },
];

const seedOf = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

/** A lived-in version of the starter page for one goal. `seed` (a theme id, say) picks which made-up person, so a gallery shows variety. */
export function previewFor(goal: Goal, seed = "", themeId?: string): Profile {
  const base = starterFor(goal);
  if (goal === "import") return base;
  const pool = POOL[goal];
  const who = pool[(/^\d+$/.test(seed) ? Number(seed) : seedOf(seed)) % pool.length]!;
  // Products are drawn as graphics in the page's own colour (the same art the editor offers), so they can never clash with it.
  const accent = themeList.find((x) => x.id === (themeId ?? base.theme))?.accent ?? "#ff5b37";
  const { h: accentHue, sat: accentSat } = hueSat(accent);
  const tint = accentSat < 0.2 ? 215 : accentHue;
  const usd = /^(Chloe|Jack|Grace|Ella|Noah)\b/.test(who.name);
  const art0 = seedOf(themeId ?? seed) % ART_SET.length;
  let imgIdx = 0;
  const links = base.links.map((l, i) => {
    if (l.kind === "booking" && who.call) {
      return { ...l, title: who.call.title, booking: { ...l.booking!, price: who.call.price, currency: who.call.currency ?? "INR", durationMin: who.call.min, description: who.call.text } };
    }
    if (goal === "products") {
      return { ...l, title: i === 0 ? "Today's favourites" : "My full shop", image: undefined };
    }
    const pick = who.links[imgIdx++ % who.links.length]!;
    return { ...l, title: pick[0], image: pick[1] };
  });
  const looks = goal === "products"
    ? [0, 1, 2, 3].map((i) => {
        const k = ART_SET[(art0 + i) % ART_SET.length]!;
        return { id: `k${i + 1}`, title: k.title, price: usd ? k.usd : k.inr, store: k.store, url: "https://", art: k.art, hue: (tint + [0, 16, -14, 28][i]! + 360) % 360 };
      })
    : base.looks;
  return { ...base, name: who.name, handle: who.handle, avatar: who.avatar, location: who.city, bio: who.bio, socials: { instagram: who.handle, youtube: who.handle }, links, looks };
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
