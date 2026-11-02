import { NextResponse } from "next/server";
import { runLinkCheck } from "@/lib/linkcheck";

// Call daily from a scheduler (Render cron job or cron-job.org): GET /api/cron/link-check with "Authorization: Bearer $CRON_SECRET".
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json({ checked: await runLinkCheck() });
}
