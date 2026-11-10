import { one, run } from "./db";
import { pageByHandle } from "./account";
import { esc, sendMail } from "./mail";

export interface PaidBooking {
  id: string;
  page_id: string;
  link_id: string;
  buyer_name: string;
  buyer_email: string;
  slot_start: number;
  amount: number;
  currency: string;
  status: string;
  provider: string | null;
  provider_ref: string | null;
  handle: string;
  user_id: string;
}

export const loadBooking = (where: string, params: unknown[]) =>
  one<PaidBooking>(
    `SELECT b.id, b.page_id, b.link_id, b.buyer_name, b.buyer_email, b.slot_start, b.amount, b.currency, b.status, b.provider, b.provider_ref, p.handle, p.user_id FROM bookings b JOIN pages p ON p.id = b.page_id WHERE ${where}`,
    params,
  );

/**
 * Marks an online-paid booking confirmed and sends the emails. Call it only after the payment itself has been checked.
 * If the time was released and someone else took it while the buyer was paying, the creator is told instead.
 */
export async function confirmPaidBooking(row: PaidBooking): Promise<{ ok: true; meetingUrl: string } | { ok: false; error: string; status: number }> {
  const page = await pageByHandle(row.handle);
  const link = page?.profile.links.find((l) => l.id === row.link_id);
  if (!page || !link?.booking) return { ok: false, error: "Booking not found", status: 404 };
  const cfg = link.booking;
  if (row.status === "confirmed") return { ok: true, meetingUrl: cfg.meetingUrl };

  const when = new Intl.DateTimeFormat("en-IN", { dateStyle: "full", timeStyle: "short", timeZone: cfg.timeZone }).format(new Date(row.slot_start));
  const owner = await one<{ email: string }>("SELECT email FROM users WHERE id = $1", [row.user_id]);

  if (row.status === "cancelled") {
    const clash = await one("SELECT id FROM bookings WHERE page_id = $1 AND link_id = $2 AND slot_start = $3 AND status <> 'cancelled' AND id <> $4", [row.page_id, row.link_id, row.slot_start, row.id]);
    if (clash) {
      if (owner) await sendMail(owner.email, `Paid, but the time was taken: ${esc(row.buyer_name)}`, `<p>${esc(row.buyer_name)} (${esc(row.buyer_email)}) paid for <b>${esc(link.title)}</b> on ${esc(when)}, but someone else booked that time while they were paying. Please contact them to pick another time or refund the payment in your ${row.provider === "paypal" ? "PayPal" : "Razorpay"} account.</p>`);
      return { ok: false, error: "You paid, but that time was just taken. The creator has been told and will contact you.", status: 409 };
    }
  }

  await run("UPDATE bookings SET status = 'confirmed' WHERE id = $1", [row.id]);
  await sendMail(row.buyer_email, `Confirmed: ${link.title}`, `<p>Payment received. You are booked for <b>${esc(link.title)}</b> on ${esc(when)}.</p><p>Join here: <a href="${esc(cfg.meetingUrl)}">${esc(cfg.meetingUrl)}</a></p>`);
  if (owner) await sendMail(owner.email, `Paid booking: ${esc(row.buyer_name)}`, `<p>${esc(row.buyer_name)} (${esc(row.buyer_email)}) paid and booked <b>${esc(link.title)}</b> on ${esc(when)}. It is confirmed automatically.</p>`);
  return { ok: true, meetingUrl: cfg.meetingUrl };
}
