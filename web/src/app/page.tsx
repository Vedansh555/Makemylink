import { Hero } from "@/components/landing/Hero";
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
