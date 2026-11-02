import { NextResponse, type NextRequest } from "next/server";

/**
 * Remembers which pricing region a visitor belongs to, from the country Vercel detects.
 * India sees rupee prices; everyone else sees dollars. Used by lib/pricing.ts.
 */
export function middleware(req: NextRequest) {
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
