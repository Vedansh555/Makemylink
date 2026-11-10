import type { Metadata } from "next";
import { LegalPage } from "@/components/landing/LegalPage";
import { LEGAL_UPDATED, OPERATOR } from "@/lib/legal";

export const metadata: Metadata = { title: "Privacy Policy · Showz" };

export default function Privacy() {
  return (
    <LegalPage title="Privacy Policy" updated={LEGAL_UPDATED}>
      <p>
        This policy explains what Showz, operated by {OPERATOR.names} ({OPERATOR.place}), collects and why. It follows the principles of India&apos;s Digital Personal Data Protection Act, 2023 and the IT Act, 2000.
      </p>
      <h2>What we collect</h2>
      <ul>
        <li><b>Account details:</b> your email address and a hashed password. We never store your password itself.</li>
        <li><b>Page content you add:</b> name, bio, links, products, photos, social handles and booking settings.</li>
        <li><b>Visitor data on your page:</b> page views, link clicks and the visitor&apos;s country, to show you analytics. We do not collect visitor names.</li>
        <li><b>Emails and bookings from your visitors:</b> if you turn on the email sign-up or bookings, we store the email, name, chosen time and note that a visitor enters, so you can see them. You are responsible for how you use that information.</li>
        <li><b>Payment records:</b> the amount, date and payment reference for Pro purchases. We never see or store your card number or UPI PIN.</li>
      </ul>
      <h2>How we use it</h2>
      <p>To run your account, publish your page, send account and booking emails, show your analytics, prevent abuse, and keep the service secure. We do not sell your personal data.</p>
      <h2>Who we share it with</h2>
      <p>Only the services that help us run Showz: our hosting provider (Render), database provider (Neon), image storage (Cloudflare), email provider (Resend), and payment providers (Razorpay in India, PayPal elsewhere). They process data on our behalf. We may also disclose information if the law requires it.</p>
      <h2>Cookies</h2>
      <p>We use a login cookie to keep you signed in and a small cookie that remembers your pricing region (₹ or $). We do not use advertising cookies.</p>
      <h2>Your page is public</h2>
      <p>Anything you publish on your page can be seen by anyone with the link, and may be indexed by search engines. Do not publish information you want to keep private.</p>
      <h2>How long we keep it</h2>
      <p>We keep your data while your account is open. When you delete your account we remove your page and personal data, except records we must keep by law, such as payment records.</p>
      <h2>Your rights</h2>
      <p>You can ask to access, correct or delete your data, or withdraw consent, at any time by emailing us. We will reply within a reasonable time, usually within 30 days.</p>
      <h2>Children</h2>
      <p>Showz is not meant for people under 18 without a parent or guardian.</p>
      <h2>Grievance officer</h2>
      <p>{OPERATOR.grievanceOfficer}, {OPERATOR.place}. Email: <a href={`mailto:${OPERATOR.supportEmail}`} className="underline">{OPERATOR.supportEmail}</a></p>
      <h2>Changes</h2>
      <p>If we change this policy we will update the date at the top of this page.</p>
    </LegalPage>
  );
}
