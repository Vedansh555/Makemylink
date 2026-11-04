import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/landing/LegalPage";
import { LEGAL_UPDATED } from "@/lib/legal";

export const metadata: Metadata = { title: "Cookie Policy · Makemylink" };

export default function Cookies() {
  return (
    <LegalPage title="Cookie Policy" updated={LEGAL_UPDATED}>
      <p>Cookies are small files a website saves in your browser. Makemylink uses only the ones it needs to work.</p>
      <h2>Cookies we set</h2>
      <ul>
        <li><b>Login cookie:</b> keeps you signed in to your account. It is removed when you log out or after a period of inactivity.</li>
        <li><b>Pricing region cookie (<span className="font-mono">mml_region</span>):</b> remembers whether to show prices in rupees (₹) or US dollars ($), based on your country. It lasts 30 days.</li>
      </ul>
      <h2>What we do not use</h2>
      <ul>
        <li>No advertising cookies.</li>
        <li>No third-party tracking or analytics cookies.</li>
        <li>We do not sell or share data about your browsing.</li>
      </ul>
      <h2>Stored in your browser</h2>
      <p>The editor saves your unfinished page draft in your browser&apos;s local storage so you don&apos;t lose it, and we remember that you dismissed the cookie notice. This stays on your device.</p>
      <h2>Payments</h2>
      <p>When you pay, Razorpay or Stripe may set their own cookies on their payment window to prevent fraud. Their policies apply there.</p>
      <h2>Controlling cookies</h2>
      <p>You can delete or block cookies in your browser settings. If you block the login cookie you won&apos;t be able to stay signed in.</p>
      <p>More about how we handle your data is in our <Link href="/privacy" className="underline">Privacy Policy</Link>.</p>
    </LegalPage>
  );
}
