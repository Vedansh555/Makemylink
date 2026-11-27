import { themeList } from "@/lib/themes";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Footer } from "@/components/landing/Footer";
import { Nav } from "@/components/landing/Nav";
import { PhoneFrame } from "@/components/landing/PhoneFrame";
import { GOALS, isGoal, looksFor, previewFor } from "@/lib/templates";

export const metadata: Metadata = {
  title: "Pick a look",
  description: "Choose the design for your page. Every look works with every feature, and you can change it any time.",
};

export default async function StylePage({ searchParams }: { searchParams: Promise<{ goal?: string; handle?: string }> }) {
  const { goal, handle } = await searchParams;
  if (!isGoal(goal) || goal === "import") redirect("/start");
  const meta = GOALS.find((g) => g.id === goal)!;
  const q = handle ? `&handle=${encodeURIComponent(handle)}` : "";
  const looks = looksFor(goal);
  
  return (
    <>
      <Nav />
      <main className="relative overflow-x-clip bg-bg text-fg">
        <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-[480px] max-w-[900px] bg-[radial-gradient(closest-side,var(--hero-glow),transparent)] opacity-90" />
        <div className="relative mx-auto max-w-6xl px-4 pb-24 pt-36 sm:px-6">
          <Link href={`/start${handle ? `?handle=${encodeURIComponent(handle)}` : ""}`} className="inline-flex items-center gap-1.5 py-2 text-[13px] text-fg/55 transition hover:text-fg">
            <ArrowLeft className="h-3.5 w-3.5" /> Change goal
          </Link>
          <p className="mt-4 text-[12px] uppercase tracking-[0.35em] text-fg/45">Step 2 of 3 · {meta.title}</p>
          <h1 className="mt-4 max-w-[16ch] font-display text-[clamp(44px,8vw,96px)] leading-[0.92] tracking-[-0.01em]">Pick a look.</h1>
          <p className="mt-5 max-w-[540px] text-[17px] leading-relaxed text-fg/65">Every look works with every feature, and you can change it any time. Tap the one that feels like you.</p>

          <div className="mt-10 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-6 md:grid-cols-3">
            {looks.map((l, i) => (
              <div key={l.id} className="group relative flex flex-col items-center gap-3 text-center">
                <Link href={`/create?goal=${goal}&theme=${l.id}${q}`} aria-label={`Use the ${l.label} look`} className="absolute inset-0 z-20 rounded-[34px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff5b37]" />
                <div className="rounded-[34px] transition duration-300 group-hover:-translate-y-1.5 group-focus-visible:-translate-y-1.5">
                  <PhoneFrame interactive={false} profile={{ ...previewFor(goal, String(i), l.id), theme: l.id }} scale={0.5} />
                </div>
                <span className="text-[14px] font-semibold">{l.label}</span>
                <span className="-mt-2 inline-flex items-center gap-1 text-[12px] text-fg/50 group-hover:text-fg">
                  Use this look <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            ))}
          </div>

          <p className="mt-12 text-[14px] text-fg/55">
            Not sure? <Link href={`/create?goal=${goal}${q}`} className="text-fg underline underline-offset-4">Use the suggested look</Link>. There are {themeList.length} themes to try inside the editor.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
