import { phishingListSize } from "./safebrowsing";

/** Which outside services are switched on. Only yes/no and plain words: never a key or its value. Shown to admins. */
export interface SetupItem {
  label: string;
  state: "ok" | "warn" | "off";
  note: string;
}

export function setupStatus(): SetupItem[] {
  const env = process.env;
  const has = (...k: string[]) => k.every((x) => !!env[x]);
  const item = (label: string, on: boolean, yes: string, no: string, warn?: string): SetupItem => (warn && on ? { label, state: "warn", note: warn } : { label, state: on ? "ok" : "off", note: on ? yes : no });
  const rzpTest = !!env.RAZORPAY_KEY_ID?.startsWith("rzp_test_");
  const site = env.NEXT_PUBLIC_SITE_URL ?? "";
  return [
    item("Site address", !!site, site, "NEXT_PUBLIC_SITE_URL is not set", site && !/showz\.me/.test(site) ? `Still ${site}` : undefined),
    item("Email sending", has("RESEND_API_KEY"), "On", "Off: no emails go out. Add RESEND_API_KEY and MAIL_FROM", env.RESEND_API_KEY && !env.MAIL_FROM ? "Add MAIL_FROM" : undefined),
    item("Reminder job", has("CRON_SECRET"), "Secret set. Make sure a job calls /api/cron/reminders every 15 minutes", "Add CRON_SECRET and a 15-minute job"),
    item("Pro payments in India", has("RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"), "Razorpay live", "Razorpay keys missing", rzpTest ? "Test keys: no real money" : undefined),
    item("Razorpay webhook", has("RAZORPAY_WEBHOOK_SECRET"), "Secret set", "Add RAZORPAY_WEBHOOK_SECRET"),
    item("Pro payments abroad", has("PAYPAL_CLIENT_ID", "PAYPAL_CLIENT_SECRET"), "PayPal live", "PayPal keys missing", env.PAYPAL_ENV === "sandbox" ? "Sandbox: no real money" : undefined),
    item("PayPal webhook", has("PAYPAL_WEBHOOK_ID"), "ID set", "Add PAYPAL_WEBHOOK_ID"),
    item("Creator key lock", has("PAYOUT_KEY_SECRET"), "Own secret set", "Using the login secret. Changing it later disconnects creators' payment keys"),
    item("Scam link check", true, phishingListSize() ? `On: ${phishingListSize().toLocaleString("en-IN")} known phishing sites loaded` : "On: free open-source list, loads on the first publish. No key needed", ""),
    item("Support email", has("NEXT_PUBLIC_SUPPORT_EMAIL"), env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "", "Showing the default Gmail address"),
    item("Image storage", has("R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET", "R2_PUBLIC_URL"), "On", "Off: photos are saved inside pages"),
    item("Automatic custom domains", has("RENDER_API_KEY", "RENDER_SERVICE_ID"), "On", "Off: add each creator's domain in Render by hand"),
  ];
}
