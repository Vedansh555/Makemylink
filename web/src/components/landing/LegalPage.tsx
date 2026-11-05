import { Footer } from "./Sections";
import { Nav } from "./Nav";

/** Shared shell for text pages (terms, privacy, refunds, cookies, contact): same nav, type and footer as the home page. */
export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <main className="relative min-h-screen overflow-x-clip bg-bg text-fg">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-0 mx-auto h-[420px] max-w-[900px] bg-[radial-gradient(closest-side,var(--hero-glow),transparent)] opacity-80" />
        <article className="relative mx-auto max-w-3xl px-4 pb-24 pt-36 sm:px-6 [&_a]:underline-offset-4 [&_h2]:mt-12 [&_h2]:font-display [&_h2]:text-[28px] [&_h2]:italic [&_h2]:leading-tight [&_li]:mt-2 [&_p]:mt-3 [&_p]:leading-relaxed [&_p]:text-fg/70 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:text-fg/70">
          <p className="text-[12px] uppercase tracking-[0.35em] text-fg/45">Makemylink</p>
          <h1 className="mt-4 font-display text-[clamp(44px,8vw,84px)] leading-[0.95] tracking-[-0.01em]">{title}</h1>
          <p className="!mt-4 !text-[13px] !text-fg/45">Last updated {updated}</p>
          <div className="mt-10 rounded-[28px] border border-fg/10 bg-fg/[0.03] p-6 sm:p-10 [&>h2:first-child]:!mt-0 [&>p:first-child]:!mt-0">{children}</div>
        </article>
      </main>
      <Footer />
    </>
  );
}
