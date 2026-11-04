import type { MetadataRoute } from "next";
import { all } from "@/lib/db";
import { demoProfiles } from "@/lib/demo";
import { SITE_URL } from "@/lib/site";
import { posts } from "@/content/blog";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const handles = new Set(demoProfiles.map((d) => d.handle));
  try {
    const rows = await all<{ handle: string }>("SELECT handle FROM pages");
    rows.forEach((r) => handles.add(r.handle));
  } catch {
    // Database unavailable: list the static and demo pages only.
  }
  return [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/blog`, changeFrequency: "weekly", priority: 0.8 },
    ...posts.map((p) => ({ url: `${SITE_URL}/blog/${p.slug}`, lastModified: p.updated ?? p.date, changeFrequency: "monthly" as const, priority: 0.7 })),
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/refund`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/cookies`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/contact`, changeFrequency: "yearly", priority: 0.3 },
    ...[...handles].map((h) => ({ url: `${SITE_URL}/${h}`, changeFrequency: "weekly" as const, priority: 0.6 })),
  ];
}
