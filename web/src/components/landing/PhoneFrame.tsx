"use client";

import { useEffect, useRef, useState } from "react";
import type { Profile } from "@/lib/types";
import type { PlanId } from "@/lib/plans";
import { BioPage } from "../bio/BioPage";

const W = 390;
const H = 800;

/** A phone mockup that renders a real, live bio page at a reduced scale. */
export function PhoneFrame({ profile, scale = 0.62, className = "", plan, interactive = true, compactShadow = false, lazy = false }: { profile: Profile; scale?: number; className?: string; plan?: PlanId; interactive?: boolean; compactShadow?: boolean; lazy?: boolean }) {
  // Lower phones on the home page draw their page only when scrolled near, so the first load stays light.
  const box = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(!lazy);
  useEffect(() => {
    if (shown || !box.current) return;
    const io = new IntersectionObserver((e) => e.some((x) => x.isIntersecting) && setShown(true), { rootMargin: "600px" });
    io.observe(box.current);
    return () => io.disconnect();
  }, [shown]);
  // Inside a box that crops its contents (the goal cards on phones) a big soft shadow gets cut into a grey rectangle,
  // so there it stays small and tight. From the sm breakpoint up the box does not crop and the full shadow returns.
  const shadow = compactShadow
    ? "shadow-[0_18px_30px_-18px_rgba(0,0,0,.5),inset_0_0_0_1px_rgba(255,255,255,.08)] sm:shadow-[0_40px_120px_-30px_rgba(0,0,0,.8),inset_0_0_0_1px_rgba(255,255,255,.08)]"
    : "shadow-[0_40px_120px_-30px_rgba(0,0,0,.8),inset_0_0_0_1px_rgba(255,255,255,.08)]";
  return (
    <div ref={box} aria-hidden={interactive ? undefined : true} className={`relative shrink-0 ${interactive ? "" : "pointer-events-none select-none"} ${className}`} style={{ width: W * scale, height: H * scale }}>
      <div
        className={`absolute left-0 top-0 origin-top-left overflow-hidden rounded-[56px] border-[11px] border-[#16161a] bg-[#16161a] ${shadow}`}
        style={{ width: W, height: H, transform: `scale(${scale})` }}
      >
        <div className="absolute left-1/2 top-3 z-30 h-[26px] w-[110px] -translate-x-1/2 rounded-full bg-black" />
        <div className="no-scrollbar h-full w-full overflow-y-auto overflow-x-hidden rounded-[45px]">
          {shown ? <BioPage profile={profile} embedded plan={plan} /> : <div className="h-full w-full" style={{ background: "#ececef" }} />}
        </div>
      </div>
    </div>
  );
}
