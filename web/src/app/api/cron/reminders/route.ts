import { NextResponse } from "next/server";
import { all, run } from "@/lib/db";
import { pageByHandle } from "@/lib/account";
import { sendBookingReminder, sendCreatorReminder } from "@/lib/bookingMail";
import { settleHolds } from "@/lib/bookingPaid";
import { sendProReminders } from "@/lib/proReminder";

// Call every 15 minutes from a scheduler (Render cron job or cron-job.org): GET /api/cron/reminders with "Authorization: Bearer $CRON_SECRET".
// Emails the buyer and the creator a day before and an hour before each confirmed booking,
// and tells creators when their Pro is about to end.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  // First confirm any online payment whose buyer never came back, and free slots nobody paid for.
  const settled = await settleHolds(null, 3 * 60_000).catch(() => ({ confirmed: 0, released: 0 }));
  const now = Date.now();
  const rows = await all<{ id: string; link_id: string; buyer_name: string; buyer_email: string; slot_start: number; reminded_24: boolean; reminded_1: boolean; handle: string; owner_email: string }>(
    `SELECT b.id, b.link_id, b.buyer_name, b.buyer_email, b.slot_start, b.reminded_24, b.reminded_1, p.handle, u.email AS owner_email FROM bookings b JOIN pages p ON p.id = b.page_id JOIN users u ON u.id = p.user_id
     WHERE b.status = 'confirmed' AND b.slot_start > $1 AND b.slot_start < $2 AND (b.reminded_24 = FALSE OR b.reminded_1 = FALSE)`,
    [now, now + 25 * 3_600_000],
  );
  let sent = 0;
  for (const r of rows) {
    const page = await pageByHandle(r.handle);
    const link = page?.profile.links.find((l) => l.id === r.link_id);
    if (!page || !link?.booking) continue;
    const left = r.slot_start - now;
    const b = { id: r.id, buyerName: r.buyer_name, buyerEmail: r.buyer_email, slot: r.slot_start, handle: r.handle, hostName: page.profile.name, link };
    if (!r.reminded_1 && left <= 75 * 60_000) {
      await sendBookingReminder(b, 1);
      await sendCreatorReminder(r.owner_email, b, 1);
      await run("UPDATE bookings SET reminded_1 = TRUE, reminded_24 = TRUE WHERE id = $1", [r.id]);
      sent++;
    } else if (!r.reminded_24 && left <= 24 * 3_600_000 && left > 3 * 3_600_000) {
      await sendBookingReminder(b, 24);
      await sendCreatorReminder(r.owner_email, b, 24);
      await run("UPDATE bookings SET reminded_24 = TRUE WHERE id = $1", [r.id]);
      sent++;
    }
  }
  const pro = await sendProReminders().catch((e) => {
    console.error("pro reminder error", e);
    return 0;
  });
  return NextResponse.json({ sent, pro, ...settled });
}
