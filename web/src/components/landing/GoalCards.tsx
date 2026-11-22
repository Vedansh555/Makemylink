import Link from "next/link";
import { ArrowRight, CalendarCheck, Download, Mail, ShoppingBag } from "lucide-react";
import { getDemoProfile } from "@/lib/demo";
import { GOALS, previewFor, type Goal } from "@/lib/templates";
import { PhoneFrame } from "./PhoneFrame";

const ICON: Record<Goal, typeof Mail> = { booking: CalendarCheck, products: ShoppingBag, email: Mail, import: Download };
// A soft colour behind each phone, in the same spirit as the hero phones.
// Each preview wears a light, airy glass look so the cards feel fresh and consistent.
const LOOK: Record<Exclude<Goal, "import">, string> = { booking: "atelier", products: "peach-fuzz", email: "mint-glass" };
// Who appears on each card. Get booked and Grow my email list keep their original people; the products card shows Chloe Bennett.
const WHO: Record<Exclude<Goal, "import">, string> = { booking: "", products: "2", email: "" };
const GLOW: Record<Goal, string> = { booking: "#6d7fb8", products: "#ff5fb0", email: "#7ccfb2", import: "#ff5b37" };

/** The four ways to start, each with a preview of the page you would get. Used on the home page and on /start. */
export function GoalCards({ handle }: { handle?: string }) {
  const q = handle ? `&handle=${encodeURIComponent(handle)}` : "";
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {GOALS.map((g) => {
        const Icon = ICON[g.id];
        // The import card shows a finished example page, since it starts from the person's own.
        const preview = g.id === "import" ? getDemoProfile("kai")! : { ...previewFor(g.id, WHO[g.id], LOOK[g.id]), theme: LOOK[g.id] };
        return (
          <div
            key={g.id}
            className="group relative flex flex-col overflow-hidden rounded-[28px] border border-fg/10 bg-fg/[0.04] p-6 transition hover:border-fg/30 hover:bg-fg/[0.06] sm:min-h-[320px] sm:flex-row sm:p-8"
          >
            {/* One link covers the whole card. It sits beside the preview phone, not around it, so links never nest. */}
            <Link
              href={g.id === "import" ? `/create?goal=import${q}` : `/start/style?goal=${g.id}${q}`}
              aria-label={`${g.title}: ${g.blurb}`}
              className="absolute inset-0 z-20 rounded-[28px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff5b37]"
            />
            <div className="relative z-10 flex flex-col sm:max-w-[54%]">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#ff5b37] text-[#111]">
                  <Icon className="h-5 w-5" />
                </span>
                
              </div>
              <h3 className="mt-5 font-display text-[clamp(28px,3vw,36px)] leading-[1.02]">{g.title}</h3>
              <p className="mt-2.5 text-[14px] leading-relaxed text-fg/60">{g.blurb}</p>
              <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-fg/40">{g.who}</p>
              <span className="mt-5 inline-flex items-center gap-1.5 py-1 text-[13px] font-semibold sm:mt-auto sm:pt-5">
                Start here <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </span>
            </div>

            <div className="pointer-events-none relative mt-4 flex h-[262px] items-start justify-center overflow-hidden pt-7 sm:pt-0 sm:absolute sm:-bottom-24 sm:right-7 sm:mt-0 sm:block sm:h-auto sm:overflow-visible">
              <div className="absolute -inset-x-8 inset-y-12 -z-10 hidden rounded-full opacity-45 blur-3xl sm:block" style={{ background: GLOW[g.id] }} />
              <div className="origin-bottom transition-transform duration-500 group-active:-translate-y-2 sm:-rotate-3 sm:group-hover:-translate-y-2 sm:group-hover:rotate-0">
                <div className="max-sm:[animation:phonedrift_5s_ease-in-out_infinite] motion-reduce:[animation:none]">
                  <PhoneFrame interactive={false} profile={preview} scale={0.46} compactShadow lazy />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
