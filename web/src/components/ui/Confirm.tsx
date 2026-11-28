"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Ask = { message: string; confirmLabel?: string; danger?: boolean };

/**
 * A confirm box in Showz's own style, instead of the browser's grey pop-up.
 * const [confirmUi, ask] = useConfirm();  ...  if (!(await ask({ message: "Delete?" }))) return;  ...  render {confirmUi}
 */
export function useConfirm(): [React.ReactNode, (a: Ask) => Promise<boolean>] {
  const [open, setOpen] = useState<Ask | null>(null);
  const done = useRef<(v: boolean) => void>(() => {});
  const ask = useCallback((a: Ask) => new Promise<boolean>((resolve) => {
    done.current = resolve;
    setOpen(a);
  }), []);
  const close = useCallback((v: boolean) => {
    setOpen(null);
    done.current(v);
  }, []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  const ui = open ? (
    <div role="dialog" aria-modal="true" onClick={() => close(false)} className="fixed inset-0 z-[80] grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl border border-fg/10 bg-bg p-7 text-fg shadow-2xl">
        <h3 className="font-display text-[30px] italic leading-none">Are you sure?</h3>
        <p className="mt-3 text-[14px] leading-relaxed text-fg/65">{open.message}</p>
        <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
          <button autoFocus onClick={() => close(false)} className="min-h-[46px] rounded-xl border border-fg/20 px-5 text-[14px] font-medium transition hover:border-fg/50">
            Keep it
          </button>
          <button onClick={() => close(true)} className={`min-h-[46px] rounded-xl px-5 text-[14px] font-semibold transition ${open.danger ? "bg-[#d93a2b] text-white hover:brightness-110" : "bg-fg text-bg hover:opacity-90"}`}>
            {open.confirmLabel ?? "Yes, continue"}
          </button>
        </div>
      </div>
    </div>
  ) : null;
  return [ui, ask];
}

/** Shows a message in the editor's notice bar from anywhere (used by small parts that have no access to it). */
export const showNotice = (text: string) => window.dispatchEvent(new CustomEvent("showz-notice", { detail: text }));
