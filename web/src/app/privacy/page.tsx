import type { Metadata } from "next";
import { LegalPage } from "@/components/landing/LegalPage";

export const metadata: Metadata = { title: "Privacy Policy · Makemylink" };

export default function Privacy() {
  return (
    <LegalPage title="Privacy Policy" updated="October 2026">
      <p>This is a plain-language draft. Have a lawyer review it before you rely on it, especially for India (DPDP Act) and the EU/UK (GDPR).</p>
      <h2>What we collect</h2>
      <ul>
        <li>Account details: your email address and a hashed password (we never store your password itself).</li>
        <li>Page content you add: name, bio, links, products, photos and social handles.</li>
        <li>Basic usage data such as page visits and link clicks, for your analytics.</li>
      </ul>
      <h2>How we use it</h2>
      <p>To run your account, publish your page, send account emails (such as verification and password reset), and keep the service secure. We do not sell your personal data.</p>
      <h2>Payments</h2>
      <p>Payments are handled by our payment providers (Razorpay in India, Stripe elsewhere). We never see or store your full card details.</p>
      <h2>Cookies</h2>
      <p>We use a login cookie to keep you signed in and a small cookie that remembers your pricing region. We do not use advertising cookies.</p>
      <h2>Your page is public</h2>
      <p>Anything you publish on your page can be seen by anyone with the link. Do not publish information you want to keep private.</p>
      <h2>Your rights</h2>
      <p>You can ask to access, correct or delete your data at any time by contacting us. Deleting your account removes your page and personal data.</p>
      <h2>Contact</h2>
      <p>Questions about privacy: add your support email here.</p>
    </LegalPage>
  );
}
