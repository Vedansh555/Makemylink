import { one, transaction } from "./db";
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
  /** The owner confirmed their email address. */
  emailVerified: boolean;
  /** Set when Showz checked the owner's work or college email, e.g. "iitr.ac.in". */
  verifiedLabel: string | null;
}

/** A page by handle together with the owner's plan, or null when the handle is unclaimed or the page was taken down by an admin. */
export async function pageByHandle(handle: string): Promise<PageRow | null> {
  const row = await one<{ id: string; user_id: string; handle: string; profile_json: string; updated_at: number; email_verified: boolean; verified_label: string | null }>(
    "SELECT p.id, p.user_id, p.handle, p.profile_json, p.updated_at, u.email_verified, u.verified_label FROM pages p JOIN users u ON u.id = p.user_id WHERE p.handle = $1 AND p.suspended = FALSE",
    [handle.toLowerCase()],
  );
  if (!row) return null;
  try {
    return { id: row.id, user_id: row.user_id, handle: row.handle, profile: JSON.parse(row.profile_json) as Profile, plan: await planForUser(row.user_id), updatedAt: row.updated_at, emailVerified: !!row.email_verified, verifiedLabel: row.verified_label };
  } catch {
    return null;
  }
}

/** A page is worth showing to search engines once it has a name and at least one link or product. */
export function hasContent(profileJson: string): boolean {
  try {
    const p = JSON.parse(profileJson) as Profile;
    return !!p.name?.trim() && ((p.links?.length ?? 0) > 0 || (p.looks?.length ?? 0) > 0);
  } catch {
    return false;
  }
}

/** One of the user's pages: the one asked for, or their first (oldest) page. */
export async function pageForUser(userId: string, pageId?: string | null) {
  const row = await one<{ id: string; handle: string; profile_json: string; updated_at: number }>(
    pageId
      ? "SELECT id, handle, profile_json, updated_at FROM pages WHERE user_id = $1 AND id = $2"
      : "SELECT id, handle, profile_json, updated_at FROM pages WHERE user_id = $1 ORDER BY created_at ASC LIMIT 1",
    pageId ? [userId, pageId] : [userId],
  );
  return row ?? null;
}

export const SITE_NAME = "Showz";

/** Removes a user and everything of theirs. Payment records stay, without the user id, because the law may require them. */
export async function deleteAccount(uid: string) {
  await transaction(async (tx) => {
    const pages = await tx.query("SELECT id FROM pages WHERE user_id = $1", [uid]);
    for (const p of pages as { id: string }[]) {
      for (const t of ["subscribers", "bookings", "events", "link_health", "credits", "buyer_reviews"]) await tx.query(`DELETE FROM ${t} WHERE page_id = $1`, [p.id]);
    }
    await tx.query("DELETE FROM pages WHERE user_id = $1", [uid]);
    await tx.query("DELETE FROM password_resets WHERE user_id = $1", [uid]);
    await tx.query("DELETE FROM creator_gateways WHERE user_id = $1", [uid]);
    await tx.query("UPDATE payments SET user_id = NULL WHERE user_id = $1", [uid]);
    await tx.query("DELETE FROM users WHERE id = $1", [uid]);
  });
}
