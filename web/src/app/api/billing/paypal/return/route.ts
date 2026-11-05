import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { PRO_PRICE, paypalCapture } from "@/lib/payments";
import { grantPro } from "@/lib/billing";

// GET — PayPal sends the buyer back here after they approve. We take the money, then grant Pro from the order we created.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const site = process.env.NEXT_PUBLIC_SITE_URL || url.origin;
  const back = (q: string) => NextResponse.redirect(`${site}/dashboard?${q === "1" ? "upgraded=1" : "tab=billing&paid=failed"}`);
  const session = await getSession();
  const orderId = url.searchParams.get("token");
  if (!session?.userId || !orderId) return back("failed");
  try {
    const c = await paypalCapture(orderId);
    const price = PRO_PRICE.GLOBAL;
    if (c.userId !== session.userId || (c.period !== "monthly" && c.period !== "yearly") || c.currency !== "USD" || c.value !== price[c.period]) return back("failed");
    await grantPro({ userId: c.userId, period: c.period, provider: "paypal", ref: c.captureId, amount: price[c.period], currency: "USD" });
    return back("1");
  } catch (e) {
    console.error("paypal return error", e);
    return back("failed");
  }
}
