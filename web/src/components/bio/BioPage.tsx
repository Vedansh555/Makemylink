"use client";

import { SITE_URL, SITE_HOST } from "@/lib/site";
import Link from "next/link";
import { useState } from "react";
import { motion } from "motion/react";
import { ArrowUpRight, ChevronDown, MapPin, Play, QrCode, X } from "lucide-react";
import type { BioLink, Profile } from "@/lib/types";
import { linkIsLive, type PlanId } from "@/lib/plans";
import { BookingModal, bookingPrice } from "./BookingModal";
import { BookingTile, useNextFree } from "./BookingTile";
import { WhatsAppModal, WhatsAppIcon } from "./WhatsAppModal";
import { fontClass, getTheme, readableOn, type ResolvedTheme, type ThemeTokens } from "@/lib/themes";
import { LookArt } from "./LookArt";
import { safeHref } from "@/lib/security";
import { SocialIcon, socialUrl, type SocialKey } from "./SocialIcon";
import { Tilt } from "../ui/Tilt";
import { QRCodeCanvas } from "../ui/QRCodeCanvas";
import { ConsentCheck } from "./ConsentCheck";

const rise = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: 0.06 * i, duration: 0.6, ease: [0.2, 0.7, 0.2, 1] as const } }),
};

function FamilyBackground({ theme }: { theme: ResolvedTheme }) {
  const { def } = theme;
  switch (def.family) {
    case "chrome":
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,color-mix(in_srgb,var(--c2)_30%,transparent),transparent_60%)]" />
          <div className="absolute inset-x-0 top-0 h-[560px] bg-[radial-gradient(ellipse_60%_100%_at_50%_0%,rgba(255,255,255,0.22),transparent_72%)]" />
          <div className="absolute -left-1/3 top-0 h-full w-1/2 rotate-12 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
          <div className="absolute -right-1/4 top-[30%] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--c1)_22%,transparent),transparent_65%)]" />
        </div>
      );
    case "glass":
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="mesh-blob absolute -left-24 -top-24 h-80 w-80 rounded-full bg-t-accent opacity-60 blur-3xl" />
          <div className="mesh-blob absolute -right-20 top-40 h-96 w-96 rounded-full bg-t-accent2 opacity-60 blur-3xl [animation-delay:-5s]" />
          <div className="mesh-blob absolute -bottom-24 left-10 h-96 w-96 rounded-full bg-t-accent opacity-40 blur-3xl [animation-delay:-10s]" />
        </div>
      );
    case "mono":
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-6 top-24 select-none font-grotesk text-[150px] font-bold uppercase leading-none tracking-tighter text-transparent [-webkit-text-stroke:1px_color-mix(in_srgb,var(--t-fg)_7%,transparent)] [writing-mode:vertical-rl]">
            {def.label.split(" ")[0]}
          </div>
        </div>
      );
    case "pop":
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(var(--t-accent)_1.2px,transparent_1.2px)] opacity-30 [background-size:18px_18px]" />
          {[
            "left-6 top-10 text-t-accent2 text-4xl rotate-12",
            "right-8 top-28 text-t-accent text-3xl -rotate-12",
            "left-10 top-[46%] text-t-accent2 text-2xl",
            "right-6 bottom-40 text-t-accent text-5xl rotate-6",
          ].map((c, i) => (
            <span key={i} className={`absolute [animation:float_5s_ease-in-out_infinite] [-webkit-text-stroke:2px_var(--t-fg)] ${c}`} style={{ animationDelay: `${i * -1.3}s` }}>
              •
            </span>
          ))}
        </div>
      );
    case "gradient":
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="mesh-blob absolute -left-32 -top-32 h-[520px] w-[520px] rounded-full bg-t-accent blur-[90px]" />
          <div className="mesh-blob absolute -right-40 top-60 h-[560px] w-[560px] rounded-full bg-t-accent2 blur-[90px] [animation-delay:-6s]" />
          <div className="mesh-blob absolute -bottom-40 left-0 h-[480px] w-[480px] rounded-full bg-t-accent opacity-70 blur-[90px] [animation-delay:-11s]" />
          <div className="absolute inset-0 bg-t-bg/25" />
        </div>
      );
    case "neon":
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-24 -top-24 h-[400px] w-[400px] rounded-full bg-t-accent opacity-30 blur-[110px]" />
          <div className="absolute -right-28 top-[24%] h-[360px] w-[360px] rounded-full bg-t-accent2 opacity-25 blur-[110px]" />
          <div className="absolute inset-x-0 bottom-0 h-[44%] [background:linear-gradient(color-mix(in_srgb,var(--t-accent)_40%,transparent)_1px,transparent_1px),linear-gradient(90deg,color-mix(in_srgb,var(--t-accent)_40%,transparent)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:linear-gradient(to_top,#000,transparent)] [transform-origin:bottom] [transform:perspective(420px)_rotateX(56deg)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_60%,color-mix(in_srgb,var(--t-bg)_70%,transparent))]" />
        </div>
      );
    case "minimal":
      return null;
    case "brutalist":
    case "duotone":
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.07]">
          <div className="absolute inset-0 bg-[linear-gradient(var(--t-fg)_2px,transparent_2px),linear-gradient(90deg,var(--t-fg)_2px,transparent_2px)] [background-size:28px_28px]" />
        </div>
      );
    case "luxury":
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-t-accent/10 to-transparent" />
          <div className="absolute -right-20 top-32 h-64 w-64 rounded-full bg-t-accent/5 blur-3xl" />
        </div>
      );
    case "ticket":
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(var(--t-fg)_1.4px,transparent_1.4px)] [background-size:16px_16px]" />
        </div>
      );
    case "terminal":
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,color-mix(in_srgb,var(--t-accent)_6%,transparent)_0px,transparent_1px,transparent_3px)]" />
        </div>
      );
    case "deco":
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-t-accent/10 blur-3xl" />
          <div className="absolute -right-20 bottom-20 h-72 w-72 rounded-full bg-t-accent/10 blur-3xl" />
        </div>
      );
    case "organic":
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="mesh-blob absolute -left-16 -top-16 h-72 w-72 rounded-[40%_60%_60%_40%/60%_40%_60%_40%] bg-t-accent opacity-25 blur-2xl" />
          <div className="mesh-blob absolute -right-16 top-52 h-80 w-80 rounded-[60%_40%_40%_60%/40%_60%_40%_60%] bg-t-accent2 opacity-20 blur-2xl [animation-delay:-6s]" />
        </div>
      );
    case "handwritten":
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.06]">
          <div className="absolute inset-0 bg-[linear-gradient(var(--t-fg)_1px,transparent_1px)] [background-size:100%_32px]" />
        </div>
      );
    case "arch":
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 -top-20 h-96 w-96 -translate-x-1/2 rounded-full border border-t-accent/20 bg-t-accent/5 opacity-60 blur-sm" />
          <div className="absolute -bottom-16 left-1/2 h-72 w-[480px] -translate-x-1/2 rounded-t-full border-t border-t-accent/15 bg-t-accent/5" />
        </div>
      );
    case "bakes":
      return (
        <>
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/50 via-transparent to-transparent" />
          </div>
        </>
      );
    case "clay":
      return (
        <>
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-t-accent opacity-15 blur-3xl" />
            <div className="absolute -left-20 bottom-32 h-80 w-80 rounded-full bg-t-accent2 opacity-20 blur-3xl" />
          </div>
        </>
      );
    case "lavender":
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-t-accent/10 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_color-mix(in_srgb,var(--t-accent)_8%,transparent)_0%,_transparent_60%)]" />
        </div>
      );
    case "glasshouse":
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="gh-orb absolute -left-24 top-24 h-72 w-72 rounded-full bg-t-accent2 opacity-70 blur-[56px]" />
          <div className="gh-orb absolute -right-28 top-[42%] h-72 w-72 rounded-full bg-t-accent opacity-40 blur-[60px] [animation-delay:-8s]" />
          <div className="gh-orb absolute -left-20 bottom-24 h-72 w-72 rounded-full bg-[color-mix(in_srgb,var(--t-accent2)_45%,#fff6a8)] opacity-70 blur-[56px] [animation-delay:-15s]" />
        </div>
      );
    case "mochi":
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-24 -top-16 h-72 w-72 rounded-full bg-t-accent2/50 blur-[56px]" />
          <div className="absolute -right-28 top-[38%] h-72 w-72 rounded-full bg-t-accent/25 blur-[60px]" />
          <div className="absolute -left-24 bottom-20 h-72 w-72 rounded-full bg-t-accent2/40 blur-[56px]" />
        </div>
      );
    case "editorial":
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-24 -top-24 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--t-accent)_16%,transparent),transparent_65%)]" />
          <div className="absolute -left-32 top-[55%] h-[480px] w-[480px] rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--t-accent2)_12%,transparent),transparent_65%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_70%,color-mix(in_srgb,var(--t-fg)_5%,transparent))]" />
        </div>
      );
    case "studio":
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_50%_0%,color-mix(in_srgb,var(--t-fg)_14%,transparent),transparent)]" />
          <div className="absolute inset-x-0 bottom-0 h-72 bg-[linear-gradient(to_top,color-mix(in_srgb,var(--t-accent)_18%,transparent),transparent)]" />
        </div>
      );
    case "sticker":
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(color-mix(in_srgb,var(--t-fg)_14%,transparent)_1px,transparent_1px)] [background-size:16px_16px]" />
          {[
            "left-5 top-16 h-14 w-14 bg-t-accent rotate-12",
            "right-6 top-40 h-10 w-10 bg-t-accent2 -rotate-6",
            "left-8 top-[52%] h-8 w-8 bg-t-accent2",
            "right-7 bottom-44 h-16 w-16 bg-t-accent -rotate-12",
          ].map((c, i) => (
            <span key={i} className={`absolute rounded-[38%] border-2 border-t-fg shadow-[3px_3px_0_var(--t-fg)] [animation:float_6s_ease-in-out_infinite] ${c}`} style={{ animationDelay: `${i * -1.7}s` }} />
          ))}
        </div>
      );
    case "poster":
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-16 -top-16 h-[360px] w-[360px] rounded-full bg-[radial-gradient(var(--t-accent)_2px,transparent_2.5px)] opacity-40 [background-size:14px_14px] [mask-image:radial-gradient(circle,#000,transparent_70%)]" />
          <div className="absolute inset-x-0 top-0 h-2 bg-t-accent" />
          <div className="absolute inset-x-0 bottom-0 h-2 bg-t-accent2" />
        </div>
      );
    case "vinyl":
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full opacity-[0.18] [background:repeating-radial-gradient(circle,var(--t-fg)_0_1px,transparent_1px_7px)]" />
          <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-t-accent opacity-30 blur-2xl" />
        </div>
      );
    case "ribbon":
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-20 top-10 h-12 w-[140%] -rotate-6 bg-t-accent opacity-90 shadow-[0_14px_30px_-12px_rgba(0,0,0,0.5)]" />
          <div className="absolute -left-20 top-[88px] h-3 w-[140%] -rotate-6 bg-t-accent2 opacity-80" />
        </div>
      );
    case "frame":
      return (
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-3 border border-t-fg/40" />
          <div className="absolute inset-[18px] border border-t-fg/20" />
          {["left-3 top-3", "right-3 top-3", "left-3 bottom-3", "right-3 bottom-3"].map((c) => (
            <span key={c} className={`absolute h-3 w-3 bg-t-accent ${c}`} />
          ))}
        </div>
      );
    case "badge":
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {[
            "-left-10 top-20 h-36 w-36",
            "-right-14 top-[45%] h-44 w-44",
            "left-10 -bottom-16 h-40 w-40",
          ].map((c, i) => (
            <span key={i} className={`absolute rounded-full border-[6px] border-t-accent/40 ${c}`}>
              <span className="absolute inset-4 rounded-full border-2 border-dashed border-t-accent2/50" />
            </span>
          ))}
        </div>
      );
    case "split":
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[260px] bg-[linear-gradient(to_bottom,color-mix(in_srgb,var(--t-accent)_26%,transparent),transparent)]" />
          <div className="absolute inset-x-0 top-[250px] h-px bg-t-fg/20" />
        </div>
      );
    case "zine":
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(color-mix(in_srgb,var(--t-fg)_10%,transparent)_1px,transparent_1px)] [background-size:12px_12px]" />
          <span className="absolute left-6 top-6 h-5 w-20 -rotate-6 bg-t-accent/70" />
          <span className="absolute right-8 top-10 h-5 w-16 rotate-12 bg-t-accent2/70" />
          <span className="absolute -right-4 bottom-40 h-5 w-24 -rotate-12 bg-t-accent/60" />
        </div>
      );
    case "stamp":
      return (
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-2 rounded-[14px] border-[3px] border-dashed border-t-fg/40" />
          <div className="absolute -right-10 top-24 h-32 w-32 rotate-12 rounded-full border-[4px] border-t-accent/50" />
        </div>
      );
    case "carnival":
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-5 [background:repeating-linear-gradient(90deg,var(--t-accent)_0_22px,var(--t-accent2)_22px_44px)]" />
          <div className="absolute inset-x-0 top-5 h-3 opacity-80 [background:repeating-linear-gradient(90deg,var(--t-accent)_0_22px,var(--t-accent2)_22px_44px)] [mask-image:radial-gradient(circle_at_11px_0,#000_10px,transparent_11px)] [mask-size:22px_12px]" />
        </div>
      );
    case "catalog":
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 [background:linear-gradient(color-mix(in_srgb,var(--t-fg)_8%,transparent)_1px,transparent_1px),linear-gradient(90deg,color-mix(in_srgb,var(--t-fg)_8%,transparent)_1px,transparent_1px)] [background-size:28px_28px]" />
          <div className="absolute inset-x-0 top-0 h-52 bg-[linear-gradient(to_bottom,color-mix(in_srgb,var(--t-accent)_14%,transparent),transparent)]" />
        </div>
      );
    default:
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_color-mix(in_srgb,var(--t-accent)_8%,transparent),transparent_70%)]" />
        </div>
      );
  }
}

/** A seamless noise texture drawn by the browser (no image files). `alpha` shapes it: paper grain, marble veins, concrete, brushed metal. */
function noise(opts: { freq: string; octaves: number; type?: "fractalNoise" | "turbulence"; alpha: string; rgb: number; size: number }) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${opts.size}" height="${opts.size}"><filter id="n" x="0" y="0" width="100%" height="100%"><feTurbulence type="${opts.type ?? "fractalNoise"}" baseFrequency="${opts.freq}" numOctaves="${opts.octaves}" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 ${opts.rgb} 0 0 0 0 ${opts.rgb} 0 0 0 0 ${opts.rgb} 0 0 0 1 0"/><feComponentTransfer><feFuncA type="table" tableValues="${opts.alpha}"/></feComponentTransfer></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

type Surface = "paper" | "marble" | "brushed" | "concrete" | "grain";

/** Which real-world surface suits which design family. Families not listed stay clean on purpose. */
const SURFACE: Partial<Record<string, Surface>> = {
  editorial: "paper", organic: "paper", deco: "paper", frame: "paper", stamp: "paper", badge: "paper", poster: "paper", ribbon: "paper", vinyl: "grain",
  luxury: "grain", chrome: "brushed", studio: "grain", brutalist: "grain",
  gradient: "grain", glass: "grain", duotone: "grain", neon: "grain",
};

const isLight = (hex: string) => {
  const h = hex.replace("#", "");
  const f = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6);
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16));
  return 0.299 * r! + 0.587 * g! + 0.114 * b! > 140;
};

function surfaceStyle(kind: Surface, light: boolean): React.CSSProperties {
  const rgb = light ? 0.12 : 0.92; // dark specks on light pages, pale specks on dark ones
  switch (kind) {
    case "paper":
      return { backgroundImage: noise({ freq: "0.85", octaves: 3, alpha: "0 0 0.25 0.5 0.35", rgb, size: 240 }), opacity: light ? 0.3 : 0.2 };
    case "grain":
      return { backgroundImage: noise({ freq: "1.1", octaves: 2, alpha: "0 0 0.2 0.45", rgb, size: 200 }), opacity: light ? 0.28 : 0.18 };
    case "concrete":
      return { backgroundImage: noise({ freq: "0.04", octaves: 5, alpha: "0 0.18 0.06 0.32 0.12", rgb, size: 420 }), opacity: light ? 0.5 : 0.3 };
    case "brushed":
      return { backgroundImage: noise({ freq: "0.002 0.55", octaves: 3, alpha: "0 0.15 0.35 0.2 0.4", rgb, size: 400 }), opacity: light ? 0.4 : 0.3 };
    case "marble":
      return { backgroundImage: noise({ freq: "0.007 0.02", octaves: 5, type: "turbulence", alpha: "0 0 0 0 0.9 0 0 0 0 0", rgb, size: 520 }), opacity: light ? 0.28 : 0.2 };
  }
}

/** The page background: the family's own backdrop, plus a real surface texture only where it suits the design. */
// Graphic, flat families stay flat on purpose. Every other family gets a soft key light from above and a vignette below.
const FLAT = new Set(["glasshouse", "mochi", "mono", "brutalist", "terminal", "catalog", "zine", "stamp", "ticket", "minimal", "pop", "sticker"]);

export function Background({ theme }: { theme: ResolvedTheme }) {
  const kind = SURFACE[theme.def.family];
  const light = isLight(theme.def.bg);
  return (
    <>
      <FamilyBackground theme={theme} />
      {!FLAT.has(theme.def.family) && (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[540px]" style={{ background: light ? "radial-gradient(ellipse 85% 75% at 50% 0%, rgba(255,255,255,0.7), transparent 72%)" : "radial-gradient(ellipse 85% 75% at 50% 0%, rgba(255,255,255,0.11), transparent 72%)" }} />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[420px]" style={{ background: light ? "linear-gradient(to top, color-mix(in srgb, var(--t-fg) 8%, transparent), transparent)" : "linear-gradient(to top, rgba(0,0,0,0.38), transparent)" }} />
        </>
      )}
      {kind && <div className="pointer-events-none absolute inset-0" style={surfaceStyle(kind, isLight(theme.def.bg))} />}
    </>
  );
}

function Avatar({ profile, t, font }: { profile: Profile; t: ThemeTokens; font: string }) {
  const initials = profile.name
    .replace(/[^\p{L}\s]/gu, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
  if (profile.avatar) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={profile.avatar} alt={profile.name} className={`${t.avatar} object-cover`} />;
  }
  return <div className={`${t.avatar} ${t.monogram} ${font} grid place-items-center text-[28px]`}>{initials || "•"}</div>;
}

function Subscribe({ t, handle, live }: { t: ThemeTokens; handle: string; live: boolean }) {
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const [agree, setAgree] = useState(false);
  const [typed, setTyped] = useState(false);
  if (done) return <p className={t.bio}>You&apos;re on the list ✓</p>;
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        const email = new FormData(e.currentTarget).get("email") as string;
        if (!live) return setDone(true); // editor preview: nothing is stored
        const res = await fetch("/api/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ handle, email, consent: agree }) });
        if (res.ok) setDone(true);
        else setErr((await res.json().catch(() => ({}))).error ?? "Something went wrong");
      }}
    >
      <div className="flex items-center gap-2">
        <input name="email" type="email" required placeholder="your@email.com" className={t.input} aria-label="Email address" onChange={(e) => setTyped(!!e.target.value)} />
        <button className={`${t.button} shrink-0`}>Join</button>
      </div>
      {live && typed && <ConsentCheck checked={agree} onChange={setAgree} className={t.bio} />}
      {err && <p className={t.bio}>{err}</p>}
    </form>
  );
}

function safeUrl(input?: string): string {
  return safeHref(input);
}

/** A heading on a real page; plain text inside the small phone previews, so the site's own pages keep one main heading. */
function Heading({ level, plain, className, children }: { level: 1 | 2; plain: boolean; className: string; children: React.ReactNode }) {
  if (plain) return <div className={className}>{children}</div>;
  return level === 1 ? <h1 className={className}>{children}</h1> : <h2 className={className}>{children}</h2>;
}

/** "Verified by Showz": the owner proved a work or college email. */
function VerifiedTick({ label }: { label: string }) {
  return (
    <span title={`Verified by Showz · ${label}`} aria-label={`Verified by Showz, ${label}`} className="ml-1.5 inline-grid h-[0.8em] w-[0.8em] translate-y-[-0.05em] place-items-center rounded-full bg-t-accent align-middle text-t-on-accent">
      <svg viewBox="0 0 24 24" className="h-[70%] w-[70%]" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12.5l4.2 4.2L19 7" /></svg>
    </span>
  );
}

/** "Book · next: Tue 4 pm" under a booking card, in the theme's own type. */
function NextFreeLine({ link, handle, live }: { link: BioLink; handle: string; live: boolean }) {
  const next = useNextFree(link, handle, live);
  return <span className="mt-1 block text-[12px] font-semibold normal-case tracking-normal">{next ? `Book · next: ${next.short}` : "Book a time"}</span>;
}

export function BioPage({ profile, embedded = false, plan = "pro", live = false, seeAll, verified }: { profile: Profile; embedded?: boolean; plan?: PlanId; live?: boolean; seeAll?: string; verified?: string | null }) {
  const [qrOpen, setQrOpen] = useState(false);
  const [booking, setBooking] = useState<BioLink | null>(null);
  const [chat, setChat] = useState<BioLink | null>(null);
  const showBadge = plan !== "pro" || !profile.hideBadge;
  const visibleLinks = profile.links.filter((l) => linkIsLive(l));
  const track = (id: string) => {
    if (!live) return;
    try {
      navigator.sendBeacon("/api/track", new Blob([JSON.stringify({ handle: profile.handle, target: id })], { type: "application/json" }));
    } catch {}
  };
  const theme = getTheme(profile.theme);
  const t = theme.tokens;
  const family = theme.def.family;
  const nameFont = profile.fontOverride ? fontClass[profile.fontOverride as keyof typeof fontClass] ?? theme.nameFont : theme.nameFont;
  const socials = (Object.entries(profile.socials) as [SocialKey, string | undefined][]).filter(([, v]) => v);
  const { centered, numbered } = theme.family;
  const soft = family === "glasshouse" || family === "mochi";
  let i = 0;

  return (
    <div
      // Phone mockups are for looking at: scroll and hover work, but links, buttons and forms do nothing.
      onClickCapture={embedded ? (e) => { if ((e.target as HTMLElement).closest("a, button, input, textarea")) e.preventDefault(); } : undefined}
      onSubmitCapture={embedded ? (e) => e.preventDefault() : undefined}
      style={profile.accentOverride ? { ...theme.style, "--t-accent": profile.accentOverride, "--t-on-accent": readableOn(profile.accentOverride, theme.def.onAccent) } as React.CSSProperties : theme.style}
      className={`relative isolate overflow-hidden ${family === "mono" ? "grain" : ""} ${t.root} ${embedded ? "min-h-full" : "min-h-screen"}`}
    >
      <Background theme={theme} />

      <motion.main
        initial="hidden"
        animate="show"
        className={`relative z-10 mx-auto flex w-full max-w-[480px] flex-col gap-9 px-5 pb-10 pt-12`}
      >
        {/* Cover photo — a real photo behind the header, the one thing every real creator page has that a generated theme can't fake. */}
        {profile.coverImage && (
          <div className="-mx-5 -mt-12 h-44 w-[calc(100%+2.5rem)] overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={profile.coverImage} alt="" className="h-full w-full object-cover" />
          </div>
        )}

        {/* Header */}
        <motion.header variants={rise} custom={i++} className={`flex flex-col gap-4 ${centered ? "items-center text-center" : ""}`}>
          {family === "editorial" && (
            <div className={`flex w-full items-center justify-between border-b border-t-fg/80 pb-2 ${t.meta}`}>
              <span>Nº 01</span>
              <span>The {profile.handle} edit</span>
              <span>{new Date().getFullYear()}</span>
            </div>
          )}
          {family === "glasshouse" && profile.avatar ? (
            // A big front-facing portrait with the name on a pane of glass across it.
            <div className="relative aspect-[4/4.4] w-full overflow-hidden rounded-[32px] shadow-[0_30px_50px_-26px_var(--t-accent)] ring-1 ring-white/50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={profile.avatar} alt={profile.name} className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: "50% 28%" }} />
              <div className="absolute inset-x-3 bottom-3 rounded-[22px] border border-white/40 bg-t-bg/60 px-4 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] backdrop-blur-xl">
                <Heading level={1} plain={embedded} className={`${t.name} ${nameFont}`}>{profile.name}{verified && <VerifiedTick label={verified} />}</Heading>
                <p className={`${t.meta} mt-1.5`}>@{profile.handle}{profile.location ? ` in ${profile.location}` : ""}</p>
                {verified && <p className={`${t.meta} mt-1`}>Verified by Showz · {verified}</p>}
              </div>
            </div>
          ) : (
            <>
              <div className={`flex gap-5 ${centered ? "flex-col items-center" : "items-end"}`}>
                <Avatar profile={profile} t={t} font={nameFont} />
                {!centered && profile.location && (
                  <span className={`${t.meta} mb-1 flex items-center gap-1`}>
                    <MapPin className="h-3 w-3" /> {profile.location}
                  </span>
                )}
              </div>
              <Heading level={1} plain={embedded} className={`${t.name} ${nameFont}`}>{profile.name}{verified && <VerifiedTick label={verified} />}</Heading>
              <div className={`${t.meta} flex items-center gap-2`}>
                <span>@{profile.handle}</span>
                {verified && (
                  <>
                    <span>·</span>
                    <span>Verified · {verified}</span>
                  </>
                )}
                {centered && profile.location && (
                  <>
                    <span>·</span>
                    <span>{profile.location}</span>
                  </>
                )}
              </div>
            </>
          )}
          {profile.bio && <p className={`${t.bio} max-w-[36ch]`}>{profile.bio}</p>}
          {socials.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {socials.map(([k, v]) => (
                <a key={k} href={socialUrl[k](v!)} target="_blank" rel="noreferrer" className={t.social} aria-label={k}>
                  <SocialIcon name={k} className="h-[18px] w-[18px]" />
                </a>
              ))}
            </div>
          )}
        </motion.header>

        {/* Links — plain ones in order, folder links grouped under a collapsible heading. */}
        {visibleLinks.length > 0 && (
          <motion.section variants={rise} custom={i++} className={`grid grid-cols-2 ${family === "editorial" ? "" : "gap-3"}`}>
            {(() => {
              let idx = 0;
              const renderLink = (l: BioLink) => {
                const n = idx++;
                // With a picture: it sits at the left and the title beside it (Linktree style). On half and tall cards it goes on top instead.
                const stack = !!l.image && (l.size === "1x1" || l.size === "2x2");
                const arrow = <ArrowUpRight className="h-4 w-4 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />;
                const thumb = l.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={l.image} alt="" loading="lazy" className={stack ? "aspect-[16/9] w-full rounded-xl object-cover" : "h-10 w-10 sm:h-11 sm:w-11 shrink-0 rounded-xl object-cover shadow-sm ring-1 ring-black/5"} />
                ) : null;
                const inner = stack ? (
                  <span className="flex w-full flex-col gap-2.5">
                    {thumb}

                    <span className="flex items-center gap-2">
                      <span className="flex-1 text-left">{l.title}</span>
                      {arrow}
                    </span>
                  </span>
                ) : (
                  <>
                    {thumb ? thumb : numbered ? <span className="font-sans text-[10px] tracking-[0.2em] opacity-50">{String(n + 1).padStart(2, "0")}</span> : null}

                    <span className="flex-1 text-left">{l.title}</span>
                    {arrow}
                  </>
                );
                const href = safeUrl(l.url);
                // Bento sizes (Pro): 1x1 is half width, 2x1 / unset is a full row, 2x2 is a tall tile.
                const span = l.size === "1x1" ? "col-span-1" : "col-span-2";
                const tall = l.size === "2x2" ? "[&>a]:min-h-[170px] [&>a]:items-end" : l.size === "1x1" ? "[&>a]:min-h-[84px]" : "";
                if (l.kind === "whatsapp" && l.whatsapp) {
                  return (
                    <div key={l.id} className={`${span} ${tall}`}>
                      <button type="button" onClick={() => setChat(l)} className={`${t.link} w-full cursor-pointer`}>
                        <WhatsAppIcon className="h-7 w-7 shrink-0 text-[#25d366]" />
                        <span className="min-w-0 flex-1 truncate text-left">{l.title}</span>
                        <ArrowUpRight className="h-4 w-4 shrink-0" />
                      </button>
                    </div>
                  );
                }
                if (l.kind === "youtube") {
                  const yt = l.video ? `https://www.youtube.com/watch?v=${l.video.id}` : safeUrl(l.url);
                  return (
                    <div key={l.id} className="col-span-2">
                      <Tilt max={5} className="rounded-2xl">
                        <a href={yt} onClick={() => track(l.id)} target="_blank" rel="noreferrer" className={`${t.link} !flex-col !items-stretch !gap-3 !py-3`}>
                          {l.video ? (
                            <span className="relative block overflow-hidden rounded-xl">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={`https://i.ytimg.com/vi/${l.video.id}/hqdefault.jpg`} alt="" loading="lazy" className="aspect-video w-full object-cover" />
                              <span className="absolute inset-0 grid place-items-center bg-black/15">
                                <span className="grid h-12 w-12 place-items-center rounded-full bg-white/95 text-black shadow-lg"><Play className="h-5 w-5 translate-x-0.5 fill-current" /></span>
                              </span>
                            </span>
                          ) : null}
                          <span className="flex items-center gap-2">
                            <span className="flex-1 text-left">
                              <span className={soft ? "block text-[13px] font-semibold opacity-65" : "block text-[11px] font-normal uppercase tracking-[0.16em] opacity-60"}>{l.video ? "Latest video" : "YouTube"}</span>
                              {l.video?.title ?? l.title}
                            </span>
                            {arrow}
                          </span>
                        </a>
                      </Tilt>
                    </div>
                  );
                }
                if (l.kind === "booking" && l.booking && soft) {
                  // Glasshouse and Mochi show a booking as a bento tile with the next free times.
                  const compactTile = l.size === "1x1";
                  return (
                    <div key={l.id} className={`${compactTile ? "col-span-1" : "col-span-2"} flex`}>
                      <div className="w-full">
                        <BookingTile link={l} handle={profile.handle} live={live} compact={compactTile} onOpen={() => setBooking(l)} />
                      </div>
                    </div>
                  );
                }
                if (l.kind === "booking" && l.booking) {
                  return (
                    <div key={l.id} className={`${span} ${tall}`}>
                      <button type="button" onClick={() => setBooking(l)} className={`${t.featured} w-full cursor-pointer`}>
                        {l.image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={l.image} alt="" loading="lazy" className="h-10 w-10 sm:h-11 sm:w-11 shrink-0 rounded-xl object-cover shadow-sm ring-1 ring-black/5" />
                        )}
                        <span className="flex-1 text-left">
                          {l.title}
                          <span className="mt-0.5 block text-[11px] font-normal uppercase tracking-[0.16em] opacity-60">
                            {l.booking.durationMin} min · {bookingPrice(l)}
                          </span>
                          <NextFreeLine link={l} handle={profile.handle} live={live} />
                        </span>
                        <ArrowUpRight className="h-4 w-4 shrink-0" />
                      </button>
                    </div>
                  );
                }
                return l.featured ? (
                  <div key={l.id} className={`${span} ${tall}`}>
                    <Tilt max={6} className="rounded-2xl">
                      <a href={href} onClick={() => track(l.id)} target="_blank" rel="noreferrer" className={t.featured}>
                        {inner}
                      </a>
                    </Tilt>
                  </div>
                ) : (
                  <div key={l.id} className={`${span} ${tall} flex flex-col`}>
                    <a href={href} onClick={() => track(l.id)} target="_blank" rel="noreferrer" className={t.link}>
                      {inner}
                    </a>
                  </div>
                );
              };

              type Item = { kind: "link"; link: BioLink } | { kind: "folder"; name: string; links: BioLink[] };
              const items: Item[] = [];
              const byFolder = new Map<string, BioLink[]>();
              for (const l of visibleLinks) {
                if (l.folder) {
                  let group = byFolder.get(l.folder);
                  if (!group) {
                    group = [];
                    byFolder.set(l.folder, group);
                    items.push({ kind: "folder", name: l.folder, links: group });
                  }
                  group.push(l);
                } else {
                  items.push({ kind: "link", link: l });
                }
              }

              return items.map((item) =>
                item.kind === "link" ? (
                  renderLink(item.link)
                ) : (
                  <details key={item.name} className="group/folder col-span-2">
                    <summary className={`${t.link} cursor-pointer list-none`}>
                      <span className="flex-1 text-left">{item.name}</span>
                      <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open/folder:rotate-180" />
                    </summary>
                    <div className="mt-3 flex flex-col gap-3 pl-3">{item.links.map(renderLink)}</div>
                  </details>
                ),
              );
            })()}
          </motion.section>
        )}

        {/* Shop my looks */}
        {profile.looks.length > 0 && (
          <motion.section variants={rise} custom={i++} className="flex flex-col gap-4">
            <div className="flex items-baseline justify-between">
              <Heading level={2} plain={embedded} className={t.section + " flex-1"}>{profile.shopTitle || "Shop"}</Heading>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {profile.looks.map((look) => (
                <Tilt key={look.id} max={9} className="h-full">
                  <a href={safeUrl(look.url)} target="_blank" rel="noreferrer" className={`group block h-full ${t.lookCard}`}>
                    <div className="relative aspect-[4/5] overflow-hidden">
                      {look.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={look.image} alt={look.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      ) : (
                        <div className="h-full w-full transition-transform duration-700 group-hover:scale-105">
                          <LookArt kind={look.art} hue={look.hue} mono={theme.def.mono} />
                        </div>
                      )}
                      <span className={`absolute left-2 top-2 ${t.tag}`}>{look.store}</span>
                    </div>
                    <div className="flex items-end justify-between gap-2 p-3">
                      <div className="min-w-0">
                        <p className={`${t.lookTitle} [overflow-wrap:anywhere]`}>{look.title}</p>
                        <p className={t.lookMeta}>{look.price}</p>
                      </div>
                      <ArrowUpRight className="h-4 w-4 shrink-0 opacity-60" />
                    </div>
                  </a>
                </Tilt>
              ))}
            </div>
          </motion.section>
        )}

        {/* Media kit */}
        {profile.showMediaKit && profile.mediaKit && (
          <motion.section variants={rise} custom={i++} className="flex flex-col gap-4">
            <Heading level={2} plain={embedded} className={t.section}>Media kit</Heading>
            <div className="grid grid-cols-3 gap-2">
              {[
                ["Followers", profile.mediaKit.followers],
                ["Engagement", profile.mediaKit.engagement],
                ["Avg views", profile.mediaKit.avgViews],
              ].map(([label, value]) => (
                <div key={label} className={`${t.stat} min-w-0`}>
                  <div className={`${t.statValue} [overflow-wrap:anywhere]`}>{value}</div>
                  {/* Kept small and tight so the longest word ("Engagement") always fits inside its box on a phone. */}
                  <div className={`${t.meta} mt-2 !text-[10px] !leading-tight !tracking-[0.03em] [overflow-wrap:anywhere]`}>{label}</div>
                </div>
              ))}
            </div>
            {profile.mediaKit.audience && <p className={`${t.bio} !text-[14px]`}>Audience: {profile.mediaKit.audience}</p>}
            {profile.mediaKit.brands.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className={`${t.meta} self-center`}>Worked with</span>
                {profile.mediaKit.brands.map((b) => (
                  <span key={b} className={t.chip}>
                    {b}
                  </span>
                ))}
              </div>
            )}
            {profile.socials.email && (
              <a href={`mailto:${profile.socials.email}`} className={`${t.button} text-center`}>
                Work with me
              </a>
            )}
          </motion.section>
        )}

        {/* Subscribe */}
        {profile.showSubscribe && (
          <motion.section variants={rise} custom={i++} className="flex flex-col gap-3">
            <Heading level={2} plain={embedded} className={t.section}>Join my list</Heading>
            <Subscribe t={t} handle={profile.handle} live={live} />
          </motion.section>
        )}

        {seeAll && (
          <motion.section variants={rise} custom={i++}>
            <Link href={seeAll} className={`${t.button} block text-center`}>
              See everything by {profile.name}
            </Link>
          </motion.section>
        )}

        <motion.footer variants={rise} custom={i++} className="pt-4 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => setQrOpen(true)}
            className={`${t.badge} inline-flex items-center gap-2 rounded-full border border-t-fg/15 bg-t-fg/[0.04] min-h-[40px] px-4 py-2 text-[11px] uppercase tracking-[0.2em] transition hover:border-t-fg/40 hover:bg-t-fg/10 cursor-pointer`}
          >
            <QrCode className="h-3.5 w-3.5" />
            <span>Show QR code</span>
          </button>
          {showBadge && (
            <Link href={`/?ref=${encodeURIComponent(profile.handle)}`} className={`${t.badge} inline-flex min-h-[40px] items-center gap-1.5 px-2 text-[11px] uppercase tracking-[0.25em] hover:opacity-100`}>
              ✦ Made with <span className="font-display text-[15px] normal-case italic tracking-normal">Showz</span> · Get yours →
            </Link>
          )}
          {live && (
            <Link href={`/report?page=${encodeURIComponent(profile.handle)}`} className={`${t.badge} inline-flex min-h-[40px] items-center px-2 text-[10px] uppercase tracking-[0.2em] opacity-50 hover:opacity-100`}>
              Report this page
            </Link>
          )}
        </motion.footer>
      </motion.main>

      {chat && <WhatsAppModal link={chat} handle={profile.handle} live={live} onClose={() => setChat(null)} />}
      {booking && <BookingModal link={booking} handle={profile.handle} live={live} onClose={() => setBooking(null)} />}

      {/* Interactive QR Code Modal */}
      {qrOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setQrOpen(false)}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-xs rounded-3xl border border-white/15 bg-[#141518] p-6 text-center text-white shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setQrOpen(false)}
              className="absolute right-4 top-4 rounded-full p-1 text-white/50 hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="mx-auto rounded-2xl bg-white p-3.5 shadow-inner inline-block">
              <QRCodeCanvas text={`${SITE_URL}/${profile.handle}`} size={160} />
            </div>
            <p className="mt-4 text-[16px] font-bold">@{profile.handle}</p>
            <p className="mt-1 text-[12px] text-white/50">{SITE_HOST}/{profile.handle}</p>
            <p className="mt-3 text-[11px] text-white/40">Point your phone camera to scan</p>
          </div>
        </div>
      )}
    </div>
  );
}
