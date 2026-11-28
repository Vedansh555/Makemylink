import crypto from "crypto";
import { all, one, run } from "./db";
import { esc, sendMail } from "./mail";
import { SITE_URL } from "./site";
import { pageByHandle } from "./account";

// Things that happen after a booking is confirmed, whichever way it was confirmed (paid online, payment link, or by the creator):
// a package gives the buyer credits for the rest of their sessions, and a gift tells the giver it worked.

const wrap = (b: string) => `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto;line-height:1.55;color:#111">${b}<p style="color:#888;font-size:12px;margin-top:24px">Booked with Showz</p></div>`;
const btn = (href: string, label: string) => `<a href="${href}" style="background:#111;color:#fff;padding:11px 18px;border-radius:10px;text-decoration:none;display:inline-block;margin:4px 0">${label}</a>`;

interface Done {
  id: string;
  page_id: string;
  link_id: string;
  buyer_name: string;
  buyer_email: string;
  pack_count: number | null;
  gift_from_name: string | null;
  gift_from_email: string | null;
  gift_noted: boolean;
  handle: string;
}

const newCode = () => Array.from(crypto.randomBytes(8), (b) => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[b % 32]).join("");

export async function afterConfirmed(bookingId: string) {
  const r = await one<Done>(
    "SELECT b.id, b.page_id, b.link_id, b.buyer_name, b.buyer_email, b.pack_count, b.gift_from_name, b.gift_from_email, b.gift_noted, p.handle FROM bookings b JOIN pages p ON p.id = b.page_id WHERE b.id = $1 AND b.status = 'confirmed'",
    [bookingId],
  );
  if (!r) return;
  const page = await pageByHandle(r.handle);
  const link = page?.profile.links.find((l) => l.id === r.link_id);
  const title = link?.title ?? "your sessions";
  const host = page?.profile.name ?? r.handle;

  // Package: the first session is this booking; the rest become a code that books them without paying again.
  if (r.pack_count && r.pack_count > 1) {
    const code = newCode();
    const made = await one("INSERT INTO credits (code, booking_id, page_id, link_id, remaining, email, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (booking_id) DO NOTHING RETURNING code", [code, r.id, r.page_id, r.link_id, r.pack_count - 1, (r.gift_from_email ?? r.buyer_email).toLowerCase(), Date.now()]);
    if (made) {
      const url = `${SITE_URL}/${r.handle}/${r.link_id}?code=${code}`;
      await sendMail(r.buyer_email, `Your ${r.pack_count - 1} remaining sessions with ${host}`, wrap(`<h2 style="margin:0 0 8px">${r.pack_count - 1} more sessions are ready</h2><p>Your package for <b>${esc(title)}</b> with ${esc(host)} includes ${r.pack_count} sessions. The first one is booked. Book the rest whenever you like, with no payment:</p><p>${btn(url, "Book my next session")}</p><p style="font-size:13px;color:#555">Your code: <b>${code}</b>. Keep this email.</p>`));
    }
  }

  // Gift: the person who paid gets a note once.
  if (r.gift_from_email && !r.gift_noted) {
    const claimed = await one("UPDATE bookings SET gift_noted = TRUE WHERE id = $1 AND gift_noted = FALSE RETURNING id", [r.id]);
    if (claimed) await sendMail(r.gift_from_email, `Your gift to ${r.buyer_name} is booked`, wrap(`<h2 style="margin:0 0 8px">Gift sent</h2><p>Hi ${esc(r.gift_from_name ?? "")}, your gift of <b>${esc(title)}</b> with ${esc(host)} is confirmed. ${esc(r.buyer_name)} has been emailed the time, meeting link and calendar file.</p>`));
  }
}

/** A package code that still has sessions for this booking card, or null. */
export async function creditFor(code: string, pageId: string, linkId: string) {
  if (!/^[A-Z2-9]{8}$/.test(code)) return null;
  return one<{ code: string; remaining: number; email: string }>("SELECT code, remaining, email FROM credits WHERE code = $1 AND page_id = $2 AND link_id = $3 AND remaining > 0", [code, pageId, linkId]);
}

/** Uses one session from a code. False if none were left (checked and taken in one step). */
export async function spendCredit(code: string): Promise<boolean> {
  return !!(await one("UPDATE credits SET remaining = remaining - 1 WHERE code = $1 AND remaining > 0 RETURNING code", [code]));
}

/** Gives the session back if the booking could not be made after all. */
export const returnCredit = (code: string) => run("UPDATE credits SET remaining = remaining + 1 WHERE code = $1", [code]);

// ---------- reviews from buyers ----------

export interface BuyerReview {
  id: string;
  booking_id: string;
  name: string;
  role: string | null;
  quote: string;
  rating: number;
  status: "pending" | "approved" | "hidden";
  created_at: number;
}

export const reviewsForUser = (userId: string) =>
  all<BuyerReview>(
    "SELECT r.id, r.booking_id, r.name, r.role, r.quote, r.rating, r.status, r.created_at FROM buyer_reviews r JOIN pages p ON p.id = r.page_id WHERE p.user_id = $1 ORDER BY r.created_at DESC LIMIT 50",
    [userId],
  );
