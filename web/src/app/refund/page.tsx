import type { Metadata } from "next";
import { LegalPage } from "@/components/landing/LegalPage";
import { LEGAL_UPDATED, OPERATOR } from "@/lib/legal";

export const metadata: Metadata = { title: "Refund and Cancellation Policy · Showz" };

export default function Refund() {
  return (
    <LegalPage title="Refund and Cancellation Policy" updated={LEGAL_UPDATED}>
      <h2>The Free plan</h2>
      <p>The Free plan costs nothing, needs no card, and you can stop using it at any time.</p>
      <h2>Pro is prepaid and never renews on its own</h2>
      <p>Pro is bought for one month or one year at a time. We do not store your card for automatic charges, so there is nothing to cancel and you will never be billed again unless you choose to buy another period. When your Pro period ends, your page stays online with Free plan limits.</p>
      <h2>7-day refund</h2>
      <p>If you are not happy with Pro, email us within <b>7 days</b> of your payment and we will refund that payment in full. This applies to your first Pro purchase. Later purchases can be refunded within 7 days if you have not used the paid features heavily.</p>
      <h2>After 7 days</h2>
      <p>Payments are not refundable after 7 days, except where the law requires it or where we caused a serious problem, such as being charged twice or the service being unavailable for a long time.</p>
      <h2>How to ask</h2>
      <p>Email <a href={`mailto:${OPERATOR.supportEmail}`} className="underline">{OPERATOR.supportEmail}</a> from your account email with your payment reference. We reply within 2 working days.</p>
      <h2>How refunds are paid</h2>
      <p>Approved refunds go back to the original payment method (UPI, card or bank) through Razorpay or Stripe. Banks usually take 5 to 10 working days to show it.</p>
      <h2>Bookings and products sold by creators</h2>
      <p>If you bought a session or product from a creator through their page, the payment went to that creator, not to us. Please ask the creator for a refund. We can help you reach them but cannot refund their sales.</p>
      <h2>Contact</h2>
      <p>{OPERATOR.names}, {OPERATOR.place}. Email: <a href={`mailto:${OPERATOR.supportEmail}`} className="underline">{OPERATOR.supportEmail}</a></p>
    </LegalPage>
  );
}
