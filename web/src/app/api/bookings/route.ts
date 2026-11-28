import { NextResponse } from "next/server";
import crypto from "crypto";
import { all, one, run } from "@/lib/db";
import { pageByHandle } from "@/lib/account";
import { slotsForDay } from "@/lib/booking";
import { clientIp, rateLimit, sameOriginOnly } from "@/lib/security";
import { esc, sendMail } from "@/lib/mail";
import { getSession } from "@/lib/session";
import { createOrder, credsForUser, paypalCreate, paypalCredsForUser } from "@/lib/gateway";
import { settleHolds } from "@/lib/bookingPaid";
import { payLinkHost } from "@/lib/payLink";
import { SITE_URL } from "@/lib/site";
import { sendBookingConfirmed } from "@/lib/bookingMail";
import { rewardReferral } from "@/lib/referral";
import { bookingBeingMoved } from "@/lib/reschedule";
import { FREE_LIMITS } from "@/lib/plans";
import { exactAmount, hookForUser } from "@/lib/linkWatch";
import { actionKey, actionUrl, bookingRow, setBookingStatus } from "@/lib/bookingActions";
import { afterConfirmed, creditFor, returnCredit, spendCredit } from "@/lib/sessionExtras";


/** Free pages take FREE_LIMITS.bookings bookings per calendar month (UTC); Pro has no limit. */
async function freeBookingsLeft(page: { id: string; plan: string }) {
  if (page.plan === "pro") return Infinity;
  const d = new Date();
  const row = await one<{ n: number }>("SELECT COUNT(*)::int AS n FROM bookings WHERE page_id = $1 AND status <> 'cancelled' AND credit_code IS NULL AND created_at >= $2", [page.id, Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)]);
  return FREE_LIMITS.bookings - (row?.n ?? 0);
}

// `moving` is set only when a buyer is changing the time of a session they already booked.
async function findConfig(handle: string, linkId: string, moving?: { pageId: string; linkId: string } | null) {
  const page = await pageByHandle(handle);
  if (!page) return null;
  const link = page.profile.links.find((l) => l.id === linkId && l.kind === "booking" && l.booking);
  return link?.booking ? { page, link, cfg: link.booking, full: !moving && (await freeBookingsLeft(page)) <= 0 } : null;
}

// GET /api/bookings?handle=&linkId=&date=YYYY-MM-DD — open slots for a day
export async function GET(req: Request) {
  const u = new URL(req.url);
  const moving = await bookingBeingMoved(u.searchParams.get("reschedule"), u.searchParams.get("k"));
  const found = await findConfig(u.searchParams.get("handle") ?? "", u.searchParams.get("linkId") ?? "", moving);
  if (!found) return NextResponse.json({ slots: [] });
  const codeQ = u.searchParams.get("code");
  const credit = codeQ ? await creditFor(codeQ.toUpperCase(), found.page.id, found.link.id) : null;
  if (found.full && !credit) return NextResponse.json({ slots: [], all: [], days: {}, full: true });
  await settleHolds(found.page.id);
  const month = u.searchParams.get("month") ?? "";
  if (/^\d{4}-\d{2}$/.test(month)) {
    // For the calendar: how many times are free and how many exist on each day of the month.
    const rows = await all<{ slot_start: number }>(
      "SELECT slot_start FROM bookings WHERE page_id = $1 AND link_id = $2 AND status <> 'cancelled' AND slot_start > $3 AND slot_start < $4",
      [found.page.id, found.link.id, Date.now() - 86_400_000, Date.now() + 120 * 86_400_000],
    );
    const taken = rows.map((r) => r.slot_start);
    const [y, m] = month.split("-").map(Number) as [number, number];
    const days: Record<string, { free: number; total: number }> = {};
    for (let d = 1; d <= new Date(y, m, 0).getDate(); d++) {
      const k = `${month}-${String(d).padStart(2, "0")}`;
      const total = slotsForDay(found.cfg, k, []).length;
      if (total) days[k] = { free: slotsForDay(found.cfg, k, taken).length, total };
    }
    return NextResponse.json({ days, credit: credit ? { remaining: credit.remaining } : codeQ ? { remaining: 0 } : undefined });
  }
  const date = u.searchParams.get("date") ?? "";
  // Look at a window around the day so a slot taken near midnight (in another zone) still blocks.
  const rows = await all<{ slot_start: number }>(
    "SELECT slot_start FROM bookings WHERE page_id = $1 AND link_id = $2 AND status <> 'cancelled' AND slot_start > $3 AND slot_start < $4",
    [found.page.id, found.link.id, Date.now() - 86_400_000, Date.now() + 90 * 86_400_000],
  );
  return NextResponse.json({ slots: slotsForDay(found.cfg, date, rows.map((r) => r.slot_start)), all: slotsForDay(found.cfg, date, []), durationMin: found.cfg.durationMin, timeZone: found.cfg.timeZone });
}

// POST /api/bookings {handle, linkId, slot, name, email, note}
export async function POST(req: Request) {
  const blocked = sameOriginOnly(req) ?? rateLimit(`book:${clientIp(req)}`, 10, 60 * 60 * 1000);
  if (blocked) return blocked;
  const b = (await req.json().catch(() => ({}))) as { handle?: string; linkId?: string; slot?: number; name?: string; email?: string; note?: string; consent?: boolean; pack?: boolean; code?: string; gift?: { name?: string; email?: string; message?: string } };
  if (b.consent !== true) return NextResponse.json({ error: "Please tick the box to agree to share your details" }, { status: 400 });
  const email = String(b.email ?? "").toLowerCase().trim();
  const name = String(b.name ?? "").trim().slice(0, 80);
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof b.slot !== "number") {
    return NextResponse.json({ error: "Name, email and a time are required" }, { status: 400 });
  }
  // A gift: the form's name and email are the giver's; the session (and its emails) go to the person receiving it.
  let gift: { name: string; email: string; message: string } | null = null;
  if (b.gift) {
    const gName = String(b.gift.name ?? "").trim().slice(0, 80);
    const gEmail = String(b.gift.email ?? "").toLowerCase().trim();
    if (!gName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(gEmail) || gEmail.length > 254) return NextResponse.json({ error: "Add the name and email of the person receiving the gift" }, { status: 400 });
    gift = { name: gName, email: gEmail, message: String(b.gift.message ?? "").trim().slice(0, 300) };
  }
  const found = await findConfig(b.handle ?? "", b.linkId ?? "");
  if (!found) return NextResponse.json({ error: "This session is not available" }, { status: 404 });
  const { page, link, cfg } = found;
  // A package code books a session that was already paid for.
  const credit = b.code ? await creditFor(String(b.code).toUpperCase().trim(), page.id, link.id) : null;
  if (b.code && !credit) return NextResponse.json({ error: "This package code has no sessions left, or is for a different session." }, { status: 400 });
  if (found.full && !credit) return NextResponse.json({ error: "This calendar is full for this month. Please contact the host directly." }, { status: 403 });
  const pack = !credit && b.pack && cfg.pack ? cfg.pack : null;
  const price = credit ? 0 : pack ? pack.price : cfg.price;
  await settleHolds(page.id);

  // The slot must be one the server would have offered (right day, hour, free).
  const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: cfg.timeZone }).format(new Date(b.slot));
  const taken = await all<{ slot_start: number }>("SELECT slot_start FROM bookings WHERE page_id = $1 AND link_id = $2 AND status <> 'cancelled'", [page.id, link.id]);
  if (!slotsForDay(cfg, ymd, taken.map((t) => t.slot_start)).includes(b.slot)) {
    return NextResponse.json({ error: "That time was just taken. Pick another." }, { status: 409 });
  }

  const id = crypto.randomUUID();
  const free = price === 0;
  if (credit && !(await spendCredit(credit.code))) return NextResponse.json({ error: "This package code has no sessions left." }, { status: 400 });
  const guest = gift ? { name: gift.name, email: gift.email } : { name, email };
  try {
    await run("INSERT INTO bookings (id, page_id, link_id, buyer_name, buyer_email, slot_start, note, amount, currency, status, created_at, consented_at, pack_count, credit_code, gift_from_name, gift_from_email, gift_message) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)", [
      id, page.id, link.id, guest.name, guest.email, b.slot, String(b.note ?? "").slice(0, 500), price, cfg.currency, free ? "confirmed" : "awaiting_payment", Date.now(), Date.now(), pack ? pack.count : null, credit ? credit.code : null, gift ? name : null, gift ? email : null, gift?.message || null,
    ]);
  } catch (e) {
    if (credit) await returnCredit(credit.code);
    throw e;
  }
  await rewardReferral(page.user_id, email).catch(() => {});

  const when = new Intl.DateTimeFormat("en-IN", { dateStyle: "full", timeStyle: "short", timeZone: cfg.timeZone }).format(new Date(b.slot));
  const owner = await one<{ email: string }>("SELECT email FROM users WHERE id = $1", [page.user_id]);
  if (free) {
    await sendBookingConfirmed({ id, buyerName: guest.name, buyerEmail: guest.email, slot: b.slot, handle: page.handle, hostName: page.profile.name, link });
    await afterConfirmed(id).catch(() => {});
  }

  // How the buyer can pay: the creator's own Razorpay or PayPal (confirms by itself), and/or the creator's payment link.
  const pays: ({ kind: "razorpay"; keyId: string; orderId: string; amount: number; bookingId: string } | { kind: "paypal"; url: string } | { kind: "link"; link: string; exact?: number })[] = [];
  if (!free) {
    // If the creator connected their own Razorpay, the buyer can pay on the spot and the booking confirms itself.
    const creds = cfg.currency === "INR" ? await credsForUser(page.user_id) : null;
    if (creds) {
      try {
        const order = await createOrder(creds, price, id, { booking_id: id, page_id: page.id });
        await run("UPDATE bookings SET provider = 'razorpay', provider_ref = $1 WHERE id = $2", [order.id, id]);
        pays.push({ kind: "razorpay", keyId: creds.keyId, orderId: order.id, amount: order.amount, bookingId: id });
      } catch (e) {
        console.error("creator razorpay order", e);
      }
    }
    // Same for a creator's own PayPal and a price in US dollars: the buyer approves on PayPal, comes back, and it confirms itself.
    const pp = cfg.currency === "USD" ? await paypalCredsForUser(page.user_id) : null;
    if (pp) {
      try {
        const order = await paypalCreate(pp, price, id, `${link.title} with ${page.profile.name}`, `${SITE_URL}/api/bookings/paypal-return?bid=${id}`, `${SITE_URL}/${page.handle}/${link.id}?pay=cancelled`, page.profile.name);
        await run("UPDATE bookings SET provider = 'paypal', provider_ref = $1 WHERE id = $2", [order.id, id]);
        pays.push({ kind: "paypal", url: order.url });
      } catch (e) {
        console.error("creator paypal order", e);
      }
    }
    if (payLinkHost(cfg.paymentUrl)) {
      // With the creator's Razorpay webhook on, this booking gets its own exact amount so the payment confirms it by itself.
      const watched = cfg.currency === "INR" && !pays.length && (await hookForUser(page.user_id));
      if (watched) {
        const paise = await exactAmount(page.user_id, price);
        await run("UPDATE bookings SET pay_paise = $1 WHERE id = $2", [paise, id]);
        pays.push({ kind: "link", link: cfg.paymentUrl!, exact: paise });
      } else pays.push({ kind: "link", link: cfg.paymentUrl! });
    }
  }
  if (owner) {
    const online = pays.some((p) => p.kind !== "link");
    const next = free
      ? ""
      : online
        ? "<p>It confirms by itself once they pay on your page.</p>"
        : pays.length
          ? `<p>${pays.some((p) => p.kind === "link" && p.exact) ? "It should confirm by itself when the payment reaches your Razorpay. If it doesn't, check your payment app and tap:" : "Check your payment app, then tap:"}</p><p><a href="${actionUrl(id, "confirm")}" style="background:#111;color:#fff;padding:10px 16px;border-radius:10px;text-decoration:none;display:inline-block;margin:4px 6px 4px 0">Money arrived: confirm</a><a href="${actionUrl(id, "cancel")}" style="border:1px solid #111;color:#111;padding:10px 16px;border-radius:10px;text-decoration:none;display:inline-block;margin:4px 0">Not paid: cancel</a></p>`
          : "<p><b>They had no way to pay on your page.</b> Send them your payment details, then press Mark paid in your dashboard. To fix this, connect Razorpay or PayPal, or add a payment link to the booking card.</p>";
    const extra = `${pack ? ` (package of ${pack.count})` : ""}${credit ? " (from their package, already paid)" : ""}${gift ? `, a gift from ${esc(name)}` : ""}`;
    await sendMail(owner.email, `New booking${free ? "" : " request"}: ${esc(guest.name)}`, `<p>${esc(guest.name)} (${esc(guest.email)}) booked <b>${esc(link.title)}</b>${extra} on ${esc(when)} (${esc(cfg.timeZone)}).</p>${next}`);
  }
  const claimKey = !free && pays.some((p) => p.kind === "link") ? actionKey(id, "claim") : undefined;
  return NextResponse.json({ ok: true, id, status: free ? "confirmed" : "awaiting_payment", meetingUrl: free ? cfg.meetingUrl : undefined, pays, claimKey });
}

// PATCH /api/bookings {id, status} — the page owner marks a booking paid/confirmed or cancelled.
export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const blocked = sameOriginOnly(req);
  if (blocked) return blocked;
  const { id, status } = (await req.json().catch(() => ({}))) as { id?: string; status?: string };
  if (!id || (status !== "confirmed" && status !== "cancelled")) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  const mine = await one("SELECT b.id FROM bookings b JOIN pages p ON p.id = b.page_id WHERE b.id = $1 AND p.user_id = $2", [id, session.userId]);
  const row = mine && (await bookingRow(id));
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await setBookingStatus(row, status);
  return NextResponse.json({ ok: true });
}
