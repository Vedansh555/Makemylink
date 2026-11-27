import { one } from "./db";
import { rescheduleOk } from "./bookingMail";

/**
 * The upcoming booking that a signed "change the time" link points to, or null. A buyer with this link may still see
 * that one session's page and free times after the creator's Pro has ended, because the session was already sold.
 */
export async function bookingBeingMoved(id: unknown, key: unknown): Promise<{ pageId: string; linkId: string } | null> {
  if (typeof id !== "string" || typeof key !== "string" || !id || !rescheduleOk(id, key)) return null;
  const row = await one<{ page_id: string; link_id: string }>("SELECT page_id, link_id FROM bookings WHERE id = $1 AND status <> 'cancelled' AND slot_start > $2", [id, Date.now()]);
  return row ? { pageId: row.page_id, linkId: row.link_id } : null;
}
