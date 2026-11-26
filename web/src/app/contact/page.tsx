import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/landing/LegalPage";
import { LEGAL_UPDATED, OPERATOR } from "@/lib/legal";

export const metadata: Metadata = { title: "Contact Us · Showz" };

export default function Contact() {
  return (
    <LegalPage title="Contact Us" updated={LEGAL_UPDATED}>
      <p>We are two students building Showz. A real person reads every message and replies within 2 working days.</p>
      <h2>Support and billing</h2>
      <p>Email <a href={`mailto:${OPERATOR.supportEmail}`} className="underline">{OPERATOR.supportEmail}</a> for help with your account, payments or refunds. Please write from your account email and include your payment reference if it is about a payment.</p>
      <h2>Report a page</h2>
      <p>If a page breaks our rules (scams, illegal content, harassment, impersonation), email us the page address and what is wrong. Every public page also has a &quot;Report this page&quot; link at the bottom. We review reports and remove content that breaks the <Link href="/terms" className="underline">Terms of Service</Link>.</p>
      <h2>Privacy and data requests</h2>
      <p>To see, correct or delete your data, email us from your account email. Our grievance officer is {OPERATOR.grievanceOfficer}, reachable at the same address.</p>
      <h2>Who runs Showz</h2>
      <p>{OPERATOR.names}, {OPERATOR.place}. <Link href="/about" className="underline">About us</Link>.</p>
      <h2>Delivery</h2>
      <p>Showz is a digital service. Nothing is shipped. Pro starts as soon as your payment is confirmed.</p>
      <p>See also our <Link href="/refund" className="underline">Refund and Cancellation Policy</Link> and <Link href="/privacy" className="underline">Privacy Policy</Link>.</p>
    </LegalPage>
  );
}
