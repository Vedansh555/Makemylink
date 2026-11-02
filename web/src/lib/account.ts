import { one } from "./db";
import type { PlanId } from "./plans";
import type { Profile } from "./types";

/** Pro stays active until `plan_renews_at` passes (plus a 2-day grace so a late renewal webhook never locks anyone out). */
export async function planForUser(userId: string): Promise<PlanId> {
  const u = await one<{ plan: string; plan_renews_at: number | null }>("SELECT plan, plan_renews_at FROM users WHERE id = $1", [userId]);
  if (!u || u.plan !== "pro") return "free";
  if (u.plan_renews_at && u.plan_renews_at + 2 * 86_400_000 < Date.now()) return "free";
  return "pro";
}

export interface PageRow {
  id: string;
  user_id: string;
  handle: string;
  profile: Profile;
  plan: PlanId;
  updatedAt: number;
}

/** A page by handle together with the owner's plan, or null when the handle is unclaimed. */
export async function pageByHandle(handle: string): Promise<PageRow | null> {
  const row = await one<{ id: string; user_id: string; handle: string; profile_json: string; updated_at: number }>(
    "SELECT id, user_id, handle, profile_json, updated_at FROM pages WHERE handle = $1",
    [handle.toLowerCase()],
  );
  if (!row) return null;
  try {
    return { id: row.id, user_id: row.user_id, handle: row.handle, profile: JSON.parse(row.profile_json) as Profile, plan: await planForUser(row.user_id), updatedAt: row.updated_at };
  } catch {
    return null;
  }
}

export async function pageForUser(userId: string) {
  const row = await one<{ id: string; handle: string; profile_json: string; updated_at: number }>(
    "SELECT id, handle, profile_json, updated_at FROM pages WHERE user_id = $1",
    [userId],
  );
  return row ?? null;
}

export const SITE_NAME = "Makemylink";
