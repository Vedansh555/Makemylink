import { NextResponse } from "next/server";
import { hookById, markSeen, paymentFrom, settleLinkPayment, signatureOk } from "@/lib/linkWatch";

// A creator's own Razorpay account calls this when a payment arrives on their payment link.
// Each creator has their own address and secret, set up from Dashboard > Bookings.
export async function POST(req: Request, { params }: { params: Promise<{ hook: string }> }) {
  const raw = await req.text();
  if (raw.length > 200_000) return NextResponse.json({ error: "Too big" }, { status: 413 });
  const hook = await hookById((await params).hook);
  if (!hook) return NextResponse.json({ error: "Unknown" }, { status: 404 });
  if (!signatureOk(raw, req.headers.get("x-razorpay-signature"), hook.secret)) return NextResponse.json({ error: "Bad signature" }, { status: 400 });
  await markSeen(hook.hookId).catch(() => {});
  let evt: Parameters<typeof paymentFrom>[0];
  try {
    evt = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  const pay = paymentFrom(evt);
  // Other payments on the creator's account are none of our business: say OK so Razorpay doesn't retry.
  if (!pay) return NextResponse.json({ ok: true, ignored: true });
  try {
    const result = await settleLinkPayment(hook.userId, pay);
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    console.error("link webhook error", e);
    return NextResponse.json({ error: "Try again" }, { status: 500 });
  }
}
