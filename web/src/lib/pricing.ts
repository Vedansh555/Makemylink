import { themeList } from "./themes";

export type Region = "IN" | "GLOBAL";
export type Billing = "monthly" | "yearly";

export interface Plan {
  id: "starter" | "pro";
  name: string;
  tagline: string;
  price: Record<Region, Record<Billing, number>>;
  features: string[];
  highlight?: boolean;
}

export const plans: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    tagline: "Everything you need to get started.",
    price: { GLOBAL: { monthly: 6, yearly: 48 }, IN: { monthly: 149, yearly: 1199 } },
    features: [
      `All ${themeList.length} themes, including 3D chrome`,
      "Unlimited links",
      "Product grid with affiliate links",
      "Collect emails from visitors",
      "Visits and clicks analytics",
      "Import from Linktree",
      "5% fee on sales (payment fees extra)",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "For people who sell or work with brands.",
    price: { GLOBAL: { monthly: 12, yearly: 96 }, IN: { monthly: 399, yearly: 2999 } },
    features: [
      "Everything in Starter",
      "Sell products and bookings, 0% fee",
      "Media kit for brands",
      "Free custom domain, yours to keep",
      "Remove the Makemylink badge",
      "Help from a real person",
    ],
    highlight: true,
  },
];

/** Best-guess region from the browser. Real billing currency is decided by the payment method at checkout. */
export function detectRegion(): Region {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz === "Asia/Kolkata" || tz === "Asia/Calcutta") return "IN";
    if (navigator.language?.toLowerCase().endsWith("-in")) return "IN";
  } catch {}
  return "GLOBAL";
}

export function formatPrice(amount: number, region: Region) {
  return region === "IN" ? `₹${amount.toLocaleString("en-IN")}` : `$${amount}`;
}
