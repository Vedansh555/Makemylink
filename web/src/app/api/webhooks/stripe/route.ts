import { NextResponse } from "next/server";
import { PRO_PRICE, stripeVerifyWebhook, type Period } from "@/lib/payments";
import { grantPro } from "@/lib/billing";

export async function POST(req: Request) {
  const raw = await req.text();
  if (!stripeVerifyWebhook(raw, req.headers.get("stripe-signature") ?? "")) {
    return NextResponse.json({ error: "Bad signature" }, { status: 400 });
  }
  const evt = JSON.parse(raw) as {
    type?: string;
    data?: { object?: { id: string; payment_status?: string; metadata?: { user_id?: string; period?: string } } };
  };
  const o = evt.data?.object;
  if (evt.type === "checkout.session.completed" && o?.payment_status === "paid" && o.metadata?.user_id && (o.metadata.period === "monthly" || o.metadata.period === "yearly")) {
    const period = o.metadata.period as Period;
    await grantPro({ userId: o.metadata.user_id, period, provider: "stripe", ref: o.id, amount: PRO_PRICE.GLOBAL[period], currency: "USD" });
  }
  return NextResponse.json({ ok: true });
}
