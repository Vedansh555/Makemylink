/** Helpers for the creator's own payment link (razorpay.me, rzp.io, paypal.me, or any other https page). */

/** Adds https:// if the creator pasted a bare address. Returns "" for an empty box. */
export function normalisePayLink(input: string): string {
  const t = input.trim();
  if (!t) return "";
  if (/^https:\/\//i.test(t)) return t;
  if (/^http:\/\//i.test(t)) return `https://${t.slice(7)}`;
  return /^[a-z][a-z0-9+.-]*:/i.test(t) ? t : `https://${t}`;
}

/** The website the link opens, e.g. "razorpay.me", or null if it is not a usable https address. */
export function payLinkHost(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.hostname.includes(".") ? u.hostname.replace(/^www\./, "") : null;
  } catch {
    return null;
  }
}
