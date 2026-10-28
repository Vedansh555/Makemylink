import type { MetadataRoute } from "next";
import { getDb } from "@/lib/db";
import { demoProfiles } from "@/lib/demo";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const handles = new Set(demoProfiles.map((d) => d.handle));
  try {
    const rows = getDb().prepare("SELECT handle FROM pages").all() as { handle: string }[];
    rows.forEach((r) => handles.add(r.handle));
  } catch {
    // Database unavailable: list the static and demo pages only.
  }
  return [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.3 },
    ...[...handles].map((h) => ({ url: `${SITE_URL}/${h}`, changeFrequency: "weekly" as const, priority: 0.6 })),
  ];
}
