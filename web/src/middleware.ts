import { NextResponse, type NextRequest } from "next/server";

const OWN_HOST = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://makemylink75.vercel.app").host;
const isOwn = (h: string) => h === OWN_HOST || h.startsWith("localhost") || h.startsWith("127.0.0.1") || h.endsWith(".onrender.com") || h.endsWith(".vercel.app");

// hostname -> handle, remembered briefly so a visit does not need a lookup every time
const domainCache = new Map<string, { handle: string | null; until: number }>();

async function handleForHost(host: string, origin: string): Promise<string | null> {
  const hit = domainCache.get(host);
  if (hit && hit.until > Date.now()) return hit.handle;
  let handle: string | null = null;
  try {
    const r = await fetch(`${origin}/api/domain/resolve?host=${encodeURIComponent(host)}`);
    handle = r.ok ? ((await r.json()).handle ?? null) : null;
  } catch {
    /* treat as unknown */
  }
  domainCache.set(host, { handle, until: Date.now() + 60_000 });
  return handle;
}

/**
 * 1. A creator's own domain (sarah.com) shows their page at its root.
 * 2. Remembers which pricing region a visitor belongs to, from the country the host detects (Cloudflare or Vercel).
 *    India sees rupee prices; everyone else sees dollars. Used by lib/pricing.ts.
 */
export async function middleware(req: NextRequest) {
  const host = (req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "").toLowerCase();
  if (host && !isOwn(host) && req.nextUrl.pathname === "/") {
    const handle = await handleForHost(host.replace(/^www\./, ""), req.nextUrl.origin);
    if (handle) return NextResponse.rewrite(new URL(`/${handle}`, req.url));
  }

  const country = req.headers.get("cf-ipcountry") ?? req.headers.get("x-vercel-ip-country");
  const res = NextResponse.next();
  if (country) {
    const region = country === "IN" ? "IN" : "GLOBAL";
    if (req.cookies.get("mml_region")?.value !== region) {
      res.cookies.set("mml_region", region, { path: "/", maxAge: 60 * 60 * 24 * 30, sameSite: "lax" });
    }
  }
  return res;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
