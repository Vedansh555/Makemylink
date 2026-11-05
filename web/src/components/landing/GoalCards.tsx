import Link from "next/link";
import { ArrowRight, CalendarCheck, Mail, ShoppingBag, Download } from "lucide-react";
import { GOALS, type Goal } from "@/lib/templates";

const ICON: Record<Goal, typeof Mail> = { booking: CalendarCheck, products: ShoppingBag, email: Mail, import: Download };

/** The four ways to start. Used on the home page and on /start. */
export function GoalCards({ handle }: { handle?: string }) {
  const q = handle ? `&handle=${encodeURIComponent(handle)}` : "";
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {GOALS.map((g, i) => {
        const Icon = ICON[g.id];
        return (
          <Link
            key={g.id}
            href={`/create?goal=${g.id}${q}`}
            className="group relative flex flex-col rounded-[28px] border border-fg/10 bg-fg/[0.04] p-6 transition hover:border-fg/30 hover:bg-fg/[0.06] sm:p-7"
          >
            <div className="flex items-center justify-between">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#ff5b37] text-[#111]">
                <Icon className="h-5 w-5" />
              </span>
              <span className="font-display text-[34px] leading-none text-fg/20">{String(i + 1).padStart(2, "0")}</span>
            </div>
            <h3 className="mt-5 font-display text-[30px] leading-[1.05]">{g.title}</h3>
            <p className="mt-2 flex-1 text-[15px] leading-relaxed text-fg/60">{g.blurb}</p>
            <p className="mt-4 text-[12px] uppercase tracking-[0.18em] text-fg/40">{g.who}</p>
            <span className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-semibold">
              Start here <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        );
      })}
    </div>
  );
}
