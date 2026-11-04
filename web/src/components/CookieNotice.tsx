"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const KEY = "mml_cookie_notice";

/** We set only essential cookies (login and pricing region), so this is a notice with one button, not a consent wall. */
export function CookieNotice() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setShow(true);
    } catch {
      /* storage blocked: skip the notice */
    }
  }, []);
  if (!show) return null;
  return (
    <div role="region" aria-label="Cookie notice" className="fixed bottom-3 left-3 z-[60] flex w-[calc(100%-1.5rem)] max-w-[300px] flex-col gap-3 rounded-2xl border border-fg/10 bg-bg/95 p-4 text-fg shadow-2xl backdrop-blur-xl">
      <p className="flex-1 text-[13px] leading-snug text-fg/70">
        We only use essential cookies (to keep you signed in and to show prices in ₹ or $). No ads, no tracking.{" "}
        <Link href="/cookies" className="text-fg underline">Learn more</Link>
      </p>
      <button
        onClick={() => {
          try {
            localStorage.setItem(KEY, "1");
          } catch {
            /* ignore */
          }
          setShow(false);
        }}
        className="self-start rounded-xl bg-fg px-5 py-2 text-[13px] font-semibold text-bg transition hover:bg-[#ff5b37] hover:text-[#111]"
      >
        Got it
      </button>
    </div>
  );
}
