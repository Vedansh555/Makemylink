import dns from "dns/promises";
import net from "net";

const UA = "Mozilla/5.0 (compatible; ShowzImport/1.0)";

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number) as [number, number];
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
  }
  const v = ip.toLowerCase();
  return v === "::1" || v === "::" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80") || v.startsWith("::ffff:127.") || v.startsWith("::ffff:10.") || v.startsWith("::ffff:192.168.");
}

/** Rejects non-http(s) URLs, credentials, odd ports, IP literals and any host that resolves to a private address. */
export async function assertPublicUrl(raw: string): Promise<URL> {
  const u = new URL(raw);
  if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error("bad protocol");
  if (u.username || u.password) throw new Error("credentials not allowed");
  if (u.port && u.port !== "80" && u.port !== "443") throw new Error("port not allowed");
  const host = u.hostname.toLowerCase();
  if (net.isIP(host)) throw new Error("IP addresses not allowed");
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal") || !host.includes(".")) throw new Error("host not allowed");
  const addrs = await dns.lookup(host, { all: true });
  if (!addrs.length || addrs.some((a) => isPrivateIp(a.address))) throw new Error("private address");
  return u;
}

async function getFollowing(url: string, accept: string, maxBytes: number, timeoutMs: number) {
  let current = url;
  for (let hop = 0; hop < 4; hop++) {
    const u = await assertPublicUrl(current); // every hop is checked, so a redirect can't reach an internal address
    const res = await fetch(u, { redirect: "manual", signal: AbortSignal.timeout(timeoutMs), headers: { "User-Agent": UA, Accept: accept, "Accept-Language": "en" } });
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      current = new URL(res.headers.get("location")!, u).toString();
      continue;
    }
    // Read at most maxBytes so a huge page can't exhaust memory.
    const reader = res.body?.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    if (reader) {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.length;
        if (size > maxBytes) {
          await reader.cancel();
          break;
        }
        chunks.push(value);
      }
    }
    return { res, body: Buffer.concat(chunks), finalUrl: u.toString() };
  }
  throw new Error("too many redirects");
}

/** Fetches a public web page as text (max ~3 MB, 10 s). */
export async function safeGetText(url: string): Promise<{ ok: boolean; status: number; text: string; finalUrl: string }> {
  const { res, body, finalUrl } = await getFollowing(url, "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.5", 3_000_000, 10_000);
  return { ok: res.ok, status: res.status, text: body.toString("utf8"), finalUrl };
}

/** Downloads a picture and returns it inline as a data URL if it is small; otherwise returns its https address. */
export async function safeGetImage(raw: string | undefined, inlineMax = 700_000): Promise<string | undefined> {
  if (!raw) return undefined;
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:") return undefined;
    const { res, body } = await getFollowing(u.toString(), "image/*", 3_000_000, 8_000);
    const type = res.headers.get("content-type")?.split(";")[0]?.trim() ?? "";
    if (!res.ok || !/^image\/(jpeg|png|webp|gif)$/.test(type)) return undefined;
    return body.length <= inlineMax ? `data:${type};base64,${body.toString("base64")}` : u.toString();
  } catch {
    return undefined;
  }
}
