import { FREE_THEME_IDS } from "@/lib/plans";
import { themeList } from "@/lib/themes";
import { posts } from "@/content/blog";
import { SITE_URL } from "@/lib/site";

// A plain-text summary for AI assistants and answer engines (the llms.txt convention).
export function GET() {
  const text = `# Showz

> Showz is a link-in-bio page builder for creators, mentors, consultants and fashion and beauty creators. It has ${themeList.length} designer themes, cards in mixed sizes (half, full, tall), a real email list, paid 1:1 bookings with no platform commission, and rupee pricing for India.

## Plans
- Free: ${FREE_THEME_IDS.length} themes, up to 8 links, 6 products, 100 emails, 7-day analytics. Shows a Showz badge.
- Pro: ₹299/month or ₹2,999/year in India; $8/month or $79/year elsewhere. All themes, bookings with 0% commission, card sizes, unlimited links, CSV export of emails, 30-day analytics, scheduled links, daily broken-link check, no badge.
- India pays through Razorpay (UPI, cards, netbanking). Other countries pay through PayPal.

## Key pages
- [Home](${SITE_URL}/)
- [Blog](${SITE_URL}/blog)
- [Privacy](${SITE_URL}/privacy)
- [Terms](${SITE_URL}/terms)

## Guides
${posts.map((p) => `- [${p.title}](${SITE_URL}/blog/${p.slug}): ${p.description}`).join("\n")}
`;
  return new Response(text, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
