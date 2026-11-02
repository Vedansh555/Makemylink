import { NextResponse } from "next/server";
import { one } from "@/lib/db";
import { planForUser } from "@/lib/account";

// Used by the middleware: which page lives at this hostname? Only verified domains on active Pro accounts resolve.
export async function GET(req: Request) {
  const host = (new URL(req.url).searchParams.get("host") ?? "").toLowerCase().replace(/^www\./, "");
  const row = await one<{ handle: string; user_id: string }>(
    "SELECT handle, user_id FROM pages WHERE custom_domain_verified = TRUE AND (custom_domain = $1 OR custom_domain = $2)",
    [host, `www.${host}`],
  );
  if (!row || (await planForUser(row.user_id)) !== "pro") return NextResponse.json({ handle: null });
  return NextResponse.json({ handle: row.handle });
}
