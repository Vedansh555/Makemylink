import Link from "next/link";
import { Logo } from "./Nav";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-bg text-fg">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-6 sm:px-6">
        <Logo />
        <Link href="/" className="text-[13px] text-fg/55 hover:text-fg">Back home</Link>
      </header>
      <article className="mx-auto max-w-3xl px-4 pb-24 sm:px-6 [&_h2]:mt-9 [&_h2]:text-[18px] [&_h2]:font-semibold [&_li]:mt-1.5 [&_p]:mt-3 [&_p]:leading-relaxed [&_p]:text-fg/70 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:text-fg/70">
        <h1 className="font-display text-[44px] italic leading-none sm:text-[64px]">{title}</h1>
        <p className="!text-[13px] !text-fg/45">Last updated {updated}</p>
        {children}
      </article>
    </main>
  );
}
