import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/landing/LegalPage";
import { LEGAL_UPDATED, OPERATOR } from "@/lib/legal";

export const metadata: Metadata = { title: "Terms of Service · Showz" };

export default function Terms() {
  return (
    <LegalPage title="Terms of Service" updated={LEGAL_UPDATED}>
      <h2>Who we are</h2>
      <p>
        Showz is operated by {OPERATOR.names} from {OPERATOR.place}. In these terms, &quot;we&quot; and &quot;us&quot; mean the people who run Showz, and &quot;you&quot; means anyone who uses it.
      </p>
      <h2>Using Showz</h2>
      <p>You must be at least 18, or have a parent or guardian&apos;s permission, and be able to form a binding agreement. You are responsible for your account, your password and everything published on your page.</p>
      <h2>What you can&apos;t do</h2>
      <ul>
        <li>Publish illegal, hateful, harassing, sexually explicit or misleading content, or content you have no right to share.</li>
        <li>Link to malware, phishing, scams, pirated material, betting, or schemes that promise guaranteed returns.</li>
        <li>Sell or promote anything that is illegal in India or in the buyer&apos;s country.</li>
        <li>Try to break, overload, or get around the security of the service.</li>
      </ul>
      <p>We may remove content or suspend accounts that break these rules, with or without notice.</p>
      <h2>Plans and payments</h2>
      <p>
        Showz has a Free plan and a paid Pro plan. Pro is sold as a prepaid period (one month or one year) and does <b>not</b> renew automatically. When the period ends, your page stays online with Free plan limits until you pay again. Prices are shown in rupees (₹) in India, paid through Razorpay, and in US dollars elsewhere, paid through PayPal. Payment providers may charge their own fees. We take no commission on your bookings or sales.
      </p>
      <p>Refunds are covered in our <Link href="/refund" className="underline">Refund and Cancellation Policy</Link>.</p>
      <h2>Bookings and sales between you and your visitors</h2>
      <p>
        If you offer paid sessions or products through your page, the agreement is between you and your customer. Payments for bookings go directly to you (through your own Razorpay or PayPal account, or your own payment link). We do not hold that money, and we are not responsible for the quality, delivery or refund of what you sell. You are responsible for any taxes that apply to you.
      </p>
      <h2>Your content</h2>
      <p>You keep ownership of what you publish. You give us a licence to host, copy and display it so the service works. You promise you have the right to publish it.</p>
      <p><b>We never use your content, photos, likeness or your visitors&apos; details to train AI models</b>, and we never sell them.</p>
      <h2 id="copyright">Copyright and trademark complaints</h2>
      <p>If a page on Showz uses your photo, writing, music, product, brand name or logo without permission, email <a href={`mailto:${OPERATOR.supportEmail}?subject=Copyright%20complaint`} className="underline">{OPERATOR.supportEmail}</a> with the subject &quot;Copyright complaint&quot; and include:</p>
      <ul>
        <li>your name and contact details, and, if you act for someone else, who that is;</li>
        <li>the address of the Showz page and exactly what on it is yours;</li>
        <li>a link to your original work, or your trademark registration or other proof that it is yours;</li>
        <li>a statement that the use is not authorised and that what you have told us is true.</li>
      </ul>
      <p>You can also use <Link href="/report" className="underline">Report a page</Link>. We reply within 2 working days. We may remove the content or suspend the page, and we tell its owner why. If you are the owner and believe this was a mistake, reply with your reasons and any proof, and we will look again. We close the accounts of people who repeatedly use work that is not theirs. A false complaint may make you responsible for the harm it causes.</p>
      <h2>Your page can never vanish</h2>
      <p>You can download everything at any time from your dashboard (Account, then &ldquo;Your page is yours&rdquo;): your pages, links, products, email list and bookings, plus a plain backup web page you can host anywhere. If we ever close Showz, we will tell you by email at least 60 days before, keep downloads open until the end, and never delete your page without that warning.</p>
      <h2>Availability</h2>
      <p>We work to keep the service running but cannot promise it will always be available or error-free. Features may change.</p>
      <h2>Limits of our responsibility</h2>
      <p>The service is provided &quot;as is&quot;. To the extent the law allows, we are not liable for lost income, lost data or indirect damages arising from your use of Showz. Our total liability for any claim is limited to the amount you paid us in the 12 months before the claim.</p>
      <h2>Ending your account</h2>
      <p>You can stop using Showz and delete your account at any time by emailing us. We can suspend or end accounts that break these terms.</p>
      <h2>Governing law</h2>
      <p>These terms are governed by the laws of India. Disputes will be handled by the courts at Haridwar, Uttarakhand, India.</p>
      <h2>Contact</h2>
      <p>Questions about these terms: <a href={`mailto:${OPERATOR.supportEmail}`} className="underline">{OPERATOR.supportEmail}</a></p>
    </LegalPage>
  );
}
