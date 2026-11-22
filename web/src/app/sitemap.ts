import type { MetadataRoute } from "next";
import { all } from "@/lib/db";
import { demoProfiles } from "@/lib/demo";
import { SITE_URL } from "@/lib/site";
import { posts } from "@/content/blog";
import { niches } from "@/content/niches";
import { hasContent } from "@/lib/account";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const handles = new Set(demoProfiles.map((d) => d.handle));
  try {
    // Only pages whose owner confirmed their email and that have real content, so spam or empty test pages are never listed.
    const rows = await all<{ handle: string; profile_json: string }>("SELECT p.handle, p.profile_json FROM pages p JOIN users u ON u.id = p.user_id WHERE p.suspended = FALSE AND u.email_verified = TRUE");
    rows.filter((r) => hasContent(r.profile_json)).forEach((r) => handles.add(r.handle));
  } catch {
    // Database unavailable: list the static and demo pages only.
  }
  return [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/blog`, changeFrequency: "weekly", priority: 0.8 },
    ...posts.map((p) => ({ url: `${SITE_URL}/blog/${p.slug}`, lastModified: p.updated ?? p.date, changeFrequency: "monthly" as const, priority: 0.7 })),
    ...niches.map((n) => ({ url: `${SITE_URL}/for/${n.slug}`, changeFrequency: "weekly" as const, priority: 0.8 })),
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/refund`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/cookies`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/contact`, changeFrequency: "yearly", priority: 0.3 },
    ...[...handles].map((h) => ({ url: `${SITE_URL}/${h}`, changeFrequency: "weekly" as const, priority: 0.6 })),
  ];
}
