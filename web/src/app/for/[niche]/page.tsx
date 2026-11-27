import { themeList } from "@/lib/themes";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Nav } from "@/components/landing/Nav";
import { Pricing } from "@/components/landing/Pricing";
import { Footer, ThemeGallery, FinalCTA } from "@/components/landing/Sections";
import { niches, nicheBySlug } from "@/content/niches";
import { SITE_URL } from "@/lib/site";

export function generateStaticParams() {
  return niches.map((n) => ({ niche: n.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ niche: string }> }): Promise<Metadata> {
  const niche = nicheBySlug((await params).niche);
  if (!niche) return {};
  const url = `${SITE_URL}/for/${niche.slug}`;
  const title = `${niche.role} - Link in Bio | Showz`;
  const description = `${niche.headline} ${niche.subhead}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      siteName: "Showz",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function NicheLandingPage({ params }: { params: Promise<{ niche: string }> }) {
  const niche = nicheBySlug((await params).niche);
  if (!niche) notFound();

  const url = `${SITE_URL}/for/${niche.slug}`;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: `Showz for ${niche.role}`,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description: niche.subhead,
      offers: [
        { "@type": "Offer", price: "0", priceCurrency: "USD", name: "Free Tier" },
        { "@type": "Offer", price: "299", priceCurrency: "INR", name: "Pro Plan (India)" },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: niche.faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "For Creators", item: `${SITE_URL}#features` },
        { "@type": "ListItem", position: 3, name: niche.role, item: url },
      ],
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Nav />
      <main className="relative overflow-x-clip bg-bg text-fg">
        {/* Hero glow */}
        <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-[520px] max-w-[1000px] bg-[radial-gradient(closest-side,var(--hero-glow),transparent)] opacity-90" />

        {/* Hero Section */}
        <section className="relative mx-auto max-w-6xl px-4 pb-20 pt-36 sm:px-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-fg/15 bg-fg/[0.04] px-4 py-1.5 text-[12px] font-medium uppercase tracking-[0.2em] text-fg/70">
            <span className="h-2 w-2 rounded-full bg-[#ff5b37]" />
            {niche.badge}
          </div>

          <h1 className="mt-6 max-w-[15ch] font-display text-[clamp(48px,8vw,110px)] leading-[0.92] tracking-[-0.02em]">
            {niche.headline.replace(".", "")} <span className="chrome-text">built to earn.</span>
          </h1>

          <p className="mt-6 max-w-[560px] text-[18px] leading-relaxed text-fg/70">
            {niche.subhead}
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href={`/start?goal=${niche.goal}`}
              className="inline-flex items-center gap-2 rounded-full bg-fg px-7 py-3.5 text-[15px] font-bold text-bg transition hover:bg-[#ff5b37] hover:text-[#111]"
            >
              Build your page free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="#themes"
              className="rounded-full border border-fg/15 bg-fg/[0.03] px-6 py-3.5 text-[15px] font-medium text-fg/80 transition hover:border-fg/40 hover:text-fg"
            >
              View {themeList.length} designer styles
            </Link>
          </div>
        </section>

        {/* Three Value Pillars */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <p className="text-[12px] uppercase tracking-[0.35em] text-fg/45">Why Showz</p>
          <h2 className="mt-3 font-display text-[clamp(32px,5vw,56px)] leading-tight">
            Engineered specifically for {niche.role.toLowerCase()}.
          </h2>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {niche.benefits.map((b, i) => (
              <div
                key={b.title}
                className="rounded-[28px] border border-fg/10 bg-fg/[0.03] p-7 transition hover:border-fg/25"
              >
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-fg/10 text-[14px] font-bold text-fg">
                  0{i + 1}
                </div>
                <h3 className="mt-5 text-[20px] font-semibold">{b.title}</h3>
                <p className="mt-2.5 text-[15px] leading-relaxed text-fg/60">{b.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Theme Showcase */}
        <ThemeGallery />

        {/* Transparent Pricing */}
        <Pricing />

        {/* FAQ Section */}
        <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6">
          <p className="text-[12px] uppercase tracking-[0.35em] text-fg/45">FAQ</p>
          <h2 className="mt-3 font-display text-[clamp(32px,4vw,48px)]">
            Frequently asked questions
          </h2>
          <div className="mt-8 space-y-4">
            {niche.faq.map((item) => (
              <div
                key={item.q}
                className="rounded-2xl border border-fg/10 bg-fg/[0.02] p-6 text-[15px]"
              >
                <p className="flex items-center gap-2.5 font-semibold text-fg">
                  <CheckCircle2 className="h-4 w-4 text-[#ff5b37]" />
                  {item.q}
                </p>
                <p className="mt-2.5 text-fg/65 leading-relaxed pl-6.5">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
