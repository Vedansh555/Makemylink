import { NextResponse } from "next/server";
import { one } from "@/lib/db";

// For uptime monitors (UptimeRobot, Better Stack): 200 when the site and database both answer.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await one("SELECT 1");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
