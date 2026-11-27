import crypto from "crypto";

/**
 * Refuses known phishing links when a page is published, using the open-source Phishing.Database list
 * (MIT licence, free for business use, no key): https://github.com/Phishing-Database/Phishing.Database
 *
 * The list is about 11 MB of domain names. Only a short fingerprint of each is kept (a few MB of memory),
 * refreshed twice a day. If it can't be fetched, nothing is blocked: publishing never depends on it.
 */
const LIST_URL = process.env.PHISHING_LIST_URL || "https://raw.githubusercontent.com/Phishing-Database/Phishing.Database/master/phishing-domains-ACTIVE.txt";
const REFRESH_MS = 12 * 3_600_000;
const RETRY_MS = 10 * 60_000;
const WAIT_MS = 8_000;

/** Big shared sites are never blocked as a whole, even if a list ever includes them by mistake. */
const TRUSTED = new Set(
  "google.com docs.google.com drive.google.com forms.gle meet.google.com calendar.google.com youtube.com youtu.be instagram.com facebook.com x.com twitter.com linkedin.com wa.me whatsapp.com api.whatsapp.com t.me telegram.me discord.gg spotify.com open.spotify.com amazon.com amazon.in flipkart.com myntra.com razorpay.me rzp.io paypal.me paypal.com github.com notion.so topmate.io calendly.com zoom.us teams.microsoft.com apple.com apps.apple.com play.google.com pinterest.com snapchat.com tiktok.com behance.net dribbble.com medium.com substack.com showz.me".split(" "),
);

interface List {
  prints: Float64Array;
  at: number;
}
const g = globalThis as unknown as { __phish?: { list?: List; loading?: Promise<void>; failedAt?: number } };
const state = (g.__phish ??= {});

/** A 48-bit fingerprint of a domain name. */
const print = (host: string) => crypto.createHash("sha1").update(host).digest().readUIntBE(0, 6);

const cleanHost = (h: string) => h.trim().toLowerCase().replace(/\.$/, "").replace(/^www\./, "");

async function load(): Promise<void> {
  try {
    const res = await fetch(LIST_URL, { signal: AbortSignal.timeout(60_000), cache: "no-store" });
    if (!res.ok) throw new Error(`list ${res.status}`);
    const text = await res.text();
    const found: number[] = [];
    let start = 0;
    while (start < text.length) {
      let end = text.indexOf("\n", start);
      if (end < 0) end = text.length;
      const line = cleanHost(text.slice(start, end));
      if (line && !line.startsWith("#") && line.includes(".")) found.push(print(line));
      start = end + 1;
    }
    if (!found.length) throw new Error("empty list");
    state.list = { prints: Float64Array.from(found).sort(), at: Date.now() };
    state.failedAt = undefined;
  } catch (e) {
    state.failedAt = Date.now();
    console.error("phishing list not loaded", e);
  }
}

/** The list if we have one. The first publish waits briefly for it; later refreshes happen in the background. */
async function currentList(): Promise<List | undefined> {
  const stale = !state.list || Date.now() - state.list.at > REFRESH_MS;
  const resting = state.failedAt && Date.now() - state.failedAt < RETRY_MS;
  if (stale && !resting) state.loading ??= load().finally(() => (state.loading = undefined));
  if (!state.list && state.loading) await Promise.race([state.loading, new Promise((r) => setTimeout(r, WAIT_MS))]);
  return state.list;
}

function has(list: List, value: number): boolean {
  let lo = 0;
  let hi = list.prints.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const v = list.prints[mid]!;
    if (v === value) return true;
    if (v < value) lo = mid + 1;
    else hi = mid - 1;
  }
  return false;
}

export async function unsafeUrls(urls: string[]): Promise<string[]> {
  const wanted = [...new Set(urls.filter((u) => /^https?:\/\//i.test(u)))].slice(0, 500);
  if (!wanted.length) return [];
  const list = await currentList();
  if (!list) return [];
  return wanted.filter((u) => {
    try {
      // Only the exact website is matched, so one bad address on a hosting service doesn't block its neighbours.
      const host = cleanHost(new URL(u).hostname);
      return !TRUSTED.has(host) && has(list, print(host));
    } catch {
      return false;
    }
  });
}

/** For the admin page: how many addresses are loaded, if any. */
export const phishingListSize = () => state.list?.prints.length ?? 0;

/** Every outside address a page links to. */
export function pageUrls(p: { links?: { url?: string; booking?: { paymentUrl?: string; meetingUrl?: string } }[]; looks?: { url?: string }[] }): string[] {
  const out: string[] = [];
  for (const l of p.links ?? []) {
    if (l.url) out.push(l.url);
    if (l.booking?.paymentUrl) out.push(l.booking.paymentUrl);
    if (l.booking?.meetingUrl) out.push(l.booking.meetingUrl);
  }
  for (const l of p.looks ?? []) if (l.url) out.push(l.url);
  return out;
}
