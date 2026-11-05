import { familyOrder, themeList } from "./themes";
import type { Profile } from "./types";

export type PlanId = "free" | "pro";

/** What the Free plan allows. Pro has no limits. */
export const FREE_LIMITS = {
  links: 8,
  looks: 6,
  subscribers: 100,
  analyticsDays: 7,
};

/** How many pages one account can have. */
export const PAGE_LIMITS = { free: 1, pro: 5 } as const;

/** The first theme of each of the first ten families stays free, so Free still looks designed. */
export const FREE_THEME_IDS: string[] = (() => {
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const fam of familyOrder) {
    const t = themeList.find((x) => x.family === fam);
    if (t && !seen.has(fam)) {
      seen.add(fam);
      ids.push(t.id);
    }
    if (ids.length >= 10) break;
  }
  return ids;
})();

export const isFreeTheme = (id: string) => FREE_THEME_IDS.includes(id);

/** Apply plan limits to a profile. Used when saving and when rendering a public page. */
export function applyPlan(profile: Profile, plan: PlanId): Profile {
  if (plan === "pro") return profile;
  return {
    ...profile,
    theme: isFreeTheme(profile.theme) ? profile.theme : FREE_THEME_IDS[0]!,
    accentOverride: undefined,
    fontOverride: undefined,
    hideBadge: false,
    showMediaKit: false,
    links: profile.links
      .filter((l) => l.kind !== "booking")
      .map((l) => ({ ...l, size: undefined }))
      .slice(0, FREE_LIMITS.links),
    looks: profile.looks.slice(0, FREE_LIMITS.looks),
  };
}

/** Removes private booking fields (meeting link, payment details stay server-side) before a profile goes to a visitor. */
export function publicProfile(profile: Profile): Profile {
  return {
    ...profile,
    links: profile.links.map((l) => (l.booking ? { ...l, booking: { ...l.booking, meetingUrl: "" } } : l)),
  };
}

/** Is this link visible right now, given its optional start and end times? */
export function linkIsLive(l: { startsAt?: number; expiresAt?: number }, now = Date.now()): boolean {
  if (l.startsAt && now < l.startsAt) return false;
  if (l.expiresAt && now > l.expiresAt) return false;
  return true;
}
