"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

const KEY = "mml_cookie_notice";

/** We set only essential cookies (login and pricing region), so this is a small notice with one button, not a consent wall. */
export function CookieNotice() {
  const [show, setShow] = useState(false);
  // The editor has a floating Edit / Preview / Publish bar at the bottom of phones; sit above it there.
  const path = usePathname();
  // Pages with a bar fixed to the bottom (editor, booking page) mark it with data-bottom-bar; the notice sits just above it.
  const [lift, setLift] = useState(0);
  useEffect(() => {
    if (!show) return;
    const measure = () => {
      const bar = document.querySelector<HTMLElement>("[data-bottom-bar]");
      const visible = !!bar && bar.getBoundingClientRect().height > 0 && getComputedStyle(bar).display !== "none";
      setLift(visible ? window.innerHeight - bar!.getBoundingClientRect().top + 10 : 0);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [show, path]);
  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) {
        // A short delay so it doesn't fight the page for attention on first paint.
        const t = setTimeout(() => setShow(true), 1200);
        return () => clearTimeout(t);
      }
    } catch {
      /* storage blocked: skip the notice */
    }
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
    setShow(false);
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          role="region"
          aria-label="Cookie notice"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.3, ease: [0.2, 0.7, 0.2, 1] }}
          style={lift ? { bottom: lift } : undefined}
          className={`fixed bottom-4 right-4 z-[60] flex max-w-[calc(100%-2rem)] items-center gap-3 rounded-full border border-fg/10 bg-bg/95 py-2 pl-4 pr-2 text-[12px] text-fg shadow-[0_8px_28px_-10px_rgba(0,0,0,.35)] backdrop-blur-xl`}
        >
          <span className="text-fg/65">
            Essential cookies only.{" "}
            <Link href="/cookies" className="underline underline-offset-2 hover:text-fg">
              Details
            </Link>
          </span>
          <button onClick={dismiss} className="rounded-full bg-fg px-4 py-1.5 text-[12px] font-semibold text-bg transition hover:bg-[#ff5b37] hover:text-[#111]">
            OK
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
