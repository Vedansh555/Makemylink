"use client";

import { useState } from "react";
import { families, familyOrder, themeList, type Family } from "@/lib/themes";
import { ThemeCard } from "./ThemeCard";
import { isFreeTheme, type PlanId } from "@/lib/plans";

/** All themes, filterable by family. */
export function ThemePicker({
  value,
  onChange,
  maxHeight = "max-h-[460px]",
  plan = "pro",
  onLocked,
}: {
  value: string;
  onChange: (id: string) => void;
  maxHeight?: string;
  /** On the free plan only FREE_THEME_IDS can be chosen. */
  plan?: PlanId;
  onLocked?: () => void;
}) {
  const [filter, setFilter] = useState<Family>(familyOrder[0]!);
  const shown = themeList.filter((t) => t.family === filter);
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1">
        {familyOrder.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-[13px] transition ${filter === f ? "bg-fg text-bg" : "text-fg/60 hover:bg-fg/10 hover:text-fg"}`}
          >
            {families[f].label}
          </button>
        ))}
      </div>
      <div className={`grid ${maxHeight} auto-rows-min grid-cols-3 content-start gap-2.5 overflow-y-auto p-1 sm:gap-3 md:grid-cols-4 xl:grid-cols-5`}>
        {shown.map((t) => {
          const locked = plan !== "pro" && !isFreeTheme(t.id);
          return (
            <div key={t.id} className="relative">
              <ThemeCard id={t.id} active={value === t.id} onClick={() => (locked ? onLocked?.() : onChange(t.id))} />
              {locked && <span className="pointer-events-none absolute right-1.5 top-1.5 rounded-full bg-[#ff5b37] px-1.5 py-0.5 text-[9px] font-bold text-[#111]">PRO</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
