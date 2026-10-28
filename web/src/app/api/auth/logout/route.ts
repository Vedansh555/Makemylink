import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/session";
import { sameOriginOnly } from "@/lib/security";

export async function POST(req: Request) {
  const blocked = sameOriginOnly(req);
  if (blocked) return blocked;
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
