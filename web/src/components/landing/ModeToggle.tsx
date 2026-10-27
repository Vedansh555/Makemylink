"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type Mode = "light" | "dark";

function currentMode(): Mode {
  const set = document.documentElement.dataset.theme;
  if (set === "light" || set === "dark") return set;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

/** Switches the site between light and dark, and remembers the choice. */
export function ModeToggle() {
  const [mode, setMode] = useState<Mode | null>(null);
  useEffect(() => setMode(currentMode()), []);

  function toggle() {
    const next: Mode = currentMode() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("linkss:mode", next);
    } catch {}
    setMode(next);
  }

  return (
    <button
      onClick={toggle}
      aria-label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={mode === "dark" ? "Light mode" : "Dark mode"}
      className="grid h-9 w-9 place-items-center rounded-lg text-fg/70 transition hover:bg-fg/10 hover:text-fg"
    >
      {mode === "light" ? <Moon className="h-[18px] w-[18px]" /> : <Sun className="h-[18px] w-[18px]" />}
    </button>
  );
}
