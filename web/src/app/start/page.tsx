import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/landing/Footer";
import { GoalCards } from "@/components/landing/GoalCards";
import { Nav } from "@/components/landing/Nav";

export const metadata: Metadata = {
  title: "Start your page",
  description: "Pick what you want your page to do, and start from a page that already looks finished.",
};

export default async function StartPage({ searchParams }: { searchParams: Promise<{ handle?: string }> }) {
  const { handle } = await searchParams;
  return (
    <>
      <Nav />
      <main className="relative overflow-x-clip bg-bg text-fg">
        <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-[480px] max-w-[900px] bg-[radial-gradient(closest-side,var(--hero-glow),transparent)] opacity-90" />
        <div className="relative mx-auto max-w-6xl px-4 pb-24 pt-36 sm:px-6">
          <p className="text-[12px] uppercase tracking-[0.35em] text-fg/45">Step 1 of 3</p>
          <h1 className="mt-4 max-w-[16ch] font-display text-[clamp(44px,8vw,96px)] leading-[0.92] tracking-[-0.01em]">What should your page do?</h1>
          <p className="mt-5 max-w-[520px] text-[17px] leading-relaxed text-fg/65">Pick one. You get a page that already looks finished, and you just change the words. You can add the rest later.</p>
          <div className="mt-10">
            <GoalCards handle={handle} />
          </div>
          <p className="mt-8 text-[14px] text-fg/50">
            Not sure? <Link href={`/create${handle ? `?handle=${encodeURIComponent(handle)}` : ""}`} className="text-fg underline underline-offset-4">Start with a blank page</Link>.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
