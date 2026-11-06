"use client";

import { useEffect, useRef } from "react";

/**
 * A row that scrolls itself slowly and endlessly, but is a real scrollable
 * element underneath — so the cursor can grab and drag it, or the wheel/trackpad
 * can scroll it, same as any normal horizontal list. Auto-scroll pauses while
 * the visitor is interacting and resumes shortly after they let go.
 */
export function AutoScrollRow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const paused = useRef(false);
  const dragging = useRef(false);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    let raf: number;
    // iPhones round scrollLeft to whole pixels, so adding a fraction to it each frame never moves anything.
    // We keep the exact position ourselves and write it out, which works the same on every device.
    let pos = el.scrollLeft;
    let last = performance.now();
    const SPEED = 0.04; // pixels per millisecond, about 40 a second
    const tick = (now: number) => {
      const dt = Math.min(now - last, 50);
      last = now;
      if (!paused.current) {
        // The list is the real content twice over, so wrapping at the halfway point loops seamlessly.
        // Recomputed every frame and wrapped with modulo so a width that shifts (images, fonts loading)
        // can never push it past the real end and strand it there.
        const half = el.scrollWidth / 2;
        if (half > 0) {
          pos = (pos + SPEED * dt) % half;
          el.scrollLeft = pos;
        }
      } else {
        pos = el.scrollLeft; // follow the visitor while they drag or swipe
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  function resumeSoon() {
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => {
      paused.current = false;
    }, 1800);
  }

  let startX = 0;
  let startScroll = 0;

  function onPointerDown(e: React.PointerEvent) {
    // If user clicked an interactive anchor or button, do not capture or prevent default navigation
    if ((e.target as HTMLElement).closest("a, button")) {
      return;
    }
    const el = ref.current;
    if (!el) return;
    dragging.current = true;
    paused.current = true;
    startX = e.clientX;
    startScroll = el.scrollLeft;
    el.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging.current || !ref.current) return;
    ref.current.scrollLeft = startScroll - (e.clientX - startX);
  }

  function endDrag() {
    dragging.current = false;
    resumeSoon();
  }

  return (
    <div
      ref={ref}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
      onPointerCancel={endDrag}
      onWheel={() => {
        paused.current = true;
        resumeSoon();
      }}
      onTouchStart={() => {
        paused.current = true;
      }}
      onTouchEnd={resumeSoon}
      onTouchCancel={resumeSoon}
      className={`no-scrollbar cursor-grab select-none overflow-x-auto overscroll-x-contain active:cursor-grabbing ${className}`}
    >
      {children}
    </div>
  );
}
