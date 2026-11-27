import { NextResponse } from "next/server";
import { PRO_PRICE, paypalVerifyWebhook } from "@/lib/payments";
import { grantPro, revokePro } from "@/lib/billing";
import { one } from "@/lib/db";

// Backup for the return page: PayPal tells us when a Pro payment completes, for example after reviewing a "pending" one,
// or if our server failed just after taking the money. Needs PAYPAL_WEBHOOK_ID.
export async function POST(req: Request) {
  const raw = await req.text();
  let evt: { event_type?: string; resource?: { id?: string; status?: string; custom_id?: string; amount?: { currency_code?: string; value?: string }; links?: { rel?: string; href?: string }[]; seller_payable_breakdown?: { total_refunded_amount?: { value?: string } } } };
  try {
    if (raw.length > 200_000) throw new Error("too big");
    evt = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  try {
    if (!(await paypalVerifyWebhook(raw, req.headers))) return NextResponse.json({ error: "Bad signature" }, { status: 400 });

    const cap = evt.resource;
    if (evt.event_type === "PAYMENT.CAPTURE.REFUNDED") {
      // The message describes the refund; its "up" link points back to the payment that was refunded.
      const captureId = /\/captures\/([\w-]+)/.exec(cap?.links?.find((l) => l.rel === "up")?.href ?? "")?.[1];
      const total = Number(cap?.seller_payable_breakdown?.total_refunded_amount?.value ?? cap?.amount?.value ?? 0);
      if (captureId) await revokePro("paypal", captureId, total);
      return NextResponse.json({ ok: true });
    }
    if (evt.event_type !== "PAYMENT.CAPTURE.COMPLETED" || !cap?.id || cap.status !== "COMPLETED") return NextResponse.json({ ok: true, ignored: true });
    const [userId, period] = (cap.custom_id ?? "").split("|");
    if (!userId || (period !== "monthly" && period !== "yearly")) return NextResponse.json({ ok: true, ignored: true });
    const price = PRO_PRICE.GLOBAL[period];
    if (cap.amount?.currency_code !== "USD" || Number(cap.amount.value) !== price) return NextResponse.json({ ok: true, ignored: true });
    if (!(await one("SELECT id FROM users WHERE id = $1", [userId]))) return NextResponse.json({ ok: true, ignored: true });

    await grantPro({ userId, period, provider: "paypal", ref: cap.id, amount: price, currency: "USD" });
    return NextResponse.json({ ok: true });
  } catch (e) {
    // A 500 makes PayPal send the message again later.
    console.error("paypal webhook error", e);
    return NextResponse.json({ error: "Try again" }, { status: 500 });
  }
}
