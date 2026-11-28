import crypto from "crypto";
import { one, run } from "./db";
import { esc, sendMail } from "./mail";
import { pageByHandle } from "./account";
import { sendBookingConfirmed } from "./bookingMail";
import { SITE_URL } from "./site";
import { afterConfirmed } from "./sessionExtras";

// One-tap actions from emails, so a creator can confirm or cancel a booking without logging in,
// and a buyer can say "I paid" when an automatic match didn't happen. Each link is signed for one booking and one action.

export type Act = "confirm" | "cancel" | "claim" | "review";

export function actionKey(id: string, act: Act): string {
  const secret = process.env.SESSION_SECRET || "dev_makemylink_session_secret_default_key_32_bytes_min";
  return crypto.createHmac("sha256", `booking-action:${secret}`).update(`${act}:${id}`).digest("base64url").slice(0, 32);
}

export function actionOk(id: string, act: Act, key: string): boolean {
  const a = Buffer.from(actionKey(id, act));
  const b = Buffer.from(String(key));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export const actionUrl = (id: string, act: Act) => `${SITE_URL}/api/bookings/quick?id=${encodeURIComponent(id)}&a=${act}&k=${actionKey(id, act)}`;

interface Row {
  id: string;
  buyer_name: string;
  buyer_email: string;
  slot_start: number;
  link_id: string;
  handle: string;
  status: string;
  amount: number;
  pay_paise: number | null;
  owner_email: string;
}

export const bookingRow = (id: string) =>
  one<Row>(
    `SELECT b.id, b.buyer_name, b.buyer_email, b.slot_start, b.link_id, b.status, b.amount, b.pay_paise, p.handle, u.email AS owner_email
     FROM bookings b JOIN pages p ON p.id = b.page_id JOIN users u ON u.id = p.user_id WHERE b.id = $1`,
    [id],
  );

/** Confirms or cancels a booking and tells the buyer. Shared by the dashboard and the email buttons. */
export async function setBookingStatus(row: Row, status: "confirmed" | "cancelled") {
  if (row.status === status) return;
  await run("UPDATE bookings SET status = $1 WHERE id = $2", [status, row.id]);
  const page = await pageByHandle(row.handle);
  const link = page?.profile.links.find((l) => l.id === row.link_id);
  if (!page || !link?.booking) return;
  if (status === "confirmed") {
    await sendBookingConfirmed({ id: row.id, buyerName: row.buyer_name, buyerEmail: row.buyer_email, slot: row.slot_start, handle: row.handle, hostName: page.profile.name, link }, "paid");
    await afterConfirmed(row.id).catch((e) => console.error("after confirmed", e));
  } else if (row.status === "awaiting_payment") {
    await sendMail(row.buyer_email, `Not confirmed: ${link.title}`, `<p>Hi ${esc(row.buyer_name)}, ${esc(page.profile.name)} could not find your payment for <b>${esc(link.title)}</b>, so the time was released. If you did pay, reply to the receipt from your payment app or contact ${esc(page.profile.name)} directly.</p>`);
  }
}

const when = (ms: number) => new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(ms));
const btn = (href: string, label: string, dark = true) => `<a href="${href}" style="background:${dark ? "#111" : "#fff"};color:${dark ? "#fff" : "#111"};border:1px solid #111;padding:10px 16px;border-radius:10px;text-decoration:none;display:inline-block;margin:4px 6px 4px 0">${label}</a>`;
const wrap = (b: string) => `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto;line-height:1.55;color:#111">${b}<p style="color:#888;font-size:12px;margin-top:24px">Sent by Showz. These buttons work without logging in.</p></div>`;
const rupees = (paise: number) => `₹${(paise / 100).toFixed(2)}`;

/** One booking, with Confirm and Cancel buttons, for the creator. */
export function bookingBlock(r: Row) {
  return `<div style="border:1px solid #e5e5e5;border-radius:12px;padding:12px 14px;margin:10px 0"><b>${esc(r.buyer_name)}</b> (${esc(r.buyer_email)})<br>${esc(when(r.slot_start))} IST · expected ${r.pay_paise ? rupees(r.pay_paise) : `₹${r.amount}`}<br>${btn(actionUrl(r.id, "confirm"), "Money arrived: confirm")}${btn(actionUrl(r.id, "cancel"), "Not paid: cancel", false)}</div>`;
}

/** A payment arrived on the creator's Razorpay but matched no booking for sure: let them pick with one tap. */
export async function emailUnmatched(ownerEmail: string, paise: number, payer: string | null, candidates: Row[]) {
  await sendMail(ownerEmail, `Payment of ${rupees(paise)}: which booking is it?`, wrap(`<h2 style="margin:0 0 8px">A payment needs one tap</h2><p>${rupees(paise)} arrived in your Razorpay${payer ? ` from ${esc(payer)}` : ""}, but we couldn't tell which booking it was for (the buyer may have typed a different amount). Confirm the right one:</p>${candidates.map(bookingBlock).join("")}`));
}

/** A link booking has waited a while with no matched payment. */
export async function emailWaiting(r: Row) {
  await sendMail(r.owner_email, `Did ${r.buyer_name} pay?`, wrap(`<h2 style="margin:0 0 8px">Waiting for payment</h2><p>This booking has no matched payment yet. Check your payment app, then tap one button:</p>${bookingBlock(r)}`));
}

/** The buyer says they paid but nothing matched. */
export async function emailClaim(r: Row) {
  await sendMail(r.owner_email, `${r.buyer_name} says they paid`, wrap(`<h2 style="margin:0 0 8px">Please check this payment</h2><p>${esc(r.buyer_name)} says they paid for their booking, but it didn't match automatically (often a different amount was typed). Check your payment app:</p>${bookingBlock(r)}`));
}
