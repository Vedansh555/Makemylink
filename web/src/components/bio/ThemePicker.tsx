"use client";

import { useState } from "react";
import { families, familyOrder, themeList, type Family } from "@/lib/themes";
import { ThemeCard } from "./ThemeCard";

/** All themes, filterable by family. */
export function ThemePicker({
  value,
  onChange,
  maxHeight = "max-h-[460px]",
}: {
  value: string;
  onChange: (id: string) => void;
  maxHeight?: string;
}) {
  const [filter, setFilter] = useState<Family | "all">("all");
  const shown = filter === "all" ? themeList : themeList.filter((t) => t.family === filter);
  return (
    <div className="flex flex-col gap-4">
      <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1">
        {(["all", ...familyOrder] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-[13px] transition ${filter === f ? "bg-fg text-bg" : "text-fg/60 hover:bg-fg/10 hover:text-fg"}`}
          >
            {f === "all" ? "All" : families[f].label}
          </button>
        ))}
      </div>
      <div className={`grid ${maxHeight} grid-cols-2 gap-3 overflow-y-auto p-1 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5`}>
        {shown.map((t) => (
          <ThemeCard key={t.id} id={t.id} active={value === t.id} onClick={() => onChange(t.id)} />
        ))}
      </div>
    </div>
  );
}
