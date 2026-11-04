"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Cookie } from "lucide-react";

const KEY = "mml_cookie_notice";

/** We set only essential cookies (login and pricing region), so this is a notice with one button, not a consent wall. */
export function CookieNotice() {
  const [show, setShow] = useState(false);
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
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }}
          className="fixed bottom-4 right-4 z-[60] w-[calc(100%-2rem)] max-w-[300px] rounded-2xl border border-fg/10 bg-bg/95 p-4 text-fg shadow-[0_12px_40px_-12px_rgba(0,0,0,.35)] backdrop-blur-xl"
        >
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#ff5b37]/15 text-[#ff5b37]">
              <Cookie className="h-4 w-4" />
            </span>
            <p className="text-[14px] font-semibold">Just the essential cookies</p>
          </div>
          <p className="mt-2.5 text-[12.5px] leading-relaxed text-fg/60">
            We only use cookies to keep you signed in and to show prices in ₹ or $. No ads, no tracking.
          </p>
          <div className="mt-3.5 flex items-center gap-3">
            <button onClick={dismiss} className="rounded-lg bg-fg px-4 py-2 text-[12.5px] font-semibold text-bg transition hover:bg-[#ff5b37] hover:text-[#111]">
              Got it
            </button>
            <Link href="/cookies" className="text-[12.5px] text-fg/60 underline underline-offset-4 hover:text-fg">
              Learn more
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
