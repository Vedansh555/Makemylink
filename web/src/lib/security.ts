import { NextResponse } from "next/server";
import type { Profile } from "./types";

/** Handles that would collide with real routes or look official. */
export const RESERVED_HANDLES = new Set([
  "api", "app", "admin", "login", "logout", "signup", "create", "preview", "dashboard", "settings",
  "pricing", "about", "terms", "privacy", "support", "help", "billing", "static", "assets", "_next",
  "favicon.ico", "robots.txt", "sitemap.xml", "makemylink", "www", "mail", "root",
]);

// ---------- rate limiting ----------
// In-memory, per server instance. It slows brute force and signup spam; for a hard guarantee across
// many serverless instances, back it with Redis/Upstash (see PRODUCTION.md).
const buckets = new Map<string, { count: number; reset: number }>();

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "unknown").trim();
}

/** Returns a 429 response when `key` exceeded `limit` hits in `windowMs`, otherwise null. */
export function rateLimit(key: string, limit: number, windowMs: number): NextResponse | null {
  const now = Date.now();
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (v.reset < now) buckets.delete(k);
  }
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return null;
  }
  b.count += 1;
  if (b.count > limit) {
    const retry = Math.ceil((b.reset - now) / 1000);
    return NextResponse.json(
      { error: "Too many attempts. Please wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(retry) } },
    );
  }
  return null;
}

// ---------- CSRF ----------
/** Blocks cross-site form/fetch posts: a browser always sends Origin on cross-origin POST/PUT. */
export function sameOriginOnly(req: Request): NextResponse | null {
  const origin = req.headers.get("origin");
  if (!origin) return null; // non-browser clients (curl, server-to-server) carry no session cookie anyway
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    if (new URL(origin).host === host) return null;
  } catch {
    /* fall through */
  }
  return NextResponse.json({ error: "Cross-site request blocked" }, { status: 403 });
}

// ---------- input sanitising ----------
/** Only web links, email and phone. Blocks javascript:, data:, vbscript: and friends. */
export function safeHref(input?: string): string {
  if (!input) return "#";
  const t = input.trim();
  if (!t) return "#";
  const scheme = /^([a-zA-Z][a-zA-Z0-9+.-]*):/.exec(t);
  if (scheme) return ["http", "https", "mailto", "tel"].includes(scheme[1]!.toLowerCase()) ? t : "#";
  return `https://${t}`;
}

/** Raster data URLs and https images only (no SVG, which can carry script). */
const safeImg = (v: unknown) =>
  typeof v === "string" && (/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(v) || /^https:\/\//i.test(v)) && v.length <= 3_000_000 ? v : undefined;

const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");

/** Cap sizes and neutralise dangerous URLs before anything is stored. Throws on a malformed profile. */
export function sanitizeProfile(raw: unknown, handle: string): Profile {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("Profile must be an object");
  const p = raw as Profile;
  const out: Profile = { ...p, handle };
  out.name = str(p.name, 80);
  out.bio = str(p.bio, 400);
  if (p.location !== undefined) out.location = str(p.location, 80);
  out.avatar = safeImg(p.avatar);
  out.coverImage = safeImg(p.coverImage);
  out.links = (Array.isArray(p.links) ? p.links : []).slice(0, 100).map((l) => ({
    ...l,
    id: str(l.id, 64),
    title: str(l.title, 120),
    url: safeHref(str(l.url, 2048)),
    folder: l.folder ? str(l.folder, 60) : undefined,
  }));
  out.looks = (Array.isArray(p.looks) ? p.looks : []).slice(0, 100).map((l) => ({
    ...l,
    id: str(l.id, 64),
    title: str(l.title, 120),
    price: str(l.price, 30),
    url: safeHref(str(l.url, 2048)),
    image: safeImg(l.image),
  }));
  return out;
}
