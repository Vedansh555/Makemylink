import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getDemoProfile } from "@/lib/demo";
import type { Profile } from "@/lib/types";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ handle: string }> }
) {
  const { handle } = await params;
  if (!handle) {
    return NextResponse.json({ error: "Handle is required" }, { status: 400 });
  }

  const cleanHandle = handle.toLowerCase();
  const db = getDb();

  const page = db.prepare("SELECT profile_json FROM pages WHERE handle = ?").get(cleanHandle) as
    | { profile_json: string }
    | undefined;

  if (page) {
    try {
      const profile = JSON.parse(page.profile_json) as Profile;
      return NextResponse.json({ profile, source: "db" });
    } catch {
      return NextResponse.json({ error: "Failed to parse profile" }, { status: 500 });
    }
  }

  // Fall back to demoProfiles
  const demo = getDemoProfile(cleanHandle);
  if (demo) {
    return NextResponse.json({ profile: demo, source: "demo" });
  }

  return NextResponse.json({ error: "Page not found" }, { status: 404 });
}
