import { NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/security";
import { paypalCapture, paypalCredsForUser } from "@/lib/gateway";
import { confirmPaidBooking, loadBooking } from "@/lib/bookingPaid";
import { SITE_URL } from "@/lib/site";
import { one, run } from "@/lib/db";
import { esc, sendMail } from "@/lib/mail";

// PayPal sends the buyer back here after they approve ("token" is the PayPal order id). We take the payment on the
// creator's own PayPal account, check it matches the booking, confirm it, and send the buyer back to the booking page.
export async function GET(req: Request) {
  const u = new URL(req.url);
  const token = u.searchParams.get("token") ?? "";
  const bid = u.searchParams.get("bid") ?? "";
  if (rateLimit(`ppret:${clientIp(req)}`, 30, 60 * 60 * 1000)) return NextResponse.redirect(`${SITE_URL}/`);

  const row = bid && token ? await loadBooking("b.id = $1 AND b.provider = 'paypal'", [bid]) : null;
  if (!row || row.provider_ref !== token) return NextResponse.redirect(`${SITE_URL}/`);
  const back = (q: string) => NextResponse.redirect(`${SITE_URL}/${row.handle}/${row.link_id}?${q}`);

  if (row.status !== "confirmed") {
    const creds = await paypalCredsForUser(row.user_id);
    const cap = creds ? await paypalCapture(creds, token) : null;
    if (!cap || cap.bookingId !== row.id || cap.currency !== "USD" || Math.round(cap.value * 100) !== row.amount * 100) return back("pay=failed");
    if (cap.pending) {
      // PayPal is still reviewing the money: keep the time held and let the creator confirm once it arrives.
      await run("UPDATE bookings SET provider = 'paypal_pending' WHERE id = $1 AND status <> 'confirmed'", [row.id]);
      const owner = await one<{ email: string }>("SELECT email FROM users WHERE id = $1", [row.user_id]);
      if (owner) await sendMail(owner.email, `PayPal payment pending: ${esc(row.buyer_name)}`, `<p>${esc(row.buyer_name)} (${esc(row.buyer_email)}) paid, but PayPal marked it <b>pending</b>. When it shows as completed in your PayPal, press <b>Mark paid</b> in your dashboard.</p>`);
      return back("pay=pending");
    }
  }
  const done = await confirmPaidBooking(row);
  return back(done.ok ? `paid=${row.id}` : "pay=failed");
}
