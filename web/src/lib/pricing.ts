import { themeList } from "./themes";
import { FREE_LIMITS, FREE_THEME_IDS } from "./plans";

export type Region = "IN" | "GLOBAL";
export type Billing = "monthly" | "yearly";

export interface Plan {
  id: "free" | "pro";
  name: string;
  tagline: string;
  price: Record<Region, Record<Billing, number>>;
  features: string[];
  highlight?: boolean;
}

export const plans: Plan[] = [
  {
    id: "free",
    name: "Free",
    tagline: "A real page, free forever.",
    price: { GLOBAL: { monthly: 0, yearly: 0 }, IN: { monthly: 0, yearly: 0 } },
    features: [
      `${FREE_THEME_IDS.length} designer themes`,
      `Up to ${FREE_LIMITS.links} links and ${FREE_LIMITS.looks} products`,
      `Collect up to ${FREE_LIMITS.subscribers} emails`,
      `${FREE_LIMITS.analyticsDays}-day visits and clicks`,
      "QR code for your page",
      "Showz badge on your page",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "For people who earn from their page.",
    // Keep in step with PRO_PRICE in payments.ts
    price: { GLOBAL: { monthly: 8, yearly: 79 }, IN: { monthly: 299, yearly: 2999 } },
    features: [
      `All ${themeList.length} themes, including 3D chrome`,
      "Paid 1:1 bookings, 0% commission",
      "Bento grid: half, full and tall cards",
      "Unlimited links and products",
      "Unlimited emails, with CSV export",
      "30-day analytics by link and country",
      "Schedule links and drops",
      "Daily broken-link check with email alerts",
      "Media kit, custom colors and fonts",
      "Remove the Showz badge",
    ],
    highlight: true,
  },
];

/** Region for pricing: the visitor's country (cookie from middleware), else a guess from the browser. */
export function detectRegion(): Region {
  try {
    // Set by middleware.ts from the visitor's country (Cloudflare or Vercel header). Most reliable, so it wins.
    const m = /(?:^|; )mml_region=(IN|GLOBAL)/.exec(document.cookie);
    if (m) return m[1] as Region;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz === "Asia/Kolkata" || tz === "Asia/Calcutta") return "IN";
    if (navigator.language?.toLowerCase().endsWith("-in")) return "IN";
  } catch {}
  return "GLOBAL";
}

export function formatPrice(amount: number, region: Region) {
  return region === "IN" ? `₹${amount.toLocaleString("en-IN")}` : `$${amount}`;
}
