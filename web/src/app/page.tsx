import { FREE_THEME_IDS } from "@/lib/plans";
import { Hero } from "@/components/landing/Hero";
import { GoalCards } from "@/components/landing/GoalCards";
import { Nav } from "@/components/landing/Nav";
import { Pricing } from "@/components/landing/Pricing";
import { Compare, FAQ, Features, FinalCTA, HowItWorks, Marquee, ThemeGallery } from "@/components/landing/Sections";
import { Footer } from "@/components/landing/Footer";
import { SITE_URL } from "@/lib/site";

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Showz",
    url: SITE_URL,
    description: "Your whole business in one link: paid bookings, products, WhatsApp and email leads, all on a beautiful page.",
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/{handle}`,
      "query-input": "required name=handle",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Showz",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: [
      {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        name: "Free Plan",
      },
      {
        "@type": "Offer",
        price: "299",
        priceCurrency: "INR",
        name: "Pro Plan (India)",
      },
      {
        "@type": "Offer",
        price: "8",
        priceCurrency: "USD",
        name: "Pro Plan (Global)",
      },
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Showz",
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.ico`,
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Who is Showz for?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "People who earn from their audience: creators, mentors, coaches, consultants, photographers, stylists and small shops. If you want followers to book, buy or subscribe, it is for you.",
        },
      },
      {
        "@type": "Question",
        name: "How do paid bookings work?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Add a booking card with your days, hours and price. A follower picks a time and pays you directly. Connect your own Razorpay or PayPal and the booking confirms by itself, or add your payment link and confirm it yourself. They get your meeting link by email. We take no cut.",
        },
      },
      {
        "@type": "Question",
        name: "Do you take a cut of my sales?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. Zero commission on bookings and sales. If a payment company is involved it charges its own normal fee.",
        },
      },
      {
        "@type": "Question",
        name: "Can I bring my existing page?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Paste the link of your page from Linktree or most other link pages, and we copy your picture, links, groups, social handles and shop items.",
        },
      },
      {
        "@type": "Question",
        name: "Can I sell digital products or courses?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Not directly yet. Showz focuses on paid 1:1 bookings, product links and your email list. You can link to a store, a course site or a download from your page.",
        },
      },
      {
        "@type": "Question",
        name: "Is the free plan really free?",
        acceptedAnswer: {
          "@type": "Answer",
          text: `Yes, forever, with no card. Free includes ${FREE_THEME_IDS.length} themes, 8 links and a Showz badge. Pro is a prepaid month or year with no auto-renewal. If it ends, your page stays online with Free limits.`,
        },
      },
    ],
  },
];

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Nav />
      <main className="overflow-x-clip">
        <Hero />
        <Marquee />
        <section className="mx-auto max-w-6xl px-4 pb-4 pt-24 sm:px-6">
          <p className="text-[12px] uppercase tracking-[0.35em] text-fg/45">Start here</p>
          <h2 className="mt-4 max-w-[16ch] font-display text-[clamp(44px,7vw,96px)] leading-[0.9]">What should your page do?</h2>
          <p className="mt-5 max-w-[520px] text-fg/60">Pick one. You get a page that already looks finished, and you just change the words.</p>
          <div className="mt-10">
            <GoalCards />
          </div>
        </section>
        <HowItWorks />
        <ThemeGallery />
        <Features />
        <Compare />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
