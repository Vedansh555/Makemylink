import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Footer } from "@/components/landing/Footer";
import { Nav } from "@/components/landing/Nav";
import { posts } from "@/content/blog";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Blog: link in bio, bookings and creator tools",
  description: "Guides and comparisons for creators, mentors and consultants who want to earn from their link in bio.",
  alternates: { canonical: `${SITE_URL}/blog` },
};

const readTime = (p: (typeof posts)[number]) => {
  const words = p.body.flatMap((b) => [...(b.p ?? []), ...(b.ul ?? [])]).join(" ").split(/\s+/).length + p.answer.split(/\s+/).length;
  return Math.max(2, Math.round(words / 200));
};

export default function BlogIndex() {
  const [featured, ...rest] = posts;
  return (
    <>
      <Nav />
      <main className="relative overflow-x-clip bg-bg text-fg">
        <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-[520px] max-w-[1000px] bg-[radial-gradient(closest-side,var(--hero-glow),transparent)] opacity-90" />
        <div className="relative mx-auto max-w-6xl px-4 pb-24 pt-36 sm:px-6">
          <p className="text-[12px] uppercase tracking-[0.35em] text-fg/45">The blog</p>
          <h1 className="mt-4 max-w-[14ch] font-display text-[clamp(52px,9vw,120px)] leading-[0.9] tracking-[-0.02em]">
            Make your link <span className="chrome-text">earn.</span>
          </h1>
          <p className="mt-6 max-w-[520px] text-[18px] leading-relaxed text-fg/70">Practical guides and honest comparisons for creators, mentors and small shops.</p>

          {featured && (
            <Link href={`/blog/${featured.slug}`} className="group mt-14 block rounded-[28px] border border-fg/10 bg-fg/[0.04] p-7 transition hover:border-fg/30 hover:bg-fg/[0.06] sm:p-10">
              <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-fg/50">
                <span className="rounded-full bg-[#ff5b37] px-3 py-1 font-bold tracking-normal text-[#111]">Latest</span>
                <span>{featured.category}</span>
                <span>·</span>
                <span>{readTime(featured)} min read</span>
              </div>
              <h2 className="mt-5 max-w-[22ch] font-display text-[clamp(32px,5vw,60px)] leading-[1.02]">{featured.title}</h2>
              <p className="mt-4 max-w-[60ch] text-[16px] leading-relaxed text-fg/65">{featured.description}</p>
              <span className="mt-7 inline-flex items-center gap-2 text-[14px] font-semibold">
                Read the guide <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </span>
            </Link>
          )}

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {rest.map((p) => (
              <Link key={p.slug} href={`/blog/${p.slug}`} className="group flex flex-col rounded-[28px] border border-fg/10 bg-fg/[0.04] p-7 transition hover:border-fg/30 hover:bg-fg/[0.06]">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-fg/45">
                  <span>{p.category}</span>
                  <span>·</span>
                  <span>{readTime(p)} min read</span>
                </div>
                <h2 className="mt-4 font-display text-[28px] leading-[1.08]">{p.title}</h2>
                <p className="mt-3 flex-1 text-[14px] leading-relaxed text-fg/60">{p.description}</p>
                <span className="mt-6 inline-flex items-center gap-1.5 text-[13px] font-semibold">
                  Read <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-16 overflow-hidden rounded-2xl bg-[#ff5b37] px-6 py-14 text-center text-[#141414] sm:px-12">
            <h2 className="mx-auto max-w-[16ch] font-display text-[clamp(36px,6vw,72px)] leading-[0.95]">Turn your bio into a business.</h2>
            <p className="mx-auto mt-4 max-w-[40ch] text-[15px] text-[#141414]/75">Free to start. No card needed.</p>
            <Link href="/create" className="mt-7 inline-block rounded-xl bg-[#141414] px-6 py-3.5 text-[15px] font-semibold text-white transition hover:bg-black">
              Create your free page
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
