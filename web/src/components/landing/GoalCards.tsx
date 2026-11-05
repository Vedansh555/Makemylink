import Link from "next/link";
import { ArrowRight, CalendarCheck, Download, Mail, ShoppingBag } from "lucide-react";
import { getDemoProfile } from "@/lib/demo";
import { GOALS, starterFor, type Goal } from "@/lib/templates";
import { PhoneFrame } from "./PhoneFrame";

const ICON: Record<Goal, typeof Mail> = { booking: CalendarCheck, products: ShoppingBag, email: Mail, import: Download };
// A soft colour behind each phone, in the same spirit as the hero phones.
const GLOW: Record<Goal, string> = { booking: "#6d7fb8", products: "#ff5fb0", email: "#7ccfb2", import: "#ff5b37" };

/** The four ways to start, each with a preview of the page you would get. Used on the home page and on /start. */
export function GoalCards({ handle }: { handle?: string }) {
  const q = handle ? `&handle=${encodeURIComponent(handle)}` : "";
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {GOALS.map((g, i) => {
        const Icon = ICON[g.id];
        // The import card shows a finished example page, since it starts from the person's own.
        const preview = g.id === "import" ? getDemoProfile("kai")! : starterFor(g.id);
        return (
          <Link
            key={g.id}
            href={`/create?goal=${g.id}${q}`}
            className="group relative flex min-h-[320px] overflow-hidden rounded-[28px] border border-fg/10 bg-fg/[0.04] p-6 transition hover:border-fg/30 hover:bg-fg/[0.06] sm:p-8"
          >
            <div className="relative z-10 flex max-w-[58%] flex-col sm:max-w-[54%]">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#ff5b37] text-[#111]">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="font-display text-[30px] leading-none text-fg/20">{String(i + 1).padStart(2, "0")}</span>
              </div>
              <h3 className="mt-5 font-display text-[clamp(28px,3vw,36px)] leading-[1.02]">{g.title}</h3>
              <p className="mt-2.5 text-[14px] leading-relaxed text-fg/60">{g.blurb}</p>
              <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-fg/40">{g.who}</p>
              <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-[13px] font-semibold">
                Start here <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </span>
            </div>

            <div className="pointer-events-none absolute -bottom-24 right-3 sm:right-7">
              <div className="absolute -inset-x-8 inset-y-12 -z-10 rounded-full opacity-45 blur-3xl" style={{ background: GLOW[g.id] }} />
              <div className="origin-bottom -rotate-3 transition-transform duration-500 group-hover:-translate-y-2 group-hover:rotate-0">
                <PhoneFrame interactive={false} profile={preview} scale={0.46} />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
