import type { Metadata } from "next";
import { LegalPage } from "@/components/landing/LegalPage";

export const metadata: Metadata = { title: "Terms of Service · Makemylink" };

export default function Terms() {
  return (
    <LegalPage title="Terms of Service" updated="October 2026">
      <p>This is a plain-language draft. Have a lawyer review it before you rely on it.</p>
      <h2>Using Makemylink</h2>
      <p>You must be at least 13 and able to form a binding agreement. You are responsible for your account and for everything published on your page.</p>
      <h2>What you can&apos;t do</h2>
      <ul>
        <li>Publish illegal, hateful, harassing, or misleading content, or content you have no right to share.</li>
        <li>Link to malware, phishing, or scams.</li>
        <li>Try to break, overload, or get around the security of the service.</li>
      </ul>
      <p>We may remove content or suspend accounts that break these rules.</p>
      <h2>Plans, fees and payments</h2>
      <p>Paid plans renew until you cancel. Starter charges a 5% fee on sales made through your page; Pro charges 0%. Payment processors also charge their own fees. We never charge you without asking.</p>
      <h2>Your content</h2>
      <p>You keep ownership of what you publish. You give us permission to host and display it so the service works.</p>
      <h2>Availability</h2>
      <p>We work hard to keep the service running but cannot promise it will always be available or error-free.</p>
      <h2>Ending your account</h2>
      <p>You can stop using Makemylink and delete your account at any time. We can suspend or end accounts that break these terms.</p>
      <h2>Contact</h2>
      <p>Questions about these terms: add your support email here.</p>
    </LegalPage>
  );
}
