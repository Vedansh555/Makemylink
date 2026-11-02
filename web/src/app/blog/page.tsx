import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/landing/Nav";
import { posts } from "@/content/blog";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Blog: link in bio, bookings and creator tools",
  description: "Guides and comparisons for creators, mentors and consultants who want to earn from their link in bio.",
  alternates: { canonical: `${SITE_URL}/blog` },
};

export default function BlogIndex() {
  return (
    <main className="min-h-screen bg-bg text-fg">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-6 sm:px-6">
        <Logo />
        <Link href="/create" className="rounded-lg bg-fg px-4 py-2 text-[13px] font-semibold text-bg">Create your page</Link>
      </header>
      <div className="mx-auto max-w-3xl px-4 pb-24 sm:px-6">
        <h1 className="font-display text-[44px] italic leading-none sm:text-[64px]">The Makemylink blog</h1>
        <p className="mt-4 text-fg/60">Practical guides for creators who want their bio link to earn.</p>
        <ul className="mt-10 divide-y divide-fg/10 border-y border-fg/10">
          {posts.map((p) => (
            <li key={p.slug}>
              <Link href={`/blog/${p.slug}`} className="group block py-6">
                <p className="text-[11px] uppercase tracking-[0.25em] text-fg/40">{p.category} · {p.date}</p>
                <h2 className="mt-2 text-[22px] font-semibold leading-snug group-hover:underline">{p.title}</h2>
                <p className="mt-2 text-[15px] text-fg/60">{p.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
