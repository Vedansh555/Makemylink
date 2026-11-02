import { all, run } from "./db";
import { sendMail, esc } from "./mail";
import type { Profile } from "./types";
import { linkIsLive } from "./plans";

/** Blocks requests to private networks so the checker can't be pointed at our own infrastructure. */
function publicHttpUrl(raw: string): URL | null {
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    const h = u.hostname.toLowerCase();
    if (h === "localhost" || h.endsWith(".local") || h.endsWith(".internal") || /^\[/.test(h)) return null;
    if (/^(10\.|127\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|0\.)/.test(h)) return null;
    return u;
  } catch {
    return null;
  }
}

async function probe(url: URL): Promise<number | null> {
  for (const method of ["HEAD", "GET"]) {
    try {
      const res = await fetch(url, { method, redirect: "follow", signal: AbortSignal.timeout(8000), headers: { "User-Agent": "MakemylinkLinkChecker/1.0" } });
      if (res.status !== 405 && res.status !== 403 && !(method === "HEAD" && res.status >= 400)) return res.status;
      if (method === "GET") return res.status;
    } catch {
      if (method === "GET") return null;
    }
  }
  return null;
}

/** Checks every live link on Pro pages; emails the owner about links that just broke. Returns how many were checked. */
export async function runLinkCheck(): Promise<number> {
  const pages = await all<{ id: string; profile_json: string; email: string; handle: string }>(
    "SELECT p.id, p.profile_json, p.handle, u.email FROM pages p JOIN users u ON u.id = p.user_id WHERE u.plan = 'pro' AND (u.plan_renews_at IS NULL OR u.plan_renews_at > $1)",
    [Date.now()],
  );
  let checked = 0;
  for (const pg of pages) {
    const profile = JSON.parse(pg.profile_json) as Profile;
    const before = new Map((await all<{ link_id: string; ok: boolean }>("SELECT link_id, ok FROM link_health WHERE page_id = $1", [pg.id])).map((r) => [r.link_id, r.ok]));
    const newlyBroken: string[] = [];
    for (const l of profile.links.filter((x) => x.kind !== "booking" && linkIsLive(x)).slice(0, 60)) {
      const u = publicHttpUrl(l.url);
      if (!u) continue;
      const status = await probe(u);
      const ok = status !== null && status < 400;
      checked++;
      await run(
        "INSERT INTO link_health (page_id, link_id, url, status, ok, checked_at) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (page_id, link_id) DO UPDATE SET url = $3, status = $4, ok = $5, checked_at = $6",
        [pg.id, l.id, l.url, status, ok, Date.now()],
      );
      if (!ok && before.get(l.id) !== false) newlyBroken.push(`${l.title} — ${l.url} (${status ?? "no response"})`);
    }
    if (newlyBroken.length) {
      await sendMail(pg.email, "A link on your Makemylink page looks broken", `<p>These links failed our check:</p><ul>${newlyBroken.map((t) => `<li>${esc(t)}</li>`).join("")}</ul><p>Fix them in your editor so you don't lose clicks.</p>`);
    }
  }
  return checked;
}
