import { Hero } from "@/components/landing/Hero";
import { GoalCards } from "@/components/landing/GoalCards";
import { Nav } from "@/components/landing/Nav";
import { Pricing } from "@/components/landing/Pricing";
import { Compare, FAQ, Features, FinalCTA, Footer, HowItWorks, Marquee, ThemeGallery } from "@/components/landing/Sections";

export default function Home() {
  return (
    <>
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
