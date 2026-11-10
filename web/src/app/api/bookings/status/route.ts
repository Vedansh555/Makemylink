import { NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/security";
import { loadBooking } from "@/lib/bookingPaid";
import { pageByHandle } from "@/lib/account";

// GET ?id=: after PayPal sends the buyer back, the booking page asks if the booking is confirmed. The id is an unguessable code the buyer was given.
export async function GET(req: Request) {
  if (rateLimit(`bstat:${clientIp(req)}`, 60, 60 * 60 * 1000)) return NextResponse.json({ status: "unknown" });
  const id = new URL(req.url).searchParams.get("id") ?? "";
  const row = id.length > 20 ? await loadBooking("b.id = $1", [id]) : null;
  if (!row) return NextResponse.json({ status: "unknown" });
  if (row.status !== "confirmed") return NextResponse.json({ status: row.status, slot: row.slot_start });
  const page = await pageByHandle(row.handle);
  const link = page?.profile.links.find((l) => l.id === row.link_id);
  return NextResponse.json({ status: "confirmed", slot: row.slot_start, meetingUrl: link?.booking?.meetingUrl });
}
