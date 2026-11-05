const CHANNEL_ID = /UC[\w-]{22}/;
const cache = new Map<string, { at: number; video: { id: string; title: string } | null }>();
const TTL = 30 * 60 * 1000;

async function get(url: string) {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; ShowzBot/1.0)", "Accept-Language": "en" }, signal: AbortSignal.timeout(4000), redirect: "follow" });
  return res.ok ? await res.text() : "";
}

/** Finds the channel id (UC...) from an id, a /channel/ link, a @handle or a youtube.com link. */
async function channelId(input: string): Promise<string | null> {
  const raw = input.trim();
  const direct = raw.match(CHANNEL_ID);
  if (direct) return direct[0];
  let url = raw;
  if (/^@?[\w.-]+$/.test(raw)) url = `https://www.youtube.com/@${raw.replace(/^@/, "")}`;
  else if (!/^https?:\/\//i.test(raw)) url = `https://${raw}`;
  let host = "";
  try {
    host = new URL(url).hostname.replace(/^www\./, "").replace(/^m\./, "");
  } catch {
    return null;
  }
  if (host !== "youtube.com") return null;
  const html = await get(url);
  return html.match(/"(?:externalId|channelId)":"(UC[\w-]{22})"/)?.[1] ?? html.match(/channel_id=(UC[\w-]{22})/)?.[1] ?? null;
}

/** The newest public video of a channel, or null. Cached for 30 minutes. */
export async function latestVideo(input: string): Promise<{ id: string; title: string } | null> {
  const key = input.trim().toLowerCase();
  if (!key || key.length > 200) return null;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.video;
  let video: { id: string; title: string } | null = null;
  try {
    const id = await channelId(input);
    if (id) {
      const xml = await get(`https://www.youtube.com/feeds/videos.xml?channel_id=${id}`);
      const entry = xml.split("<entry>")[1];
      const vid = entry?.match(/<yt:videoId>([\w-]{11})<\/yt:videoId>/)?.[1];
      const title = entry?.match(/<title>([^<]*)<\/title>/)?.[1];
      if (vid) video = { id: vid, title: (title ?? "Latest video").replace(/&amp;/g, "&").replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").slice(0, 120) };
    }
  } catch {}
  if (cache.size > 500) cache.clear();
  cache.set(key, { at: Date.now(), video });
  return video;
}
