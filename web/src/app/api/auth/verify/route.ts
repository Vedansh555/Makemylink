import { NextResponse } from "next/server";
import { run } from "@/lib/db";
import { consumeToken } from "@/lib/tokens";
import { SITE_URL } from "@/lib/site";

// GET ?token= — the link in the verification email.
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  const userId = await consumeToken(token, "verify");
  if (userId) await run("UPDATE users SET email_verified = TRUE WHERE id = $1", [userId]);
  return NextResponse.redirect(`${SITE_URL}/dashboard?${userId ? "verified=1" : "verify=expired"}`);
}
