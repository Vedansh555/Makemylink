import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ChevronDown } from "lucide-react";
import { Footer } from "@/components/landing/Sections";
import { Nav } from "@/components/landing/Nav";
import { postBySlug, posts } from "@/content/blog";
import { SITE_URL } from "@/lib/site";

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const post = postBySlug((await params).slug);
  if (!post) return {};
  const url = `${SITE_URL}/blog/${post.slug}`;
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: url },
    openGraph: { title: post.title, description: post.description, url, type: "article", publishedTime: post.date },
    twitter: { card: "summary_large_image", title: post.title, description: post.description },
  };
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const post = postBySlug((await params).slug);
  if (!post) notFound();
  const url = `${SITE_URL}/blog/${post.slug}`;
  const words = post.body.flatMap((b) => [...(b.p ?? []), ...(b.ul ?? [])]).join(" ").split(/\s+/).length + post.answer.split(/\s+/).length;
  const minutes = Math.max(2, Math.round(words / 200));
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      description: post.description,
      datePublished: post.date,
      dateModified: post.updated ?? post.date,
      mainEntityOfPage: url,
      author: { "@type": "Organization", name: "Showz", url: SITE_URL },
      publisher: { "@type": "Organization", name: "Showz", url: SITE_URL },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: post.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
        { "@type": "ListItem", position: 3, name: post.title, item: url },
      ],
    },
  ];
  const others = posts.filter((p) => p.slug !== post.slug).slice(0, 2);

  return (
    <>
      <Nav />
      <main className="relative overflow-x-clip bg-bg text-fg">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
        <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-[480px] max-w-[900px] bg-[radial-gradient(closest-side,var(--hero-glow),transparent)] opacity-90" />
        <article className="relative mx-auto max-w-3xl px-4 pb-20 pt-32 sm:px-6">
          <Link href="/blog" className="inline-flex items-center gap-1.5 text-[13px] text-fg/55 transition hover:text-fg">
            <ArrowLeft className="h-3.5 w-3.5" /> All guides
          </Link>
          <div className="mt-8 flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-fg/50">
            <span className="rounded-full bg-fg/[0.07] px-3 py-1">{post.category}</span>
            <time dateTime={post.date}>{post.date}</time>
            <span>·</span>
            <span>{minutes} min read</span>
          </div>
          <h1 className="mt-5 font-display text-[clamp(38px,6.5vw,76px)] leading-[0.98] tracking-[-0.01em]">{post.title}</h1>

          <div className="mt-9 rounded-[24px] border border-[#ff5b37]/30 bg-[#ff5b37]/[0.07] p-6 sm:p-7">
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#c8431f]">The short answer</p>
            <p className="mt-2 text-[18px] leading-snug text-fg sm:text-[20px]">{post.answer}</p>
          </div>

          <div className="mt-4">
            {post.body.map((b, i) => (
              <section key={i} className="mt-10">
                {b.h2 && <h2 className="font-display text-[clamp(26px,4vw,36px)] leading-tight">{b.h2}</h2>}
                {b.p?.map((t, j) => (
                  <p key={j} className="mt-4 text-[17px] leading-[1.75] text-fg/75">{t}</p>
                ))}
                {b.ul && (
                  <ul className="mt-4 space-y-2.5">
                    {b.ul.map((t) => (
                      <li key={t} className="flex gap-3 text-[16px] leading-relaxed text-fg/75">
                        <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ff5b37]" />
                        {t}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>

          <h2 className="mt-16 font-display text-[clamp(26px,4vw,36px)] leading-tight">Questions</h2>
          <div className="mt-5 space-y-3">
            {post.faq.map((f) => (
              <details key={f.q} className="group rounded-2xl border border-fg/10 bg-fg/[0.04] px-5 py-4 open:bg-fg/[0.06]">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[16px] font-semibold">
                  {f.q}
                  <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-[15px] leading-relaxed text-fg/65">{f.a}</p>
              </details>
            ))}
          </div>

          <div className="mt-16 overflow-hidden rounded-2xl bg-[#ff5b37] px-6 py-12 text-center text-[#141414] sm:px-10">
            <p className="mx-auto max-w-[18ch] font-display text-[clamp(32px,5vw,56px)] leading-[0.98]">Build your page in a few minutes.</p>
            <p className="mt-3 text-[14px] text-[#141414]/75">Free to start. No card needed.</p>
            <Link href="/create" className="mt-6 inline-block rounded-xl bg-[#141414] px-6 py-3.5 text-[15px] font-semibold text-white transition hover:bg-black">
              Create your free page
            </Link>
          </div>

          <p className="mt-10 text-[12px] leading-relaxed text-fg/40">
            Other companies and products named here belong to their owners, and we are not affiliated with them. We describe how they work in general terms; check each company&apos;s own site for its current prices and features.
          </p>

          <h2 className="mt-12 font-display text-[28px]">Keep reading</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {others.map((p) => (
              <Link key={p.slug} href={`/blog/${p.slug}`} className="group rounded-[24px] border border-fg/10 bg-fg/[0.04] p-6 transition hover:border-fg/30">
                <p className="text-[11px] uppercase tracking-[0.2em] text-fg/45">{p.category}</p>
                <p className="mt-3 font-display text-[24px] leading-[1.1]">{p.title}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold">
                  Read <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
