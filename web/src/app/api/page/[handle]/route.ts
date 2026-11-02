import { NextResponse } from "next/server";
import { pageByHandle } from "@/lib/account";
import { getDemoProfile } from "@/lib/demo";
import { applyPlan, publicProfile } from "@/lib/plans";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ handle: string }> }
) {
  const { handle } = await params;
  if (!handle) {
    return NextResponse.json({ error: "Handle is required" }, { status: 400 });
  }

  const page = await pageByHandle(handle);
  if (page) {
    return NextResponse.json({ profile: publicProfile(applyPlan(page.profile, page.plan)), plan: page.plan, source: "db" });
  }

  const demo = getDemoProfile(handle.toLowerCase());
  if (demo) {
    return NextResponse.json({ profile: demo, plan: "pro", source: "demo" });
  }

  return NextResponse.json({ error: "Page not found" }, { status: 404 });
}
