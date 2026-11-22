/**
 * Checks links against Google Safe Browsing (free API) so a scam or phishing link can't be published on Showz.
 * Needs GOOGLE_SAFE_BROWSING_KEY. Without it, or if Google can't be reached, nothing is blocked.
 */
export async function unsafeUrls(urls: string[]): Promise<string[]> {
  const key = process.env.GOOGLE_SAFE_BROWSING_KEY;
  const list = [...new Set(urls.filter((u) => /^https?:\/\//i.test(u)))].slice(0, 500);
  if (!key || !list.length) return [];
  try {
    const res = await fetch(`https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client: { clientId: "showz", clientVersion: "1.0" },
        threatInfo: {
          threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
          platformTypes: ["ANY_PLATFORM"],
          threatEntryTypes: ["URL"],
          threatEntries: list.map((url) => ({ url })),
        },
      }),
      signal: AbortSignal.timeout(6_000),
    });
    if (!res.ok) return [];
    const d = (await res.json()) as { matches?: { threat: { url: string } }[] };
    return [...new Set((d.matches ?? []).map((m) => m.threat.url))];
  } catch {
    return [];
  }
}

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
