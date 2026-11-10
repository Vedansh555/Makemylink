"use client";

/** Opens Razorpay Checkout for a booking and tells the server once the buyer has paid. */
export interface RazorpayPay {
  kind: "razorpay";
  keyId: string;
  orderId: string;
  amount: number;
  bookingId: string;
}

type Opened = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type RzpCtor = new (o: Record<string, unknown>) => { open: () => void; on: (e: string, cb: () => void) => void };

function loadScript(): Promise<RzpCtor | null> {
  const w = window as unknown as { Razorpay?: RzpCtor };
  if (w.Razorpay) return Promise.resolve(w.Razorpay);
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(w.Razorpay ?? null);
    s.onerror = () => resolve(null);
    document.body.appendChild(s);
  });
}

export type PayOutcome = { ok: true; meetingUrl?: string } | { ok: false; cancelled?: boolean; error?: string };

export async function payWithRazorpay(p: RazorpayPay, who: { name: string; email: string; title: string; creator: string }): Promise<PayOutcome> {
  const Rzp = await loadScript();
  if (!Rzp) return { ok: false, error: "Could not load the payment window. Check your connection and try again." };
  return new Promise<PayOutcome>((resolve) => {
    let paid = false;
    const rzp = new Rzp({
      key: p.keyId,
      order_id: p.orderId,
      amount: p.amount,
      currency: "INR",
      name: who.creator,
      description: who.title,
      prefill: { name: who.name, email: who.email },
      theme: { color: "#111111" },
      handler: async (r: Opened) => {
        paid = true;
        const res = await fetch("/api/bookings/pay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId: p.bookingId, orderId: r.razorpay_order_id, paymentId: r.razorpay_payment_id, signature: r.razorpay_signature }),
        });
        const d = await res.json().catch(() => ({}));
        resolve(res.ok ? { ok: true, meetingUrl: d.meetingUrl } : { ok: false, error: d.error ?? "We could not confirm the payment. If money left your account, the creator will confirm your booking." });
      },
      modal: { ondismiss: () => { if (!paid) resolve({ ok: false, cancelled: true }); } },
    });
    rzp.open();
  });
}
