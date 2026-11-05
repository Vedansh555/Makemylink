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
  call?: { title: string; price: number; min: number; text: string };
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
    { name: "Mira Kapoor", handle: "mirak", avatar: u("1544005313-94ddf0286df2"), city: "Mumbai", bio: "Outfits and picks I love. Tap anything to shop it.", links: [["Today's try-on haul", u("1515886657613-9f3515b0c78f", 640)], ["My full shop", u("1584917865442-de89df76afd3", 640)]], looks: [{ title: "Satin slip dress", price: "₹2,499", store: "Myntra", art: "dress", hue: 350, photo: u("1595777457583-95e059d581b8", 600) }, { title: "Red structured tote", price: "₹1,899", store: "Amazon", art: "bag", hue: 10, photo: u("1584917865442-de89df76afd3", 600) }, { title: "Cobalt block heels", price: "₹2,199", store: "Nykaa", art: "heel", hue: 215, photo: u("1543163521-1bf539c55dd2", 600) }, { title: "Camel wrap coat", price: "₹4,299", store: "Myntra", art: "jacket", hue: 32, photo: u("1515886657613-9f3515b0c78f", 600) }] },
    { name: "Nisha Rao", handle: "nisharao", avatar: u("1580489944761-15a19d654956"), city: "Hyderabad", bio: "Sneaker obsessed. Honest reviews, no hype, real prices.", links: [["This week's drops", u("1542291026-7eec264c27ff", 640)], ["How I clean my whites", u("1491553895911-0055eca6402d", 640)]], looks: [{ title: "Crimson runners", price: "₹6,999", store: "Own store", art: "sneaker", hue: 5, photo: u("1542291026-7eec264c27ff", 600) }, { title: "Cloud-white trainers", price: "₹7,499", store: "Amazon", art: "sneaker", hue: 210, photo: u("1491553895911-0055eca6402d", 600) }, { title: "Electric blue pair", price: "₹8,299", store: "Own store", art: "sneaker", hue: 215, photo: u("1515955656352-a1fa3ffcd111", 600) }, { title: "Sage suede loafers", price: "₹3,999", store: "Myntra", art: "sneaker", hue: 150, photo: u("1560343090-f0409e92791a", 600) }] },
    { name: "Isha Verma", handle: "ishav", avatar: u("1524504388940-b1c1722653e1"), city: "Pune", bio: "Small-flat home styling. Calm rooms, warm light, nothing you cannot afford.", links: [["Tour of my 1BHK", u("1493663284031-b7e3aefcae8e", 640)], ["Plants that survive me", u("1485955900006-10f4d324d411", 640)]], looks: [{ title: "Mustard accent chair", price: "₹9,999", store: "Amazon", art: "cup", hue: 45, photo: u("1586023492125-27b2c045efd7", 600) }, { title: "Teal cushion set", price: "₹1,299", store: "Amazon", art: "cup", hue: 185, photo: u("1493663284031-b7e3aefcae8e", 600) }, { title: "Mint pot with succulent", price: "₹599", store: "Own store", art: "cup", hue: 150, photo: u("1485955900006-10f4d324d411", 600) }, { title: "Cold-brew set", price: "₹1,799", store: "Amazon", art: "cup", hue: 28, photo: u("1495474472287-4d71bcdd2085", 600) }] },
    { name: "Tara Singh", handle: "taras", avatar: u("1494790108377-be9c29b29330"), city: "Gurugram", bio: "Gadgets I actually use every day, tested for months before I recommend them.", links: [["My desk setup", u("1517694712202-14dd9538aa97", 640)], ["Headphones, ranked", u("1505740420928-5e560c06d30e", 640)]], looks: [{ title: "Studio headphones", price: "₹7,990", store: "Amazon", art: "camera", hue: 48, photo: u("1505740420928-5e560c06d30e", 600) }, { title: "Minimal smartwatch", price: "₹4,999", store: "Amazon", art: "camera", hue: 220, photo: u("1523275335684-37898b6baf30", 600) }, { title: "Laptop stand", price: "₹1,499", store: "Own store", art: "camera", hue: 200, photo: u("1498050108023-c5249f4df085", 600) }, { title: "Everyday tee", price: "₹799", store: "Myntra", art: "dress", hue: 0, photo: u("1521572163474-6864f9cf17ab", 600) }] },
  ],
  email: [
    { name: "Leela Menon", handle: "leela", avatar: u("1438761681033-6461ffad8d80"), city: "Delhi", bio: "One useful email a week on money and careers. Join free below.", links: [["Read this week's issue", u("1512820790803-83ca734da794", 640)], ["Start here: 5 best issues", u("1498050108023-c5249f4df085", 640)]] },
    { name: "Sam Fernandes", handle: "samf", avatar: u("1500648767791-00dcc994a43e"), city: "Goa", bio: "I write about slow living and small businesses. One email a week, never more.", links: [["The latest letter", u("1495474472287-4d71bcdd2085", 640)], ["My free starter guide", u("1512820790803-83ca734da794", 640)]] },
    { name: "Anika Bose", handle: "anikab", avatar: u("1580489944761-15a19d654956"), city: "Kolkata", bio: "Teacher turned writer. Plain-English lessons on design, every Sunday.", links: [["Sunday lesson", u("1517694712202-14dd9538aa97", 640)], ["Design basics, free", u("1498050108023-c5249f4df085", 640)]] },
  ],
};

const seedOf = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

/** A lived-in version of the starter page for one goal. `seed` (a theme id, say) picks which made-up person, so a gallery shows variety. */
export function previewFor(goal: Goal, seed = ""): Profile {
  const base = starterFor(goal);
  if (goal === "import") return base;
  const pool = PERSONAS[goal];
  const who = pool[(/^\d+$/.test(seed) ? Number(seed) : seedOf(seed)) % pool.length]!;
  let imgIdx = 0;
  const links = base.links.map((l) => {
    if (l.kind === "booking" && who.call) {
      return { ...l, title: who.call.title, booking: { ...l.booking!, price: who.call.price, durationMin: who.call.min, description: who.call.text } };
    }
    const pick = who.links[imgIdx++ % who.links.length]!;
    return { ...l, title: pick[0], image: pick[1] };
  });
  const looks = who.looks
    ? who.looks.map((k, i) => ({ id: `k${i + 1}`, title: k.title, price: k.price, store: k.store, url: "https://", art: k.art, hue: k.hue, image: k.photo }))
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
