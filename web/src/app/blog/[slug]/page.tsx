import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/landing/Nav";
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
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      description: post.description,
      datePublished: post.date,
      dateModified: post.updated ?? post.date,
      mainEntityOfPage: url,
      author: { "@type": "Organization", name: "Makemylink", url: SITE_URL },
      publisher: { "@type": "Organization", name: "Makemylink", url: SITE_URL },
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
  const others = posts.filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <main className="min-h-screen bg-bg text-fg">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-6 sm:px-6">
        <Logo />
        <Link href="/blog" className="text-[13px] text-fg/55 hover:text-fg">All posts</Link>
      </header>
      <article className="mx-auto max-w-3xl px-4 pb-16 sm:px-6 [&_h2]:mt-10 [&_h2]:text-[22px] [&_h2]:font-semibold [&_li]:mt-2 [&_p]:mt-3 [&_p]:text-[16px] [&_p]:leading-relaxed [&_p]:text-fg/75 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:text-fg/75">
        <p className="text-[11px] uppercase tracking-[0.25em] text-fg/40">{post.category}</p>
        <h1 className="mt-3 font-display text-[38px] italic leading-[1.05] sm:text-[56px]">{post.title}</h1>
        <p className="!mt-3 !text-[13px] !text-fg/45">
          Published <time dateTime={post.date}>{post.date}</time>
          {post.updated && <> · Updated <time dateTime={post.updated}>{post.updated}</time></>}
        </p>
        <p className="!mt-6 rounded-2xl border border-fg/10 bg-fg/[0.04] p-5 !text-[17px] !leading-snug !text-fg">{post.answer}</p>
        {post.body.map((b, i) => (
          <section key={i}>
            {b.h2 && <h2>{b.h2}</h2>}
            {b.p?.map((t, j) => <p key={j}>{t}</p>)}
            {b.ul && <ul>{b.ul.map((t) => <li key={t}>{t}</li>)}</ul>}
          </section>
        ))}
        <h2>Frequently asked questions</h2>
        {post.faq.map((f) => (
          <div key={f.q} className="mt-5">
            <h3 className="text-[16px] font-semibold">{f.q}</h3>
            <p>{f.a}</p>
          </div>
        ))}
        <div className="mt-12 rounded-3xl bg-fg p-8 text-bg">
          <p className="font-display text-[30px] italic leading-tight">Build your page in a few minutes.</p>
          <p className="mt-2 !text-bg/70">Free to start. No card needed.</p>
          <Link href="/create" className="mt-5 inline-block rounded-xl bg-[#ff5b37] px-5 py-3 text-[14px] font-semibold text-[#111]">Create your free page</Link>
        </div>
        <h2>Keep reading</h2>
        <ul>
          {others.map((p) => (
            <li key={p.slug}><Link href={`/blog/${p.slug}`} className="underline">{p.title}</Link></li>
          ))}
        </ul>
      </article>
    </main>
  );
}
