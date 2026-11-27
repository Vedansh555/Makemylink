import { NextResponse } from "next/server";
import { PRO_PRICE, razorpayVerifyWebhook, type Period } from "@/lib/payments";
import { grantPro, revokePro } from "@/lib/billing";

// Backup for the browser callback: Razorpay tells us when a payment is captured, even if the buyer closed the tab.
export async function POST(req: Request) {
  const raw = await req.text();
  if (!razorpayVerifyWebhook(raw, req.headers.get("x-razorpay-signature") ?? "")) {
    return NextResponse.json({ error: "Bad signature" }, { status: 400 });
  }
  const evt = JSON.parse(raw) as { event?: string; payload?: { payment?: { entity?: { id: string; amount?: number; amount_refunded?: number; notes?: Record<string, string> } }; refund?: { entity?: { payment_id?: string; amount?: number } } } };
  const pay = evt.payload?.payment?.entity;
  if (evt.event === "refund.processed") {
    const refund = evt.payload?.refund?.entity;
    const paymentId = refund?.payment_id ?? pay?.id;
    // The payment carries the total refunded so far; fall back to this one refund's amount.
    const paise = pay?.amount_refunded ?? refund?.amount ?? 0;
    if (paymentId) await revokePro("razorpay", paymentId, paise / 100);
    return NextResponse.json({ ok: true });
  }
  if (evt.event === "payment.captured" && pay?.notes?.user_id && (pay.notes.period === "monthly" || pay.notes.period === "yearly")) {
    const period = pay.notes.period as Period;
    const region = pay.notes.region === "GLOBAL" ? "GLOBAL" : "IN";
    await grantPro({ userId: pay.notes.user_id, period, provider: "razorpay", ref: pay.id, amount: PRO_PRICE[region][period], currency: PRO_PRICE[region].currency });
  }
  return NextResponse.json({ ok: true });
}
