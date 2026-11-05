/**
 * Close-up portraits for demo pages: a shortlist of well-lit, friendly faces, chosen one per person from the seed.
 * Only the profile picture is a photo. Everything else on a demo page is drawn in the page's own colours.
 */
const WOMEN = ["1531123897727-8f129e1688ce", "1521146764736-56c929d59c83", "1494790108377-be9c29b29330", "1601412436009-d964bd02edbc", "1534528741775-53994a69daeb", "1509967419530-da38b4704bc6", "1488426862026-3ee34a7d66df", "1499952127939-9bbf5af6c51c", "1523824921871-d6f1a15151f1", "1534751516642-a1af1ef26a56", "1485893086445-ed75865251e0"];
const MEN = ["1500648767791-00dcc994a43e", "1552058544-f2b08422138a", "1463453091185-61582044d556", "1492562080023-ab3db95bfbce", "1507591064344-4c6ce005b128", "1530268729831-4b0b9e170218"];

const hash = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 11);

const MALE_FIRST = /^(arjun|rohan|daniel|james|jack|noah|sam|oliver|leo|kai|atlas|bobby|keyz|dan|ravi|aman)/i;
/** Guesses "m" or "f" from a first name or handle, so a face matches the name beside it. */
export const genderOf = (nameOrHandle: string): "m" | "f" => (MALE_FIRST.test(nameOrHandle.trim()) ? "m" : "f");

/** A face from the shortlist. With `index` the faces go round in order, so neighbouring pages never share one; without it the seed picks. */
export function portrait(seed: string, gender: "m" | "f", index?: number): string {
  const list = gender === "m" ? MEN : WOMEN;
  const id = list[(index ?? hash(seed)) % list.length]!;
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&crop=faces&w=400&h=400&q=80`;
}

export function hueOfHex(hex: string): { h: number; sat: number } {
  const x = hex.replace("#", "");
  const f = x.length === 3 ? x.split("").map((c) => c + c).join("") : x.slice(0, 6);
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16) / 255) as [number, number, number];
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  if (d === 0) return { h: 0, sat: 0 };
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: (h * 60 + 360) % 360, sat: d / (1 - Math.abs(max + min - 1)) };
}
