import type { CSSProperties } from "react";
import type { ThemeId } from "./types";

/**
 * A theme = a design family (layout, shapes, typography) + a palette.
 * Families are hand-designed; palettes are tuned per theme. Colours reach the
 * classes through CSS variables (--t-bg, --t-fg, …) set on the page root.
 */

export type Family =
  | "editorial"
  | "chrome"
  | "glass"
  | "mono"
  | "pop"
  | "minimal"
  | "gradient"
  | "neon"
  | "brutalist"
  | "luxury"
  | "ticket"
  | "terminal"
  | "deco"
  | "organic"
  | "handwritten"
  | "duotone"
  | "studio"
  | "sticker"
  | "poster"
  | "vinyl"
  | "ribbon"
  | "frame"
  | "badge"
  | "split"
  | "zine"
  | "stamp"
  | "carnival"
  | "catalog"
  | "arch"
  | "clay"
  | "bakes"
  | "lavender";
export type FontKey = "bodoni" | "display" | "syne" | "unbounded" | "grotesk" | "sans";

export interface ThemeTokens {
  root: string;
  name: string;
  bio: string;
  meta: string;
  section: string;
  link: string;
  featured: string;
  lookCard: string;
  lookTitle: string;
  lookMeta: string;
  tag: string;
  stat: string;
  statValue: string;
  chip: string;
  input: string;
  button: string;
  social: string;
  avatar: string;
  monogram: string;
  badge: string;
}

interface FamilyDef {
  label: string;
  font: FontKey;
  centered: boolean;
  numbered: boolean;
  tokens: ThemeTokens;
}

export interface ThemeDef {
  id: ThemeId;
  label: string;
  family: Family;
  bg: string;
  fg: string;
  accent: string;
  accent2: string;
  onAccent: string;
  font?: FontKey;
  /** Grayscale product art. */
  mono?: boolean;
  /** Chrome family: [light, mid, dark] metal tones and the 3D ball colour. */
  chrome?: [string, string, string];
  blob?: string;
}

export const fontClass: Record<FontKey, string> = {
  bodoni: "font-bodoni",
  display: "font-display",
  syne: "font-syne",
  unbounded: "font-unbounded",
  grotesk: "font-grotesk",
  sans: "font-sans",
};

export const families: Record<Family, FamilyDef> = {
  editorial: {
    label: "Editorial",
    font: "bodoni",
    centered: false,
    numbered: true,
    tokens: {
      root: "bg-t-bg text-t-fg font-bodoni",
      name: "italic text-[46px] leading-[0.92] tracking-tight",
      bio: "font-display text-[19px] leading-snug text-t-fg/75",
      meta: "font-sans text-[10px] uppercase tracking-[0.3em] text-t-fg/55",
      section: "font-sans text-[10px] uppercase tracking-[0.35em] text-t-fg/60 border-t border-t-fg/15 pt-3",
      link: "group flex items-center gap-4 border-b border-t-fg/15 py-4 font-display text-[20px] leading-tight transition-all hover:pl-2",
      featured: "group mb-2 flex items-center gap-4 bg-t-accent px-5 py-5 font-display text-[22px] leading-tight text-t-on-accent",
      lookCard: "border border-t-fg/10 bg-t-fg/[0.03]",
      lookTitle: "font-display text-[17px] leading-tight",
      lookMeta: "font-sans text-[10px] uppercase tracking-[0.2em] text-t-fg/55",
      tag: "bg-t-bg px-2 py-1 font-sans text-[9px] uppercase tracking-[0.2em] text-t-fg",
      stat: "border border-t-fg/15 p-3 text-center",
      statValue: "font-bodoni italic text-[28px] leading-none",
      chip: "border border-t-fg/20 px-3 py-1 font-sans text-[11px]",
      input: "w-full border-b border-t-fg/40 bg-transparent py-3 font-display text-lg outline-none placeholder:text-t-fg/40",
      button: "bg-t-accent px-5 py-3 font-sans text-[11px] uppercase tracking-[0.25em] text-t-on-accent",
      social: "grid h-10 w-10 place-items-center rounded-full border border-t-fg/20 transition hover:bg-t-fg hover:text-t-bg",
      avatar: "h-24 w-24 rounded-full",
      monogram: "bg-t-accent2 italic text-t-bg",
      badge: "font-sans text-t-fg/50",
    },
  },
  chrome: {
    label: "Chrome",
    font: "syne",
    centered: true,
    numbered: false,
    tokens: {
      root: "bg-t-bg text-t-fg font-sans",
      name: "chrome-text text-[44px] font-extrabold uppercase leading-[0.9] tracking-tight",
      bio: "text-[15px] text-t-fg/70",
      meta: "text-[10px] uppercase tracking-[0.3em] text-t-fg/45",
      section: "font-syne text-[11px] uppercase tracking-[0.3em] text-t-fg/50",
      link: "group flex items-center gap-4 rounded-2xl border border-t-fg/12 bg-t-fg/[0.05] px-5 py-4 text-[15px] font-medium backdrop-blur-xl transition hover:border-t-fg/30 hover:bg-t-fg/10",
      featured:
        "group flex items-center gap-4 rounded-2xl bg-[linear-gradient(110deg,var(--c2),var(--c1)_30%,var(--c2)_50%,var(--c1)_70%,var(--c3))] px-5 py-5 text-[16px] font-semibold text-t-on-accent shadow-[0_10px_40px_-12px_var(--c2)]",
      lookCard: "overflow-hidden rounded-2xl border border-t-fg/10 bg-t-fg/[0.05] backdrop-blur-xl",
      lookTitle: "text-[14px] font-medium",
      lookMeta: "text-[11px] text-t-fg/50",
      tag: "rounded-full bg-t-bg/70 px-2 py-1 text-[9px] uppercase tracking-[0.18em] text-t-fg backdrop-blur",
      stat: "rounded-2xl border border-t-fg/10 bg-t-fg/[0.05] p-3 text-center backdrop-blur-xl",
      statValue: "chrome-text font-syne text-[24px] font-bold leading-none",
      chip: "rounded-full border border-t-fg/15 px-3 py-1 text-[11px] text-t-fg/80",
      input: "w-full rounded-full border border-t-fg/15 bg-t-fg/5 px-5 py-3 text-sm outline-none placeholder:text-t-fg/35 focus:border-t-fg/40",
      button: "rounded-full bg-t-fg px-5 py-3 text-sm font-semibold text-t-bg",
      social: "grid h-10 w-10 place-items-center rounded-full border border-t-fg/15 bg-t-fg/5 transition hover:bg-t-fg hover:text-t-bg",
      avatar: "h-24 w-24 rounded-full ring-2 ring-t-fg/40 ring-offset-4 ring-offset-t-bg",
      monogram: "bg-[conic-gradient(from_180deg,var(--c2),var(--c1),var(--c3),var(--c1),var(--c2))] font-extrabold text-t-on-accent",
      badge: "text-t-fg/45",
    },
  },
  glass: {
    label: "Glass",
    font: "display",
    centered: true,
    numbered: false,
    tokens: {
      root: "bg-t-bg text-t-fg font-sans",
      name: "text-[50px] italic leading-[0.95]",
      bio: "text-[15px] text-t-fg/70",
      meta: "text-[10px] uppercase tracking-[0.3em] text-t-fg/50",
      section: "font-display text-[24px] italic",
      link: "group flex items-center gap-4 rounded-full border border-t-fg/10 bg-t-bg/45 px-6 py-4 text-[15px] shadow-[0_8px_30px_-14px_var(--t-accent)] backdrop-blur-xl transition hover:bg-t-bg/75",
      featured:
        "group flex items-center gap-4 rounded-[28px] bg-gradient-to-r from-t-accent to-t-accent2 px-6 py-5 text-[16px] font-medium text-t-on-accent shadow-[0_14px_40px_-14px_var(--t-accent)]",
      lookCard: "overflow-hidden rounded-[26px] border border-t-fg/10 bg-t-bg/50 shadow-[0_10px_30px_-16px_var(--t-accent)] backdrop-blur-xl",
      lookTitle: "text-[14px] font-medium",
      lookMeta: "text-[11px] text-t-fg/55",
      tag: "rounded-full bg-t-bg/85 px-2 py-1 text-[9px] uppercase tracking-[0.18em] text-t-fg",
      stat: "rounded-3xl border border-t-fg/10 bg-t-bg/50 p-3 text-center backdrop-blur-xl",
      statValue: "font-display text-[30px] italic leading-none",
      chip: "rounded-full bg-t-bg/65 px-3 py-1 text-[11px]",
      input: "w-full rounded-full border border-t-fg/10 bg-t-bg/60 px-5 py-3 text-sm outline-none placeholder:text-t-fg/40",
      button: "rounded-full bg-t-fg px-5 py-3 text-sm text-t-bg",
      social: "grid h-10 w-10 place-items-center rounded-full border border-t-fg/10 bg-t-bg/60 backdrop-blur transition hover:bg-t-bg",
      avatar: "h-28 w-28 rounded-full border-4 border-t-bg shadow-xl",
      monogram: "bg-gradient-to-br from-t-accent to-t-accent2 italic text-t-on-accent",
      badge: "text-t-fg/50",
    },
  },
  mono: {
    label: "Mono",
    font: "grotesk",
    centered: false,
    numbered: true,
    tokens: {
      root: "bg-t-bg text-t-fg font-grotesk",
      name: "text-[58px] font-bold uppercase leading-[0.82] tracking-[-0.045em]",
      bio: "text-[13px] uppercase tracking-wide text-t-fg/65",
      meta: "text-[10px] uppercase tracking-[0.3em] text-t-fg/45",
      section: "border-t border-t-fg/20 pt-3 text-[10px] uppercase tracking-[0.4em] text-t-fg/50",
      link: "group flex items-center gap-4 border border-t-fg/25 px-5 py-4 text-[14px] uppercase tracking-[0.12em] transition hover:bg-t-fg hover:text-t-bg",
      featured: "group flex items-center gap-4 bg-t-accent px-5 py-5 text-[15px] font-bold uppercase tracking-[0.12em] text-t-on-accent",
      lookCard: "overflow-hidden border border-t-fg/20",
      lookTitle: "text-[13px] uppercase tracking-wide",
      lookMeta: "text-[10px] uppercase tracking-[0.2em] text-t-fg/50",
      tag: "bg-t-bg px-2 py-1 text-[9px] uppercase tracking-[0.2em] text-t-fg",
      stat: "border border-t-fg/25 p-3 text-center",
      statValue: "text-[26px] font-bold leading-none",
      chip: "border border-t-fg/30 px-3 py-1 text-[11px] uppercase",
      input: "w-full border border-t-fg/30 bg-transparent px-4 py-3 text-sm uppercase outline-none placeholder:text-t-fg/35",
      button: "bg-t-accent px-5 py-3 text-xs font-bold uppercase tracking-[0.2em] text-t-on-accent",
      social: "grid h-10 w-10 place-items-center border border-t-fg/30 transition hover:bg-t-fg hover:text-t-bg",
      avatar: "h-24 w-24 grayscale contrast-125",
      monogram: "bg-t-fg font-bold text-t-bg",
      badge: "text-t-fg/45",
    },
  },
  pop: {
    label: "Pop",
    font: "unbounded",
    centered: true,
    numbered: false,
    tokens: {
      root: "bg-t-bg text-t-fg font-sans",
      name: "text-[34px] font-black leading-[1] text-t-accent [text-shadow:3px_3px_0_var(--t-fg)]",
      bio: "text-[15px] font-medium",
      meta: "text-[10px] font-bold uppercase tracking-[0.25em] text-t-fg/60",
      section: "font-unbounded text-[14px] font-bold uppercase",
      link: "group flex items-center gap-4 rounded-2xl border-[2.5px] border-t-fg bg-t-bg px-5 py-4 text-[15px] font-bold shadow-[4px_4px_0_var(--t-fg)] transition hover:-translate-y-0.5 hover:shadow-[6px_6px_0_var(--t-fg)]",
      featured: "group flex items-center gap-4 rounded-2xl border-[2.5px] border-t-fg bg-t-accent2 px-5 py-5 text-[16px] font-black text-t-fg shadow-[5px_5px_0_var(--t-fg)]",
      lookCard: "overflow-hidden rounded-2xl border-[2.5px] border-t-fg bg-t-bg shadow-[4px_4px_0_var(--t-fg)]",
      lookTitle: "text-[14px] font-bold",
      lookMeta: "text-[11px] font-medium text-t-fg/60",
      tag: "rounded-full border-2 border-t-fg bg-t-accent2 px-2 py-0.5 text-[9px] font-black uppercase text-t-fg",
      stat: "rounded-2xl border-[2.5px] border-t-fg bg-t-bg p-3 text-center shadow-[3px_3px_0_var(--t-fg)]",
      statValue: "font-unbounded text-[22px] font-black leading-none text-t-accent",
      chip: "rounded-full border-2 border-t-fg bg-t-bg px-3 py-1 text-[11px] font-bold",
      input: "w-full rounded-2xl border-[2.5px] border-t-fg bg-t-bg px-4 py-3 text-sm font-medium outline-none",
      button: "rounded-2xl border-[2.5px] border-t-fg bg-t-accent px-5 py-3 text-sm font-black text-t-on-accent shadow-[3px_3px_0_var(--t-fg)]",
      social: "grid h-10 w-10 place-items-center rounded-full border-[2.5px] border-t-fg bg-t-bg transition hover:bg-t-accent2",
      avatar: "h-24 w-24 rotate-[-4deg] rounded-[28px] border-[3px] border-t-fg shadow-[5px_5px_0_var(--t-fg)]",
      monogram: "bg-gradient-to-br from-t-accent to-t-accent2 font-black text-t-on-accent",
      badge: "font-bold text-t-fg/50",
    },
  },
  minimal: {
    label: "Minimal",
    font: "sans",
    centered: true,
    numbered: false,
    tokens: {
      root: "bg-t-bg text-t-fg font-sans",
      name: "text-[30px] font-semibold tracking-tight",
      bio: "text-[15px] leading-relaxed text-t-fg/65",
      meta: "text-[12px] text-t-fg/50",
      section: "text-[13px] font-semibold text-t-fg/70",
      link: "group flex items-center gap-4 rounded-xl border border-t-fg/10 bg-t-fg/[0.03] px-5 py-4 text-[15px] font-medium transition hover:bg-t-fg/[0.07]",
      featured: "group flex items-center gap-4 rounded-xl bg-t-accent px-5 py-4 text-[15px] font-semibold text-t-on-accent",
      lookCard: "overflow-hidden rounded-xl border border-t-fg/10 bg-t-fg/[0.03]",
      lookTitle: "text-[14px] font-medium",
      lookMeta: "text-[12px] text-t-fg/55",
      tag: "rounded-md bg-t-bg/90 px-2 py-0.5 text-[10px] font-medium text-t-fg",
      stat: "rounded-xl border border-t-fg/10 p-3 text-center",
      statValue: "text-[22px] font-semibold leading-none",
      chip: "rounded-md border border-t-fg/15 px-2.5 py-1 text-[12px]",
      input: "w-full rounded-xl border border-t-fg/15 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-t-fg/40 focus:border-t-fg/40",
      button: "rounded-xl bg-t-accent px-5 py-3 text-sm font-semibold text-t-on-accent",
      social: "grid h-10 w-10 place-items-center rounded-full text-t-fg/70 transition hover:bg-t-fg/10 hover:text-t-fg",
      avatar: "h-20 w-20 rounded-full",
      monogram: "bg-t-accent font-semibold text-t-on-accent",
      badge: "text-t-fg/45",
    },
  },
  gradient: {
    label: "Gradient",
    font: "syne",
    centered: true,
    numbered: false,
    tokens: {
      root: "bg-t-bg text-t-fg font-sans",
      name: "text-[42px] font-extrabold leading-[0.95] tracking-tight",
      bio: "text-[15px] text-t-fg/80",
      meta: "text-[10px] uppercase tracking-[0.3em] text-t-fg/60",
      section: "font-syne text-[13px] font-bold uppercase tracking-[0.2em] text-t-fg/80",
      link: "group flex items-center gap-4 rounded-2xl border border-t-fg/20 bg-t-fg/10 px-5 py-4 text-[15px] font-medium backdrop-blur-xl transition hover:bg-t-fg/20",
      featured: "group flex items-center gap-4 rounded-2xl bg-t-fg px-5 py-5 text-[16px] font-semibold text-t-bg",
      lookCard: "overflow-hidden rounded-2xl border border-t-fg/20 bg-t-fg/10 backdrop-blur-xl",
      lookTitle: "text-[14px] font-semibold",
      lookMeta: "text-[11px] text-t-fg/70",
      tag: "rounded-full bg-t-bg/60 px-2 py-1 text-[9px] uppercase tracking-[0.18em] text-t-fg backdrop-blur",
      stat: "rounded-2xl border border-t-fg/20 bg-t-fg/10 p-3 text-center backdrop-blur-xl",
      statValue: "font-syne text-[24px] font-extrabold leading-none",
      chip: "rounded-full bg-t-fg/15 px-3 py-1 text-[11px]",
      input: "w-full rounded-2xl border border-t-fg/25 bg-t-fg/10 px-4 py-3 text-sm outline-none placeholder:text-t-fg/50",
      button: "rounded-2xl bg-t-fg px-5 py-3 text-sm font-semibold text-t-bg",
      social: "grid h-10 w-10 place-items-center rounded-full bg-t-fg/15 backdrop-blur transition hover:bg-t-fg hover:text-t-bg",
      avatar: "h-24 w-24 rounded-full border-2 border-t-fg/60",
      monogram: "bg-t-fg/20 font-extrabold text-t-fg backdrop-blur",
      badge: "text-t-fg/60",
    },
  },
  neon: {
    label: "Neon",
    font: "unbounded",
    centered: true,
    numbered: false,
    tokens: {
      root: "bg-t-bg text-t-fg font-sans",
      name: "text-[32px] font-bold leading-[1.05] text-t-accent [text-shadow:0_0_24px_var(--t-accent)]",
      bio: "text-[15px] text-t-fg/75",
      meta: "text-[10px] uppercase tracking-[0.3em] text-t-fg/50",
      section: "font-unbounded text-[12px] uppercase tracking-[0.2em] text-t-accent",
      link: "group flex items-center gap-4 rounded-xl border border-t-accent/50 bg-t-accent/[0.06] px-5 py-4 text-[15px] font-medium shadow-[0_0_22px_-8px_var(--t-accent)] transition hover:bg-t-accent/[0.14]",
      featured: "group flex items-center gap-4 rounded-xl bg-t-accent px-5 py-5 text-[16px] font-bold text-t-on-accent shadow-[0_0_34px_-4px_var(--t-accent)]",
      lookCard: "overflow-hidden rounded-xl border border-t-accent/40 bg-t-accent/[0.05] shadow-[0_0_22px_-10px_var(--t-accent)]",
      lookTitle: "text-[14px] font-medium",
      lookMeta: "text-[11px] text-t-fg/55",
      tag: "rounded-md bg-t-bg/80 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-t-accent",
      stat: "rounded-xl border border-t-accent/40 p-3 text-center",
      statValue: "font-unbounded text-[22px] font-bold leading-none text-t-accent [text-shadow:0_0_16px_var(--t-accent)]",
      chip: "rounded-md border border-t-accent2/50 px-2.5 py-1 text-[11px] text-t-fg/85",
      input: "w-full rounded-xl border border-t-accent/40 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-t-fg/40 focus:border-t-accent",
      button: "rounded-xl bg-t-accent px-5 py-3 text-sm font-bold text-t-on-accent shadow-[0_0_24px_-4px_var(--t-accent)]",
      social: "grid h-10 w-10 place-items-center rounded-full border border-t-accent/50 text-t-accent transition hover:bg-t-accent hover:text-t-on-accent",
      avatar: "h-24 w-24 rounded-full ring-2 ring-t-accent shadow-[0_0_30px_-4px_var(--t-accent)]",
      monogram: "bg-t-bg font-bold text-t-accent",
      badge: "text-t-fg/45",
    },
  },
  brutalist: {
    label: "Brutalist",
    font: "grotesk",
    centered: false,
    numbered: true,
    tokens: {
      root: "bg-t-bg text-t-fg font-grotesk",
      name: "text-[52px] font-black uppercase leading-[0.85] tracking-[-0.03em]",
      bio: "text-[14px] font-medium text-t-fg/80",
      meta: "text-[11px] font-bold uppercase tracking-[0.1em] text-t-fg/60",
      section: "inline-block bg-t-fg px-2 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-t-bg",
      link: "group flex items-center gap-4 border-[3px] border-t-fg bg-t-bg px-5 py-4 text-[15px] font-bold uppercase shadow-[6px_6px_0_var(--t-fg)] transition hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none",
      featured: "group flex items-center gap-4 border-[3px] border-t-fg bg-t-accent px-5 py-5 text-[16px] font-black uppercase text-t-on-accent shadow-[8px_8px_0_var(--t-fg)]",
      lookCard: "border-[3px] border-t-fg bg-t-bg shadow-[6px_6px_0_var(--t-fg)]",
      lookTitle: "text-[13px] font-black uppercase",
      lookMeta: "text-[10px] font-bold uppercase text-t-fg/60",
      tag: "bg-t-fg px-2 py-0.5 text-[9px] font-black uppercase text-t-bg",
      stat: "border-[3px] border-t-fg bg-t-bg p-3 text-center shadow-[4px_4px_0_var(--t-fg)]",
      statValue: "text-[28px] font-black leading-none",
      chip: "border-2 border-t-fg bg-t-bg px-3 py-1 text-[11px] font-bold uppercase",
      input: "w-full border-[3px] border-t-fg bg-t-bg px-4 py-3 text-sm font-bold outline-none placeholder:text-t-fg/40",
      button: "border-[3px] border-t-fg bg-t-accent px-5 py-3 text-xs font-black uppercase text-t-on-accent shadow-[4px_4px_0_var(--t-fg)]",
      social: "grid h-10 w-10 place-items-center border-[3px] border-t-fg bg-t-bg font-black transition hover:bg-t-fg hover:text-t-bg",
      avatar: "h-24 w-24 border-[3px] border-t-fg object-cover",
      monogram: "border-[3px] border-t-fg bg-t-accent font-black text-t-on-accent",
      badge: "font-bold uppercase text-t-fg/50",
    },
  },
  luxury: {
    label: "Luxury",
    font: "display",
    centered: true,
    numbered: false,
    tokens: {
      root: "bg-t-bg text-t-fg font-sans",
      name: "text-[38px] italic leading-[1] tracking-wide",
      bio: "text-[13px] uppercase tracking-[0.2em] text-t-fg/60",
      meta: "text-[10px] uppercase tracking-[0.35em] text-t-fg/45",
      section: "text-[10px] uppercase tracking-[0.4em] text-t-accent",
      link: "group flex items-center gap-4 border-t border-b border-t-fg/20 px-2 py-4 text-[14px] uppercase tracking-[0.15em] transition hover:border-t-accent",
      featured: "group flex items-center gap-4 border border-t-accent px-5 py-5 text-[15px] uppercase tracking-[0.15em] text-t-fg",
      lookCard: "border border-t-fg/15 bg-transparent",
      lookTitle: "text-[12px] uppercase tracking-[0.1em]",
      lookMeta: "text-[10px] uppercase tracking-[0.15em] text-t-accent",
      tag: "border border-t-fg/30 px-2 py-0.5 text-[8px] uppercase tracking-[0.2em] text-t-fg",
      stat: "border-t border-t-fg/20 pt-3 text-center",
      statValue: "text-[24px] italic font-light leading-none",
      chip: "border border-t-fg/25 px-3 py-1 text-[10px] uppercase tracking-[0.1em]",
      input: "w-full border-b border-t-fg/30 bg-transparent py-3 text-sm uppercase tracking-[0.1em] outline-none placeholder:text-t-fg/30",
      button: "border border-t-accent px-6 py-3 text-[11px] uppercase tracking-[0.3em] text-t-fg transition hover:bg-t-accent hover:text-t-on-accent",
      social: "grid h-9 w-9 place-items-center border border-t-fg/25 text-t-fg/70 transition hover:border-t-accent hover:text-t-accent",
      avatar: "h-24 w-24 rounded-full border border-t-accent p-1",
      monogram: "border border-t-accent text-t-fg",
      badge: "uppercase tracking-[0.2em] text-t-fg/40",
    },
  },
  ticket: {
    label: "Ticket",
    font: "grotesk",
    centered: false,
    numbered: false,
    tokens: {
      root: "bg-t-bg text-t-fg font-grotesk",
      name: "text-[40px] font-bold leading-[0.95]",
      bio: "text-[14px] text-t-fg/70",
      meta: "text-[11px] uppercase tracking-[0.15em] text-t-fg/50",
      section: "text-[12px] font-bold uppercase tracking-[0.1em] text-t-accent",
      link: "group relative flex items-center gap-4 rounded-2xl border-2 border-dashed border-t-accent/60 bg-t-bg px-5 py-4 text-[15px] font-medium shadow-[0_6px_18px_-10px_var(--t-accent)] transition hover:border-t-accent hover:shadow-[0_10px_24px_-10px_var(--t-accent)]",
      featured: "group relative flex items-center gap-4 rounded-2xl border-2 border-dashed border-t-on-accent/50 bg-t-accent px-5 py-5 text-[16px] font-bold text-t-on-accent shadow-[0_10px_28px_-10px_var(--t-accent)]",
      lookCard: "overflow-hidden rounded-2xl border-2 border-dashed border-t-accent/50 bg-t-bg shadow-[0_6px_18px_-10px_var(--t-accent)]",
      lookTitle: "text-[14px] font-bold",
      lookMeta: "text-[11px] text-t-fg/55",
      tag: "rounded-md bg-t-accent px-2 py-0.5 text-[9px] font-bold uppercase text-t-on-accent",
      stat: "rounded-2xl border-2 border-dashed border-t-accent/50 bg-t-bg p-3 text-center",
      statValue: "text-[24px] font-bold leading-none text-t-accent",
      chip: "rounded-full border-2 border-t-accent/40 px-3 py-1 text-[11px] font-medium",
      input: "w-full rounded-2xl border-2 border-dashed border-t-accent/50 bg-t-bg px-4 py-3 text-sm outline-none placeholder:text-t-fg/40",
      button: "rounded-2xl border-2 border-dashed border-t-on-accent/50 bg-t-accent px-5 py-3 text-sm font-bold text-t-on-accent shadow-[0_8px_20px_-10px_var(--t-accent)]",
      social: "grid h-10 w-10 place-items-center rounded-full border-2 border-dashed border-t-accent/50 transition hover:border-t-accent hover:bg-t-accent/10",
      avatar: "h-24 w-24 rounded-2xl border-2 border-dashed border-t-accent/60 p-1",
      monogram: "bg-t-accent font-bold text-t-on-accent",
      badge: "text-t-fg/45",
    },
  },
  terminal: {
    label: "Terminal",
    font: "grotesk",
    centered: false,
    numbered: false,
    tokens: {
      root: "bg-t-bg text-t-fg font-grotesk",
      name: "text-[32px] font-bold leading-[1.1] text-t-accent [text-shadow:0_0_18px_var(--t-accent)] after:ml-1 after:inline-block after:h-[0.85em] after:w-[0.5ch] after:translate-y-[0.1em] after:animate-pulse after:bg-t-accent after:align-middle after:content-['']",
      bio: "text-[14px] text-t-fg/80",
      meta: "text-[11px] text-t-fg/55",
      section: "text-[12px] font-bold text-t-accent [text-shadow:0_0_10px_var(--t-accent)]",
      link: "group flex items-center gap-4 rounded-md border border-t-accent/60 bg-t-accent/[0.07] px-5 py-4 text-[14px] shadow-[0_0_20px_-8px_var(--t-accent)] transition hover:border-t-accent hover:bg-t-accent/15 hover:shadow-[0_0_26px_-6px_var(--t-accent)]",
      featured: "group flex items-center gap-4 rounded-md border border-t-accent bg-t-accent px-5 py-5 text-[15px] font-bold text-t-on-accent shadow-[0_0_30px_-6px_var(--t-accent)]",
      lookCard: "overflow-hidden rounded-md border border-t-accent/50 bg-t-accent/[0.05] shadow-[0_0_18px_-10px_var(--t-accent)]",
      lookTitle: "text-[13px]",
      lookMeta: "text-[11px] text-t-accent",
      tag: "rounded border border-t-accent/60 bg-t-bg/80 px-2 py-0.5 text-[9px] uppercase text-t-accent",
      stat: "rounded-md border border-t-accent/50 p-3 text-center",
      statValue: "text-[24px] font-bold leading-none text-t-accent [text-shadow:0_0_14px_var(--t-accent)]",
      chip: "rounded border border-t-fg/25 px-3 py-1 text-[11px]",
      input: "w-full rounded-md border border-t-accent/60 bg-t-accent/[0.05] px-4 py-3 text-sm outline-none placeholder:text-t-fg/35 focus:border-t-accent",
      button: "rounded-md border border-t-accent bg-t-accent px-5 py-3 text-sm font-bold text-t-on-accent shadow-[0_0_24px_-6px_var(--t-accent)] transition hover:brightness-110",
      social: "grid h-10 w-10 place-items-center rounded-md border border-t-accent/50 text-t-accent transition hover:bg-t-accent hover:text-t-on-accent",
      avatar: "h-20 w-20 rounded-md border border-t-accent shadow-[0_0_24px_-6px_var(--t-accent)]",
      monogram: "border border-t-accent text-t-accent",
      badge: "text-t-fg/40",
    },
  },
  deco: {
    label: "Deco",
    font: "bodoni",
    centered: true,
    numbered: false,
    tokens: {
      root: "bg-t-bg text-t-fg font-sans",
      name: "text-[36px] font-bold uppercase leading-[1.05] tracking-[0.05em]",
      bio: "text-[13px] uppercase tracking-[0.1em] text-t-fg/65",
      meta: "text-[10px] uppercase tracking-[0.3em] text-t-accent",
      section: "text-[12px] font-bold uppercase tracking-[0.3em] text-t-accent",
      link: "group flex items-center gap-4 border-y-2 border-t-accent px-5 py-4 text-[14px] uppercase tracking-[0.1em] transition hover:bg-t-accent/10",
      featured: "group flex items-center gap-4 border-2 border-t-accent bg-t-bg px-5 py-5 text-[15px] font-bold uppercase tracking-[0.1em] text-t-accent",
      lookCard: "border-2 border-t-accent/60",
      lookTitle: "text-[13px] uppercase tracking-[0.05em]",
      lookMeta: "text-[10px] uppercase tracking-[0.1em] text-t-accent",
      tag: "border border-t-accent px-2 py-0.5 text-[9px] uppercase tracking-[0.1em] text-t-accent",
      stat: "border-2 border-t-accent/50 p-3 text-center",
      statValue: "text-[22px] font-bold uppercase leading-none",
      chip: "border border-t-accent/50 px-3 py-1 text-[11px] uppercase tracking-[0.05em]",
      input: "w-full border-2 border-t-accent/50 bg-transparent px-4 py-3 text-sm uppercase tracking-[0.05em] outline-none placeholder:text-t-fg/35",
      button: "border-2 border-t-accent bg-t-accent px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-t-on-accent",
      social: "grid h-10 w-10 place-items-center border-2 border-t-accent text-t-accent transition hover:bg-t-accent hover:text-t-on-accent",
      avatar: "h-24 w-24 border-2 border-t-accent p-1",
      monogram: "border-2 border-t-accent font-bold text-t-accent",
      badge: "uppercase tracking-[0.15em] text-t-fg/45",
    },
  },
  organic: {
    label: "Organic",
    font: "display",
    centered: true,
    numbered: false,
    tokens: {
      root: "bg-t-bg text-t-fg font-sans",
      name: "text-[44px] italic leading-[0.95]",
      bio: "text-[15px] leading-relaxed text-t-fg/70",
      meta: "text-[11px] text-t-fg/50",
      section: "font-display text-[20px] italic text-t-accent",
      link: "group flex items-center gap-4 rounded-[30px_10px_30px_10px] bg-t-accent/10 px-6 py-4 text-[15px] transition hover:bg-t-accent/20",
      featured: "group flex items-center gap-4 rounded-[40px_12px_40px_12px] bg-t-accent px-6 py-5 text-[16px] font-medium text-t-on-accent",
      lookCard: "overflow-hidden rounded-[28px_10px_28px_10px] bg-t-accent/10",
      lookTitle: "text-[14px] font-medium",
      lookMeta: "text-[11px] text-t-fg/55",
      tag: "rounded-[12px_4px] bg-t-bg/80 px-2 py-0.5 text-[9px] uppercase tracking-[0.1em] text-t-fg",
      stat: "rounded-[20px_6px_20px_6px] bg-t-accent/10 p-3 text-center",
      statValue: "text-[26px] italic leading-none",
      chip: "rounded-[12px_4px] bg-t-accent/15 px-3 py-1 text-[11px]",
      input: "w-full rounded-[20px_6px_20px_6px] bg-t-accent/10 px-5 py-3 text-sm outline-none placeholder:text-t-fg/40",
      button: "rounded-[20px_6px_20px_6px] bg-t-fg px-5 py-3 text-sm text-t-bg",
      social: "grid h-10 w-10 place-items-center rounded-[14px_4px_14px_4px] bg-t-accent/15 transition hover:bg-t-accent/30",
      avatar: "h-28 w-28 rounded-[40%_60%_60%_40%/60%_40%_60%_40%] object-cover",
      monogram: "bg-t-accent text-t-on-accent",
      badge: "text-t-fg/45",
    },
  },
  handwritten: {
    label: "Handwritten",
    font: "display",
    centered: true,
    numbered: false,
    tokens: {
      root: "bg-t-bg text-t-fg font-sans",
      name: "text-[56px] italic leading-[0.9]",
      bio: "text-[16px] italic text-t-fg/70",
      meta: "text-[11px] text-t-fg/50",
      section: "font-display text-[26px] italic text-t-accent",
      link: "group flex items-center gap-4 border-b-2 border-dotted border-t-fg/40 px-2 py-4 text-[17px] italic transition hover:border-t-accent",
      featured: "group flex items-center gap-4 rounded-full bg-t-accent px-6 py-5 text-[17px] italic text-t-on-accent",
      lookCard: "overflow-hidden rounded-[18px] border-2 border-dotted border-t-fg/30",
      lookTitle: "font-display text-[16px] italic",
      lookMeta: "text-[11px] text-t-fg/55",
      tag: "rounded-full bg-t-bg/85 px-2 py-0.5 text-[9px] uppercase text-t-fg",
      stat: "rounded-[18px] border-2 border-dotted border-t-fg/30 p-3 text-center",
      statValue: "font-display text-[28px] italic leading-none text-t-accent",
      chip: "rounded-full border border-t-fg/25 px-3 py-1 text-[12px] italic",
      input: "w-full border-b-2 border-dotted border-t-fg/40 bg-transparent py-3 text-[16px] italic outline-none placeholder:text-t-fg/35",
      button: "rounded-full bg-t-fg px-6 py-3 text-[15px] italic text-t-bg",
      social: "grid h-10 w-10 place-items-center rounded-full border-2 border-dotted border-t-fg/35 transition hover:border-t-accent hover:text-t-accent",
      avatar: "h-24 w-24 rounded-full border-2 border-dotted border-t-fg/40 p-1",
      monogram: "bg-t-accent font-display italic text-t-on-accent",
      badge: "italic text-t-fg/45",
    },
  },
  duotone: {
    label: "Duotone",
    font: "syne",
    centered: false,
    numbered: true,
    tokens: {
      root: "bg-t-bg text-t-fg font-sans",
      name: "text-[44px] font-black leading-[0.9] tracking-tight",
      bio: "text-[14px] font-medium text-t-fg/75",
      meta: "text-[10px] font-bold uppercase tracking-[0.15em] text-t-fg/55",
      section: "inline-block bg-t-accent px-2 py-1 text-[11px] font-black uppercase text-t-on-accent",
      link: "group flex items-center gap-4 bg-t-fg px-5 py-4 text-[15px] font-bold text-t-bg transition hover:bg-t-accent hover:text-t-on-accent",
      featured: "group flex items-center gap-4 bg-t-accent px-5 py-5 text-[16px] font-black text-t-on-accent",
      lookCard: "overflow-hidden bg-t-fg/[0.06]",
      lookTitle: "text-[13px] font-bold",
      lookMeta: "text-[10px] font-bold uppercase text-t-accent",
      tag: "bg-t-accent px-2 py-0.5 text-[9px] font-black uppercase text-t-on-accent",
      stat: "bg-t-fg/[0.06] p-3 text-center",
      statValue: "text-[26px] font-black leading-none text-t-accent",
      chip: "bg-t-fg/10 px-3 py-1 text-[11px] font-bold",
      input: "w-full bg-t-fg/[0.08] px-4 py-3 text-sm font-medium outline-none placeholder:text-t-fg/40",
      button: "bg-t-fg px-5 py-3 text-sm font-black text-t-bg transition hover:bg-t-accent hover:text-t-on-accent",
      social: "grid h-10 w-10 place-items-center bg-t-fg/10 font-bold transition hover:bg-t-accent hover:text-t-on-accent",
      avatar: "h-24 w-24 grayscale",
      monogram: "bg-t-accent font-black text-t-on-accent",
      badge: "font-bold text-t-fg/50",
    },
  },
  studio: {
    label: "Studio",
    font: "display",
    centered: true,
    numbered: false,
    tokens: {
      root: "bg-t-bg text-t-fg font-sans",
      name: "text-[34px] font-semibold leading-[1.05] tracking-tight",
      bio: "text-[14px] text-t-fg/70",
      meta: "text-[12px] text-t-fg/50",
      section: "text-[13px] font-semibold text-t-fg/70",
      link: "group flex items-center gap-4 rounded-full border border-t-fg/10 bg-t-bg px-6 py-4 text-[15px] font-medium shadow-[0_8px_20px_-10px_rgba(0,0,0,.35)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_28px_-10px_rgba(0,0,0,.4)]",
      featured: "group flex items-center gap-4 rounded-full bg-t-accent px-6 py-4 text-[15px] font-semibold text-t-on-accent shadow-[0_10px_24px_-8px_var(--t-accent)]",
      lookCard: "overflow-hidden rounded-2xl border border-t-fg/10 bg-t-bg shadow-[0_8px_20px_-10px_rgba(0,0,0,.3)]",
      lookTitle: "text-[14px] font-semibold",
      lookMeta: "text-[12px] text-t-fg/55",
      tag: "rounded-full bg-t-bg px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-t-fg shadow",
      stat: "rounded-2xl border border-t-fg/10 bg-t-bg p-3 text-center shadow-[0_6px_16px_-10px_rgba(0,0,0,.3)]",
      statValue: "text-[24px] font-semibold leading-none",
      chip: "rounded-full border border-t-fg/15 bg-t-bg px-3 py-1 text-[12px] font-medium shadow-sm",
      input: "w-full rounded-full border border-t-fg/15 bg-t-bg px-5 py-3 text-sm outline-none placeholder:text-t-fg/40 focus:border-t-accent",
      button: "rounded-full bg-t-fg px-6 py-3 text-sm font-semibold text-t-bg shadow-[0_10px_24px_-10px_rgba(0,0,0,.4)]",
      social: "grid h-10 w-10 place-items-center rounded-full border border-t-fg/10 bg-t-bg shadow-sm transition hover:bg-t-accent hover:text-t-on-accent",
      avatar: "h-24 w-24 rounded-full border-4 border-t-bg object-cover shadow-[0_10px_24px_-8px_rgba(0,0,0,.4)]",
      monogram: "border-4 border-t-bg bg-t-accent font-semibold text-t-on-accent shadow-[0_10px_24px_-8px_rgba(0,0,0,.4)]",
      badge: "text-t-fg/45",
    },
  },
  sticker: {
    label: "Sticker",
    font: "unbounded",
    centered: true,
    numbered: false,
    tokens: {
      root: "bg-t-bg text-t-fg font-sans",
      name: "text-[32px] font-extrabold leading-[1.05]",
      bio: "text-[14px] font-medium text-t-fg/75",
      meta: "text-[12px] font-semibold text-t-fg/55",
      section: "inline-block -rotate-2 rounded-full bg-t-accent px-3 py-1 text-[12px] font-bold text-t-on-accent",
      link: "group relative flex items-center gap-4 rounded-2xl border-2 border-t-fg/10 bg-t-bg px-5 py-4 text-[15px] font-semibold shadow-[2px_3px_0_var(--t-fg)]/10 transition hover:-rotate-1",
      featured: "group relative flex items-center gap-4 rounded-2xl bg-t-accent px-5 py-5 text-[16px] font-extrabold text-t-on-accent shadow-[3px_4px_0_rgba(0,0,0,.15)] rotate-1",
      lookCard: "relative overflow-hidden rounded-2xl border-2 border-t-fg/10 bg-t-bg shadow-[2px_3px_0_rgba(0,0,0,.1)] -rotate-1",
      lookTitle: "text-[14px] font-bold",
      lookMeta: "text-[11px] font-medium text-t-fg/55",
      tag: "rotate-3 rounded-full bg-t-on-accent px-2 py-0.5 text-[9px] font-black uppercase text-t-accent shadow",
      stat: "rounded-2xl border-2 border-t-fg/10 bg-t-bg p-3 text-center shadow-[2px_3px_0_rgba(0,0,0,.1)]",
      statValue: "text-[24px] font-extrabold leading-none text-t-accent",
      chip: "rounded-full border-2 border-t-fg/15 px-3 py-1 text-[11px] font-bold",
      input: "w-full rounded-2xl border-2 border-t-fg/15 bg-t-bg px-4 py-3 text-sm font-medium outline-none placeholder:text-t-fg/40",
      button: "rounded-full bg-t-accent px-6 py-3 text-sm font-extrabold text-t-on-accent shadow-[2px_3px_0_rgba(0,0,0,.2)]",
      social: "grid h-10 w-10 place-items-center rounded-full border-2 border-t-fg/15 bg-t-bg transition hover:-translate-y-0.5",
      avatar: "h-24 w-24 -rotate-2 rounded-[28px] border-4 border-t-bg object-cover shadow-[3px_4px_0_rgba(0,0,0,.15)]",
      monogram: "-rotate-2 rounded-[28px] border-4 border-t-bg bg-t-accent font-extrabold text-t-on-accent shadow-[3px_4px_0_rgba(0,0,0,.15)]",
      badge: "font-semibold text-t-fg/45",
    },
  },
  poster: {
    label: "Poster",
    font: "syne",
    centered: true,
    numbered: false,
    tokens: {
      root: "bg-t-bg text-t-fg font-sans",
      name: "text-[46px] font-black uppercase leading-[0.88] tracking-tight",
      bio: "text-[13px] uppercase tracking-[0.08em] text-t-fg/65",
      meta: "text-[11px] uppercase tracking-[0.2em] text-t-fg/50",
      section: "text-[13px] font-black uppercase tracking-[0.1em] text-t-accent",
      link: "group flex items-center gap-4 border-2 border-t-fg bg-t-bg px-5 py-4 text-[15px] font-black uppercase transition hover:bg-t-fg hover:text-t-bg",
      featured: "group flex items-center gap-4 bg-t-accent px-5 py-5 text-[17px] font-black uppercase text-t-on-accent",
      lookCard: "overflow-hidden border-2 border-t-fg bg-t-bg",
      lookTitle: "text-[13px] font-black uppercase",
      lookMeta: "text-[10px] font-bold uppercase text-t-fg/55",
      tag: "bg-t-fg px-2 py-0.5 text-[9px] font-black uppercase text-t-bg",
      stat: "border-2 border-t-fg bg-t-bg p-3 text-center",
      statValue: "text-[26px] font-black uppercase leading-none",
      chip: "border-2 border-t-fg px-3 py-1 text-[11px] font-black uppercase",
      input: "w-full border-2 border-t-fg bg-t-bg px-4 py-3 text-sm font-bold uppercase outline-none placeholder:text-t-fg/40",
      button: "bg-t-fg px-6 py-3 text-sm font-black uppercase text-t-bg",
      social: "grid h-10 w-10 place-items-center border-2 border-t-fg bg-t-bg font-black transition hover:bg-t-fg hover:text-t-bg",
      avatar: "h-24 w-24 border-2 border-t-fg object-cover grayscale contrast-125",
      monogram: "border-2 border-t-fg bg-t-accent font-black text-t-on-accent",
      badge: "font-black uppercase text-t-fg/45",
    },
  },
  vinyl: {
    label: "Vinyl",
    font: "grotesk",
    centered: true,
    numbered: false,
    tokens: {
      root: "bg-t-bg text-t-fg font-grotesk",
      name: "text-[40px] font-black leading-[0.95] tracking-tight text-t-accent",
      bio: "text-[14px] text-t-fg/75",
      meta: "text-[11px] uppercase tracking-[0.15em] text-t-fg/50",
      section: "text-[12px] font-bold uppercase tracking-[0.15em] text-t-fg/60",
      link: "group flex items-center gap-4 rounded-xl border border-t-fg/10 bg-t-fg/[0.05] px-5 py-4 text-[15px] font-medium backdrop-blur transition hover:bg-t-fg/10",
      featured: "group flex flex-col gap-1 rounded-xl bg-t-fg/[0.06] p-4 text-[15px] font-semibold",
      lookCard: "overflow-hidden rounded-xl border border-t-fg/10 bg-t-fg/[0.05]",
      lookTitle: "text-[14px] font-semibold",
      lookMeta: "text-[12px] text-t-accent",
      tag: "rounded-full bg-t-accent px-2 py-0.5 text-[9px] font-bold uppercase text-t-on-accent",
      stat: "rounded-xl border border-t-fg/10 bg-t-fg/[0.05] p-3 text-center",
      statValue: "text-[24px] font-black leading-none text-t-accent",
      chip: "rounded-full border border-t-fg/15 px-3 py-1 text-[11px]",
      input: "w-full rounded-full border border-t-fg/15 bg-t-fg/5 px-5 py-3 text-sm outline-none placeholder:text-t-fg/40",
      button: "rounded-full bg-t-accent px-6 py-3 text-sm font-bold text-t-on-accent",
      social: "grid h-10 w-10 place-items-center rounded-full border border-t-fg/15 transition hover:bg-t-accent hover:text-t-on-accent",
      avatar: "h-24 w-24 rounded-full border-2 border-t-accent object-cover",
      monogram: "bg-t-accent font-black text-t-on-accent",
      badge: "text-t-fg/45",
    },
  },
  ribbon: {
    label: "Ribbon",
    font: "display",
    centered: true,
    numbered: false,
    tokens: {
      root: "bg-t-bg text-t-fg font-sans",
      name: "text-[36px] font-bold leading-[1.05]",
      bio: "text-[14px] text-t-fg/70",
      meta: "text-[11px] uppercase tracking-[0.15em] text-t-fg/50",
      section: "text-[13px] font-semibold text-t-fg/70",
      link: "group flex items-center gap-4 rounded-full border border-t-fg/10 bg-t-fg/[0.04] px-6 py-4 text-[15px] font-medium transition hover:bg-t-fg/[0.08]",
      featured: "group flex items-center gap-4 rounded-full bg-t-accent px-6 py-4 text-[15px] font-bold text-t-on-accent",
      lookCard: "overflow-hidden rounded-2xl border border-t-fg/10 bg-t-bg",
      lookTitle: "text-[14px] font-semibold",
      lookMeta: "text-[12px] text-t-fg/55",
      tag: "rounded-full bg-t-bg/85 px-2.5 py-1 text-[9px] font-semibold uppercase text-t-fg",
      stat: "rounded-2xl border border-t-fg/10 p-3 text-center",
      statValue: "text-[24px] font-bold leading-none",
      chip: "rounded-full border border-t-fg/15 px-3 py-1 text-[12px]",
      input: "w-full rounded-full border border-t-fg/15 bg-transparent px-5 py-3 text-sm outline-none placeholder:text-t-fg/40",
      button: "rounded-full bg-t-fg px-6 py-3 text-sm font-semibold text-t-bg",
      social: "grid h-10 w-10 place-items-center rounded-full border border-t-fg/15 transition hover:bg-t-fg hover:text-t-bg",
      avatar: "h-24 w-24 rounded-full border-2 border-t-accent object-cover",
      monogram: "bg-t-accent font-bold text-t-on-accent",
      badge: "text-t-fg/45",
    },
  },
  frame: {
    label: "Frame",
    font: "display",
    centered: true,
    numbered: false,
    tokens: {
      root: "bg-t-bg text-t-fg font-sans",
      name: "text-[30px] italic leading-[1.1]",
      bio: "text-[13px] text-t-fg/65",
      meta: "text-[11px] uppercase tracking-[0.1em] text-t-fg/50",
      section: "text-[20px] italic text-t-fg",
      link: "group flex items-center gap-4 border border-t-fg/15 bg-t-bg px-5 py-4 text-[15px] shadow-[0_2px_10px_rgba(0,0,0,.08)] transition hover:border-t-fg/35",
      featured: "group flex items-center gap-4 border-[6px] border-t-bg bg-t-bg px-5 py-5 text-[16px] font-medium shadow-[0_8px_24px_rgba(0,0,0,.18)]",
      lookCard: "overflow-hidden border-[6px] border-t-bg bg-t-bg shadow-[0_8px_20px_rgba(0,0,0,.18)]",
      lookTitle: "pt-1 text-center text-[13px] italic",
      lookMeta: "text-center text-[11px] text-t-fg/55",
      tag: "bg-t-fg/80 px-2 py-0.5 text-[9px] uppercase text-t-bg",
      stat: "border border-t-fg/15 bg-t-bg p-3 text-center shadow-[0_2px_10px_rgba(0,0,0,.08)]",
      statValue: "text-[22px] italic leading-none",
      chip: "border border-t-fg/20 px-3 py-1 text-[11px]",
      input: "w-full border border-t-fg/20 bg-t-bg px-4 py-3 text-sm outline-none placeholder:text-t-fg/40",
      button: "bg-t-fg px-5 py-3 text-sm text-t-bg",
      social: "grid h-10 w-10 place-items-center border border-t-fg/15 transition hover:bg-t-fg hover:text-t-bg",
      avatar: "h-28 w-28 border-[6px] border-t-bg object-cover shadow-[0_8px_20px_rgba(0,0,0,.2)] -rotate-2",
      monogram: "border-[6px] border-t-bg bg-t-accent italic text-t-on-accent shadow-[0_8px_20px_rgba(0,0,0,.2)] -rotate-2",
      badge: "text-t-fg/45",
    },
  },
  badge: {
    label: "Badge",
    font: "grotesk",
    centered: true,
    numbered: false,
    tokens: {
      root: "bg-t-bg text-t-fg font-grotesk",
      name: "text-[28px] font-bold uppercase tracking-tight",
      bio: "text-[13px] text-t-fg/65",
      meta: "text-[11px] uppercase tracking-[0.15em] text-t-fg/50",
      section: "text-[12px] font-bold uppercase tracking-[0.1em] text-t-fg/60",
      link: "group flex items-center gap-4 border border-t-fg/15 bg-t-bg px-5 py-4 text-[14px] font-medium transition hover:border-t-fg/40",
      featured: "group flex items-center gap-4 border-2 border-t-fg bg-t-bg px-5 py-5 text-[15px] font-bold",
      lookCard: "overflow-hidden border border-t-fg/15 bg-t-bg",
      lookTitle: "text-[13px] font-semibold",
      lookMeta: "text-[11px] text-t-fg/55",
      tag: "border border-t-fg bg-t-bg px-2 py-0.5 text-[9px] font-bold uppercase",
      stat: "border border-t-fg/20 p-3 text-center",
      statValue: "text-[22px] font-bold leading-none",
      chip: "border border-t-fg/25 px-3 py-1 text-[11px] font-medium",
      input: "w-full border border-t-fg/20 bg-t-bg px-4 py-3 text-sm outline-none placeholder:text-t-fg/40",
      button: "border-2 border-t-fg bg-t-fg px-5 py-3 text-sm font-bold text-t-bg",
      social: "grid h-10 w-10 place-items-center border border-t-fg/20 transition hover:bg-t-fg hover:text-t-bg",
      avatar: "h-24 w-24 rounded-full border-[3px] border-double border-t-fg object-cover p-1",
      monogram: "rounded-full border-[3px] border-double border-t-fg bg-t-accent font-bold text-t-on-accent",
      badge: "font-semibold text-t-fg/45",
    },
  },
  split: {
    label: "Split",
    font: "syne",
    centered: true,
    numbered: false,
    tokens: {
      root: "bg-[linear-gradient(180deg,var(--t-accent)_0%,var(--t-accent)_38%,var(--t-bg)_38%,var(--t-bg)_100%)] text-t-fg font-sans",
      name: "text-[32px] font-extrabold leading-[1] text-t-on-accent",
      bio: "text-[13px] text-t-on-accent/85",
      meta: "text-[11px] uppercase tracking-[0.15em] text-t-on-accent/70",
      section: "text-[13px] font-bold text-t-fg/70",
      link: "group flex items-center gap-4 rounded-xl bg-t-bg px-5 py-4 text-[15px] font-semibold text-t-fg shadow-[0_6px_16px_rgba(0,0,0,.15)] transition hover:-translate-y-0.5",
      featured: "group flex items-center gap-4 rounded-xl bg-t-fg px-5 py-5 text-[16px] font-bold text-t-bg shadow-[0_8px_20px_rgba(0,0,0,.2)]",
      lookCard: "overflow-hidden rounded-xl bg-t-bg shadow-[0_6px_16px_rgba(0,0,0,.15)]",
      lookTitle: "text-[14px] font-semibold",
      lookMeta: "text-[12px] text-t-fg/55",
      tag: "rounded-full bg-t-fg px-2.5 py-1 text-[9px] font-bold uppercase text-t-bg",
      stat: "rounded-xl bg-t-bg p-3 text-center shadow-[0_6px_16px_rgba(0,0,0,.15)]",
      statValue: "text-[22px] font-extrabold leading-none",
      chip: "rounded-full bg-t-bg px-3 py-1 text-[12px] font-medium shadow",
      input: "w-full rounded-xl bg-t-bg px-4 py-3 text-sm outline-none placeholder:text-t-fg/40",
      button: "rounded-xl bg-t-fg px-6 py-3 text-sm font-bold text-t-bg",
      social: "grid h-10 w-10 place-items-center rounded-full bg-t-bg shadow transition hover:-translate-y-0.5",
      avatar: "h-24 w-24 rounded-full border-4 border-t-bg object-cover shadow-[0_8px_20px_rgba(0,0,0,.25)]",
      monogram: "border-4 border-t-bg bg-t-fg font-extrabold text-t-bg shadow-[0_8px_20px_rgba(0,0,0,.25)]",
      badge: "text-t-fg/45",
    },
  },
  zine: {
    label: "Zine",
    font: "grotesk",
    centered: false,
    numbered: true,
    tokens: {
      root: "bg-t-bg text-t-fg font-grotesk grayscale-[0.15] contrast-125",
      name: "text-[46px] font-black uppercase leading-[0.85] tracking-[-0.02em]",
      bio: "text-[13px] uppercase text-t-fg/70",
      meta: "text-[10px] uppercase tracking-[0.2em] text-t-fg/50",
      section: "border-b-4 border-t-fg pb-1 text-[11px] font-bold uppercase tracking-[0.1em]",
      link: "group flex items-center gap-4 border-2 border-t-fg bg-t-bg px-5 py-4 text-[14px] font-bold uppercase transition hover:bg-t-fg hover:text-t-bg",
      featured: "group flex items-center gap-4 border-2 border-t-fg bg-t-fg px-5 py-5 text-[15px] font-black uppercase text-t-bg",
      lookCard: "overflow-hidden border-2 border-t-fg bg-t-bg -rotate-1",
      lookTitle: "text-[12px] font-bold uppercase",
      lookMeta: "text-[10px] uppercase text-t-fg/55",
      tag: "bg-t-fg px-2 py-0.5 text-[9px] font-black uppercase text-t-bg",
      stat: "border-2 border-t-fg p-3 text-center",
      statValue: "text-[24px] font-black leading-none",
      chip: "border-2 border-t-fg px-3 py-1 text-[10px] font-bold uppercase",
      input: "w-full border-2 border-t-fg bg-t-bg px-4 py-3 text-sm font-bold uppercase outline-none placeholder:text-t-fg/40",
      button: "border-2 border-t-fg bg-t-fg px-5 py-3 text-xs font-black uppercase text-t-bg",
      social: "grid h-10 w-10 place-items-center border-2 border-t-fg font-black transition hover:bg-t-fg hover:text-t-bg",
      avatar: "h-24 w-24 border-2 border-t-fg object-cover grayscale rotate-1",
      monogram: "border-2 border-t-fg bg-t-fg font-black text-t-bg rotate-1",
      badge: "font-bold uppercase text-t-fg/45",
    },
  },
  stamp: {
    label: "Stamp",
    font: "display",
    centered: true,
    numbered: false,
    tokens: {
      root: "bg-t-bg text-t-fg font-sans",
      name: "text-[32px] italic leading-[1.05]",
      bio: "text-[13px] text-t-fg/65",
      meta: "text-[11px] uppercase tracking-[0.1em] text-t-fg/50",
      section: "text-[18px] italic text-t-fg",
      link: "group flex items-center gap-4 bg-[radial-gradient(circle,transparent_5px,var(--t-fg)_5.5px)] bg-[length:14px_14px] bg-repeat-x bg-top p-[3px] text-[15px] transition",
      featured: "group flex items-center gap-4 border border-t-fg/15 bg-t-accent/10 px-5 py-5 text-[16px] font-semibold",
      lookCard: "overflow-hidden border border-t-fg/15 bg-t-bg [clip-path:polygon(0%_4%,2%_0%,4%_4%,6%_0%,8%_4%,10%_0%,12%_4%,14%_0%,16%_4%,18%_0%,20%_4%,22%_0%,24%_4%,26%_0%,28%_4%,30%_0%,32%_4%,34%_0%,36%_4%,38%_0%,40%_4%,42%_0%,44%_4%,46%_0%,48%_4%,50%_0%,52%_4%,54%_0%,56%_4%,58%_0%,60%_4%,62%_0%,64%_4%,66%_0%,68%_4%,70%_0%,72%_4%,74%_0%,76%_4%,78%_0%,80%_4%,82%_0%,84%_4%,86%_0%,88%_4%,90%_0%,92%_4%,94%_0%,96%_4%,98%_0%,100%_4%,100%_100%,0%_100%)]",
      lookTitle: "text-[13px]",
      lookMeta: "text-[11px] text-t-fg/55",
      tag: "bg-t-bg/85 px-2 py-0.5 text-[9px] uppercase text-t-fg",
      stat: "border border-t-fg/15 p-3 text-center",
      statValue: "text-[22px] italic leading-none",
      chip: "border border-t-fg/20 px-3 py-1 text-[11px] italic",
      input: "w-full border border-t-fg/20 bg-t-bg px-4 py-3 text-sm outline-none placeholder:text-t-fg/40",
      button: "border border-t-fg bg-t-bg px-5 py-3 text-sm",
      social: "grid h-10 w-10 place-items-center border border-t-fg/20 transition hover:bg-t-fg hover:text-t-bg",
      avatar: "h-24 w-24 border border-t-fg/40 object-cover p-1",
      monogram: "border border-t-fg/40 bg-t-accent italic text-t-on-accent",
      badge: "italic text-t-fg/45",
    },
  },
  carnival: {
    label: "Carnival",
    font: "syne",
    centered: true,
    numbered: false,
    tokens: {
      root: "bg-t-bg text-t-fg font-sans",
      name: "text-[34px] font-black leading-[1] text-t-accent",
      bio: "text-[14px] font-medium text-t-fg/75",
      meta: "text-[11px] font-bold uppercase tracking-[0.1em] text-t-fg/55",
      section: "text-[13px] font-black uppercase tracking-[0.1em] text-t-accent",
      link: "group flex items-center gap-4 rounded-full border-[3px] border-t-fg bg-[repeating-linear-gradient(135deg,var(--t-bg)_0_10px,color-mix(in_srgb,var(--t-accent)_14%,var(--t-bg))_10px_20px)] px-5 py-4 text-[15px] font-bold",
      featured: "group flex items-center gap-4 rounded-full border-[3px] border-t-fg bg-t-accent px-5 py-5 text-[16px] font-black text-t-on-accent",
      lookCard: "overflow-hidden rounded-2xl border-[3px] border-t-fg bg-t-bg",
      lookTitle: "text-[14px] font-bold",
      lookMeta: "text-[11px] font-medium text-t-fg/55",
      tag: "rounded-full bg-t-fg px-2 py-0.5 text-[9px] font-black uppercase text-t-bg",
      stat: "rounded-2xl border-[3px] border-t-fg p-3 text-center",
      statValue: "text-[22px] font-black leading-none text-t-accent",
      chip: "rounded-full border-2 border-t-fg px-3 py-1 text-[11px] font-bold",
      input: "w-full rounded-full border-[3px] border-t-fg bg-t-bg px-4 py-3 text-sm font-medium outline-none",
      button: "rounded-full border-[3px] border-t-fg bg-t-accent px-6 py-3 text-sm font-black text-t-on-accent",
      social: "grid h-10 w-10 place-items-center rounded-full border-[3px] border-t-fg transition hover:bg-t-accent",
      avatar: "h-24 w-24 rounded-full border-[4px] border-t-fg object-cover",
      monogram: "border-[4px] border-t-fg bg-t-accent font-black text-t-on-accent",
      badge: "font-bold text-t-fg/45",
    },
  },
  catalog: {
    label: "Catalog",
    font: "sans",
    centered: false,
    numbered: false,
    tokens: {
      root: "bg-t-bg text-t-fg font-sans",
      name: "text-[26px] font-bold tracking-tight",
      bio: "text-[13px] leading-relaxed text-t-fg/65",
      meta: "text-[12px] text-t-fg/50",
      section: "text-[12px] font-semibold uppercase tracking-[0.08em] text-t-fg/60",
      link: "group flex items-center gap-4 rounded-lg border border-t-fg/12 bg-t-bg px-5 py-3.5 text-[14px] font-medium transition hover:bg-t-fg/[0.04]",
      featured: "group flex items-center gap-4 rounded-lg bg-t-fg px-5 py-4 text-[14px] font-semibold text-t-bg",
      lookCard: "overflow-hidden rounded-lg border border-t-fg/12 bg-t-bg",
      lookTitle: "text-[13px] font-medium",
      lookMeta: "text-[12px] text-t-fg/55",
      tag: "rounded bg-t-fg/90 px-2 py-0.5 text-[9px] uppercase text-t-bg",
      stat: "rounded-lg border border-t-fg/12 p-3 text-center",
      statValue: "text-[20px] font-bold leading-none",
      chip: "rounded border border-t-fg/15 px-2.5 py-1 text-[12px]",
      input: "w-full rounded-lg border border-t-fg/15 bg-t-bg px-4 py-3 text-sm outline-none placeholder:text-t-fg/40",
      button: "rounded-lg bg-t-fg px-5 py-3 text-sm font-semibold text-t-bg",
      social: "grid h-9 w-9 place-items-center rounded-lg border border-t-fg/12 text-t-fg/70 transition hover:bg-t-fg/5",
      avatar: "h-16 w-16 rounded-lg object-cover",
      monogram: "rounded-lg bg-t-accent font-semibold text-t-on-accent",
      badge: "text-t-fg/45",
    },
  },
  arch: {
    label: "Arch Studio",
    font: "display",
    centered: true,
    numbered: false,
    tokens: {
      root: "bg-t-bg text-t-fg font-sans",
      name: "text-[32px] italic leading-[1.05] tracking-tight",
      bio: "text-[13px] font-medium leading-relaxed text-t-fg/70 max-w-[34ch]",
      meta: "text-[11px] uppercase tracking-[0.18em] text-t-fg/50",
      section: "text-[15px] italic font-semibold text-t-fg",
      link: "group flex items-center gap-4 rounded-t-[36px] rounded-b-2xl border border-t-fg/15 bg-t-bg/90 px-5 py-4 text-[14px] font-medium shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition hover:shadow-[0_6px_20px_rgba(0,0,0,0.1)]",
      featured: "group flex items-center gap-4 rounded-t-[36px] rounded-b-2xl border-2 border-t-accent bg-t-accent px-5 py-5 text-[15px] font-bold text-t-on-accent shadow-[0_8px_24px_rgba(0,0,0,0.14)]",
      lookCard: "overflow-hidden rounded-t-[44px] rounded-b-2xl border border-t-fg/15 bg-t-bg shadow-[0_4px_16px_rgba(0,0,0,0.06)]",
      lookTitle: "text-[13px] italic font-medium pt-1",
      lookMeta: "text-[11px] text-t-fg/60",
      tag: "rounded-full bg-t-fg/80 px-2 py-0.5 text-[9px] uppercase text-t-bg",
      stat: "rounded-t-3xl rounded-b-xl border border-t-fg/15 p-3 text-center shadow-sm",
      statValue: "text-[22px] italic leading-none text-t-accent",
      chip: "rounded-full border border-t-fg/20 px-3 py-1 text-[11px]",
      input: "w-full rounded-2xl border border-t-fg/20 bg-t-bg px-4 py-3 text-sm outline-none",
      button: "rounded-full bg-t-fg px-6 py-3 text-sm font-medium text-t-bg",
      social: "grid h-10 w-10 place-items-center rounded-full border border-t-fg/20 transition hover:bg-t-fg hover:text-t-bg",
      avatar: "h-24 w-24 rounded-t-full rounded-b-2xl border-2 border-t-accent object-cover shadow-[0_8px_20px_rgba(0,0,0,0.12)]",
      monogram: "rounded-t-full rounded-b-2xl border-2 border-t-accent bg-t-accent italic font-bold text-t-on-accent shadow-sm",
      badge: "text-t-fg/45",
    },
  },
  clay: {
    label: "Soft Clay",
    font: "sans",
    centered: true,
    numbered: false,
    tokens: {
      root: "bg-t-bg text-t-fg font-sans",
      name: "text-[28px] font-bold tracking-tight text-t-fg",
      bio: "text-[13px] leading-relaxed text-t-fg/70",
      meta: "text-[11px] font-semibold uppercase tracking-[0.12em] text-t-fg/50",
      section: "text-[13px] font-bold tracking-wide uppercase text-t-fg/60",
      link: "group flex items-center gap-4 rounded-[26px] bg-t-bg px-5 py-4 text-[14px] font-semibold text-t-fg shadow-[inset_0_1px_1px_rgba(255,255,255,0.7),0_8px_20px_rgba(0,0,0,0.06)] border border-t-fg/8 transition hover:translate-y-[-1px] hover:shadow-[0_12px_24px_rgba(0,0,0,0.09)]",
      featured: "group flex items-center gap-4 rounded-[26px] bg-t-accent px-5 py-5 text-[15px] font-bold text-t-on-accent shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),0_10px_28px_rgba(0,0,0,0.15)]",
      lookCard: "overflow-hidden rounded-[26px] bg-t-bg shadow-[0_8px_20px_rgba(0,0,0,0.07)] border border-t-fg/8",
      lookTitle: "text-[13px] font-bold",
      lookMeta: "text-[11px] font-medium text-t-fg/55",
      tag: "rounded-full bg-t-fg/10 px-2.5 py-0.5 text-[9px] font-bold uppercase text-t-fg",
      stat: "rounded-[22px] bg-t-bg p-3.5 text-center shadow-[0_6px_16px_rgba(0,0,0,0.05)] border border-t-fg/6",
      statValue: "text-[22px] font-black leading-none text-t-fg",
      chip: "rounded-full bg-t-fg/8 px-3.5 py-1 text-[11px] font-semibold",
      input: "w-full rounded-[20px] border border-t-fg/12 bg-t-bg px-4 py-3 text-sm font-medium outline-none shadow-inner",
      button: "rounded-full bg-t-fg px-6 py-3 text-sm font-bold text-t-bg shadow-md",
      social: "grid h-10 w-10 place-items-center rounded-full bg-t-bg shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-t-fg/6 transition hover:scale-105",
      avatar: "h-24 w-24 rounded-[30px] border-4 border-t-bg object-cover shadow-[0_10px_26px_rgba(0,0,0,0.12)]",
      monogram: "rounded-[30px] border-4 border-t-bg bg-t-accent font-bold text-t-on-accent shadow-[0_10px_26px_rgba(0,0,0,0.12)]",
      badge: "text-t-fg/45",
    },
  },
  bakes: {
    label: "Bobby Bakes",
    font: "unbounded",
    centered: false,
    numbered: false,
    tokens: {
      root: "bg-t-bg text-t-fg font-sans",
      name: "text-[38px] font-black uppercase leading-[0.9] tracking-[-0.03em] drop-shadow-[0_2px_0_rgba(0,0,0,0.2)]",
      bio: "text-[14px] font-semibold text-t-fg/85",
      meta: "text-[11px] font-black uppercase tracking-[0.14em] text-t-accent",
      section: "text-[14px] font-black uppercase tracking-[0.1em] text-t-fg",
      link: "group flex items-center gap-4 rounded-3xl border-2 border-t-fg/15 bg-white/90 backdrop-blur-md px-5 py-4 text-[15px] font-bold text-t-fg shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition hover:border-t-accent hover:shadow-[0_12px_32px_rgba(0,0,0,0.12)]",
      featured: "group flex items-center gap-4 rounded-3xl border-2 border-t-fg bg-t-fg px-5 py-5 text-[16px] font-black text-t-bg shadow-[0_12px_32px_rgba(0,0,0,0.16)]",
      lookCard: "overflow-hidden rounded-3xl border-2 border-t-fg/12 bg-white/90 backdrop-blur-md shadow-[0_8px_24px_rgba(0,0,0,0.08)]",
      lookTitle: "text-[14px] font-bold",
      lookMeta: "text-[12px] font-semibold text-t-accent",
      tag: "rounded-full bg-t-accent px-2.5 py-0.5 text-[9px] font-black uppercase text-t-on-accent",
      stat: "rounded-3xl border border-t-fg/15 bg-white/80 p-3.5 text-center shadow-sm",
      statValue: "text-[24px] font-black leading-none text-t-accent",
      chip: "rounded-full border border-t-fg/20 px-3 py-1 text-[11px] font-bold",
      input: "w-full rounded-2xl border-2 border-t-fg/15 bg-white px-4 py-3 text-sm font-semibold outline-none",
      button: "rounded-full bg-t-accent px-6 py-3 text-sm font-black text-t-on-accent shadow-md",
      social: "grid h-11 w-11 place-items-center rounded-2xl bg-t-accent text-t-on-accent shadow-md transition hover:scale-110",
      avatar: "h-28 w-28 rounded-3xl border-[3px] border-white object-cover shadow-[0_12px_32px_rgba(0,0,0,0.18)] rotate-1",
      monogram: "rounded-3xl border-[3px] border-white bg-t-accent font-black text-t-on-accent shadow-[0_12px_32px_rgba(0,0,0,0.18)] rotate-1",
      badge: "font-black text-t-fg/50",
    },
  },
  lavender: {
    label: "Lavender Farm",
    font: "bodoni",
    centered: true,
    numbered: false,
    tokens: {
      root: "bg-t-bg text-t-fg font-sans",
      name: "text-[32px] italic leading-[1.08] text-t-fg",
      bio: "text-[13px] leading-relaxed text-t-fg/70 max-w-[34ch]",
      meta: "text-[11px] uppercase tracking-[0.2em] text-t-fg/45",
      section: "text-[13px] uppercase tracking-[0.18em] font-semibold text-t-accent",
      link: "group flex items-center gap-4 rounded-xl border border-t-accent/25 bg-t-accent/5 px-5 py-4 text-[14px] font-medium text-t-fg transition hover:bg-t-accent/10 hover:border-t-accent/40",
      featured: "group flex items-center gap-4 rounded-xl border-2 border-t-accent bg-t-accent px-5 py-5 text-[15px] font-semibold text-t-on-accent shadow-[0_6px_20px_rgba(0,0,0,0.08)]",
      lookCard: "overflow-hidden rounded-xl border border-t-accent/20 bg-t-bg shadow-sm",
      lookTitle: "text-[13px] italic font-medium pt-0.5",
      lookMeta: "text-[11px] text-t-fg/55",
      tag: "rounded-full bg-t-accent px-2.5 py-0.5 text-[9px] uppercase tracking-wider text-t-on-accent",
      stat: "rounded-xl border border-t-accent/20 p-3 text-center",
      statValue: "text-[22px] italic leading-none text-t-accent",
      chip: "rounded-full border border-t-accent/30 px-3 py-1 text-[11px]",
      input: "w-full rounded-xl border border-t-accent/30 bg-t-bg px-4 py-3 text-sm outline-none",
      button: "rounded-xl bg-t-accent px-6 py-3 text-sm font-medium text-t-on-accent",
      social: "grid h-10 w-10 place-items-center rounded-full border border-t-accent/30 text-t-fg transition hover:bg-t-accent hover:text-t-on-accent",
      avatar: "h-24 w-24 rounded-full border-2 border-t-accent object-cover p-1 shadow-md",
      monogram: "rounded-full border-2 border-t-accent bg-t-accent italic font-bold text-t-on-accent shadow-md",
      badge: "italic text-t-fg/40",
    },
  },
};

const T = (
  id: string,
  label: string,
  family: Family,
  [bg, fg, accent, accent2, onAccent]: [string, string, string, string, string],
  extra: Partial<ThemeDef> = {},
): ThemeDef => ({ id, label, family, bg, fg, accent, accent2, onAccent, ...extra });

export const themeList: ThemeDef[] = [
  // Editorial: paper, serif, ink
  T("editorial", "Editorial", "editorial", ["#f4efe6", "#141414", "#141414", "#b08d6a", "#f4efe6"]),
  T("sage-paper", "Sage Paper", "editorial", ["#eef1ea", "#1f2a22", "#2f4a3a", "#9fb3a0", "#eef1ea"]),
  T("terracotta", "Terracotta", "deco", ["#f6ece4", "#2b1a14", "#b5532e", "#e0a585", "#fff6ef"]),
  T("navy-ink", "Navy Ink", "luxury", ["#f3f4f7", "#0f1b3d", "#0f1b3d", "#8fa0c8", "#f3f4f7"]),
  T("rose-paper", "Rose Paper", "deco", ["#fbeff0", "#3a1f27", "#a33a5b", "#e8a9b8", "#fff4f6"]),
  T("night-edition", "Night Edition", "luxury", ["#121212", "#efe9df", "#efe9df", "#6b5a48", "#121212"]),
  T("newsprint", "Newsprint", "luxury", ["#ecebe6", "#111111", "#d12b1f", "#9a9890", "#ffffff"], { font: "display" }),

  // Chrome: live 3D metal
  T("chrome", "Liquid Chrome", "chrome", ["#060607", "#ffffff", "#ffffff", "#9aa0aa", "#0b0b0c"], {
    chrome: ["#ffffff", "#9aa0aa", "#6f747d"],
    blob: "#eceef2",
  }),
  T("gold-chrome", "Gold Chrome", "chrome", ["#0a0805", "#f6eedf", "#e3c27a", "#c9a45a", "#1a1206"], {
    chrome: ["#fff4d6", "#c9a45a", "#6b4f1d"],
    blob: "#e3c27a",
  }),
  T("rose-gold", "Rose Gold", "chrome", ["#0b0708", "#f8e9e7", "#e8b0a5", "#d59a8f", "#1d0e0c"], {
    chrome: ["#ffe9e4", "#d59a8f", "#7a4a44"],
    blob: "#e8b0a5",
  }),
  T("ice-chrome", "Ice Chrome", "chrome", ["#05080d", "#e8f1ff", "#c8d8f5", "#9fb8e0", "#08111f"], {
    chrome: ["#ffffff", "#9fb8e0", "#44597a"],
    blob: "#c8d8f5",
  }),
  T("black-chrome", "Black Chrome", "chrome", ["#e9e9ec", "#111114", "#3a3a40", "#9a9aa2", "#ffffff"], {
    chrome: ["#9a9aa2", "#3a3a40", "#0d0d10"],
    blob: "#3a3a42",
  }),
  T("emerald-chrome", "Emerald Chrome", "chrome", ["#030806", "#e6fff4", "#9fe0c2", "#7fd1ae", "#04140d"], {
    chrome: ["#eafff5", "#7fd1ae", "#2c6b52"],
    blob: "#9fe0c2",
  }),

  // Glass: soft gradients, frosted cards
  T("atelier", "Atelier", "glass", ["#fbf5f2", "#3b2a33", "#e7a3b5", "#c9a2e8", "#ffffff"]),
  T("ocean-glass", "Ocean Glass", "glass", ["#f1f7fb", "#10324a", "#5fb4e6", "#7be0d0", "#ffffff"]),
  T("mint-glass", "Mint Glass", "organic", ["#f2fbf6", "#173b2c", "#7fdcae", "#c3f08a", "#173b2c"]),
  T("sunset-glass", "Sunset Glass", "organic", ["#fff5ee", "#3d1f12", "#ff9a62", "#ff6fa3", "#ffffff"]),
  T("lavender-night", "Lavender Night", "handwritten", ["#141024", "#efeaff", "#8e7bff", "#ff8fd8", "#ffffff"]),
  T("peach-fuzz", "Peach Fuzz", "organic", ["#fff3ec", "#4a2a1d", "#ffbe98", "#ffd7a8", "#4a2a1d"]),
  T("aurora", "Aurora", "handwritten", ["#07121a", "#e9fbff", "#3be0c0", "#7b7bff", "#04121a"]),

  // Mono: big type, strict grid
  T("noir", "Noir", "mono", ["#000000", "#ffffff", "#ffffff", "#666666", "#000000"], { mono: true }),
  T("paper-white", "Paper White", "mono", ["#fafafa", "#0a0a0a", "#0a0a0a", "#999999", "#fafafa"], { mono: true }),
  T("concrete", "Concrete", "brutalist", ["#d9d7d2", "#1b1b1b", "#1b1b1b", "#8a8780", "#d9d7d2"], { mono: true }),
  T("blueprint", "Blueprint", "brutalist", ["#0b2a6b", "#e6eeff", "#e6eeff", "#6f8fd6", "#0b2a6b"]),
  T("red-line", "Red Line", "brutalist", ["#0a0a0a", "#f2f2f2", "#ff2d2d", "#ff2d2d", "#ffffff"]),
  T("graphite", "Graphite", "brutalist", ["#1c1c1e", "#e5e5e7", "#e5e5e7", "#6e6e73", "#1c1c1e"], { mono: true }),

  // Pop: thick outlines, stickers
  T("candy", "Candy Y2K", "pop", ["#ffd6ec", "#1a0b2e", "#ff3ea5", "#f2559f", "#ffffff"]),
  T("lime-pop", "Lime Pop", "ticket", ["#efffc4", "#14210a", "#3c7d0e", "#ffe14d", "#ffffff"]),
  T("sky-pop", "Sky Pop", "ticket", ["#d8efff", "#0b1a33", "#2f6bff", "#ffd23f", "#ffffff"]),
  T("tangerine", "Tangerine", "ticket", ["#ffe4cc", "#2a1200", "#ff6a00", "#8af5d4", "#ffffff"]),
  T("grape-soda", "Grape Soda", "duotone", ["#e8dcff", "#1d0b3a", "#7b2cff", "#ff9de2", "#ffffff"]),
  T("bubblegum-dark", "Bubblegum Dark", "duotone", ["#1d0b2e", "#ffe8f6", "#ff5cbf", "#c7ff5b", "#1d0b2e"]),
  T("cherry", "Cherry", "duotone", ["#ffe1e1", "#2b0606", "#e3122b", "#ffd1dc", "#ffffff"]),

  // Minimal: quiet and clean
  T("minimal-light", "Minimal Light", "minimal", ["#ffffff", "#111111", "#111111", "#f2f2f2", "#ffffff"]),
  T("minimal-dark", "Minimal Dark", "minimal", ["#0e0e10", "#f2f2f2", "#f2f2f2", "#26262a", "#0e0e10"]),
  T("stone", "Stone", "minimal", ["#f4f1ec", "#2b2722", "#2b2722", "#d8d2c8", "#f4f1ec"]),
  T("forest", "Forest", "minimal", ["#0f1f17", "#e7f2ea", "#9be5b4", "#1d3a2b", "#0f1f17"]),
  T("ocean-minimal", "Ocean", "minimal", ["#f2f7fb", "#0d2236", "#1f6feb", "#d6e6f8", "#ffffff"]),
  T("clay", "Clay", "minimal", ["#efe4da", "#3a2618", "#b8643c", "#dcc6b3", "#ffffff"], { font: "display" }),
  T("butter", "Butter", "minimal", ["#fff8db", "#2d2500", "#2d2500", "#f1e7b8", "#fff8db"]),

  // Gradient: moving colour fields
  T("sunrise", "Sunrise", "gradient", ["#2a0f3a", "#ffffff", "#ff7a59", "#ffcf5c", "#2a0f3a"]),
  T("electric", "Electric", "gradient", ["#0a0f3d", "#ffffff", "#3d5cff", "#00e0ff", "#0a0f3d"]),
  T("berry", "Berry", "gradient", ["#2b0820", "#ffffff", "#ff3d8b", "#9b5cff", "#2b0820"]),
  T("lagoon", "Lagoon", "gradient", ["#032b2b", "#ffffff", "#00c2a8", "#3a7bff", "#032b2b"]),
  T("peachy", "Peachy", "gradient", ["#5a2a1a", "#ffffff", "#ff9a8b", "#ffd3a5", "#5a2a1a"]),

  // Neon: glow after dark
  T("neon-pink", "Neon Pink", "neon", ["#0a0610", "#f5e9ff", "#ff2bd6", "#7a2bff", "#0a0610"]),
  T("neon-lime", "Neon Lime", "terminal", ["#060a04", "#eaffd9", "#b6ff2b", "#2bffb0", "#060a04"]),
  T("cyber-blue", "Cyber Blue", "terminal", ["#030914", "#e0f4ff", "#2bd9ff", "#7a5cff", "#030914"]),
  T("arcade", "Arcade", "terminal", ["#0b0614", "#fff3c4", "#ffd60a", "#ff2b6a", "#0b0614"]),
  T("vapor", "Vapor", "neon", ["#120a24", "#ffe9fb", "#ff71ce", "#01cdfe", "#120a24"]),

  // Editorial: more papers & inks
  T("blush-editorial", "Blush Editorial", "editorial", ["#fbeef0", "#301016", "#c23b5a", "#f0b8c4", "#fff6f7"]),
  T("mint-editorial", "Mint Editorial", "editorial", ["#eef8f1", "#0e2b1c", "#1f7a4d", "#9fd9b8", "#eef8f1"]),
  T("mustard-press", "Mustard Press", "deco", ["#faf0da", "#2b2004", "#b8860b", "#e8c468", "#2b2004"]),
  T("lilac-letters", "Lilac Letters", "handwritten", ["#f5f0fb", "#241433", "#6b3fa0", "#c9a8e8", "#f5f0fb"]),
  T("charcoal-script", "Charcoal Script", "editorial", ["#1a1a1a", "#f0ece3", "#f0ece3", "#8a7d68", "#1a1a1a"]),
  T("coral-column", "Coral Column", "editorial", ["#fff0ec", "#3a1208", "#ff6f4d", "#ffc4b2", "#ffffff"]),

  // Chrome: more metals
  T("titanium", "Titanium", "chrome", ["#0a0c0e", "#eef2f4", "#eef2f4", "#7a8891", "#0a0c0e"], { chrome: ["#f2f6f8", "#7a8891", "#39444c"], blob: "#c7d2d8" }),
  T("copper-chrome", "Copper Chrome", "chrome", ["#0c0705", "#ffe9db", "#e58a52", "#c76a35", "#1a0d06"], { chrome: ["#ffd9c0", "#c76a35", "#6b3417"], blob: "#e58a52" }),
  T("violet-chrome", "Violet Chrome", "chrome", ["#07050f", "#ede6ff", "#a98cff", "#7c5cff", "#0d0920"], { chrome: ["#e3d9ff", "#a98cff", "#4a2f99"], blob: "#a98cff" }),
  T("mint-chrome", "Mint Chrome", "chrome", ["#040a08", "#e3fff3", "#8fe8c4", "#5fd1a4", "#052016"], { chrome: ["#eafff6", "#5fd1a4", "#1f6b4b"], blob: "#8fe8c4" }),
  T("ruby-chrome", "Ruby Chrome", "chrome", ["#0a0304", "#ffe3e6", "#e8486b", "#c22b4a", "#1f060a"], { chrome: ["#ffd6dc", "#c22b4a", "#5c1020"], blob: "#e8486b" }),
  T("graphite-chrome", "Graphite Chrome", "chrome", ["#09090b", "#e6e6ea", "#b7b9c2", "#7d7f8a", "#09090b"], { chrome: ["#e6e6ea", "#b7b9c2", "#4a4b52"], blob: "#b7b9c2" }),

  // Glass: softer, cuter
  T("cotton-candy", "Cotton Candy", "organic", ["#fdf3fb", "#381b36", "#ff9fd6", "#9fd6ff", "#ffffff"]),
  T("seafoam-glass", "Seafoam Glass", "glass", ["#eefcf9", "#0c3530", "#5fe0c6", "#a6f0d9", "#0c3530"]),
  T("cherry-blossom", "Cherry Blossom", "organic", ["#fff3f6", "#3a1620", "#ff8fab", "#ffd1dc", "#ffffff"]),
  T("violet-mist", "Violet Mist", "glass", ["#f6f1fd", "#261a38", "#b38aff", "#d9c4ff", "#ffffff"]),
  T("citrus-glass", "Citrus Glass", "glass", ["#fffaf0", "#3a2a06", "#ffb347", "#ffe08a", "#3a2a06"]),
  T("frost-glass", "Frost Glass", "glass", ["#eef7fb", "#0e2733", "#6ec6e8", "#bfe8f7", "#0e2733"]),

  // Mono: more quiet neutrals
  T("ivory-mono", "Ivory Mono", "mono", ["#fdfcf8", "#17160f", "#17160f", "#a39f8e", "#fdfcf8"], { mono: true }),
  T("chalk-mono", "Chalk Mono", "mono", ["#f3f2ef", "#232220", "#232220", "#9a9892", "#f3f2ef"], { mono: true }),
  T("ink-mono", "Ink Mono", "mono", ["#07070a", "#eceaf4", "#eceaf4", "#5b5a66", "#07070a"], { mono: true }),
  T("slate-mono", "Slate Mono", "mono", ["#232a30", "#eef2f4", "#eef2f4", "#7c8890", "#232a30"]),
  T("cream-mono", "Cream Mono", "mono", ["#f6efe0", "#241f14", "#241f14", "#b3a583", "#f6efe0"], { mono: true }),
  T("onyx-mono", "Onyx Mono", "brutalist", ["#121212", "#f5f5f5", "#ff3b30", "#ff3b30", "#ffffff"]),

  // Pop: louder & cuter
  T("bubblegum-pop", "Bubblegum Pop", "pop", ["#ffe1f3", "#2b0a1e", "#ff4fa3", "#ffe14d", "#ffffff"]),
  T("mango-pop", "Mango Pop", "pop", ["#fff2d6", "#2e1a00", "#ff9f1c", "#ffe14d", "#ffffff"]),
  T("blueberry-pop", "Blueberry Pop", "duotone", ["#dde8ff", "#0a1a3a", "#355cff", "#9fd6ff", "#ffffff"]),
  T("watermelon", "Watermelon", "duotone", ["#e8ffe0", "#0d2b0a", "#ff4d6d", "#7ed957", "#ffffff"]),
  T("unicorn", "Unicorn", "duotone", ["#fdeaff", "#1f0a2e", "#c850ff", "#ffd36e", "#ffffff"]),
  T("peppermint", "Peppermint", "pop", ["#fff5f5", "#2b0808", "#ff4d4d", "#8fe0c0", "#ffffff"]),

  // Minimal: fresh neutrals
  T("sand-minimal", "Sand Minimal", "minimal", ["#f7f1e7", "#2a2317", "#2a2317", "#ddd1b8", "#f7f1e7"]),
  T("sage-minimal", "Sage Minimal", "minimal", ["#eef3ec", "#1b2a1f", "#1b2a1f", "#c3d6c6", "#eef3ec"]),
  T("blush-minimal", "Blush Minimal", "minimal", ["#fdf1f1", "#2e1414", "#2e1414", "#f0cfcf", "#fdf1f1"]),
  T("sky-minimal", "Sky Minimal", "minimal", ["#eef6fb", "#102333", "#102333", "#c6e2f2", "#eef6fb"]),
  T("charcoal-minimal", "Charcoal Minimal", "minimal", ["#1d1d1f", "#f2f2f2", "#f2f2f2", "#3a3a3d", "#1d1d1f"]),
  T("cream-minimal", "Cream Minimal", "minimal", ["#fbf7ef", "#2c2416", "#2c2416", "#e4d8bf", "#fbf7ef"]),

  // Gradient: dreamy skies
  T("cotton-sky", "Cotton Sky", "gradient", ["#2a1f3a", "#ffffff", "#ff9fd6", "#9fd6ff", "#2a1f3a"]),
  T("flamingo", "Flamingo", "gradient", ["#3a1326", "#ffffff", "#ff6fa5", "#ffb199", "#3a1326"]),
  T("citrus-burst", "Citrus Burst", "gradient", ["#3a2a06", "#ffffff", "#ffb347", "#ffe14d", "#3a2a06"]),
  T("galaxy", "Galaxy", "gradient", ["#0c0a2a", "#ffffff", "#7b5cff", "#2bd9ff", "#0c0a2a"]),
  T("coral-reef", "Coral Reef", "gradient", ["#06282b", "#ffffff", "#ff7e5f", "#2bc4b8", "#06282b"]),
  T("mint-dream", "Mint Dream", "gradient", ["#06281f", "#ffffff", "#5fe0c6", "#c7ffb3", "#06281f"]),

  // Neon: brighter after-dark
  T("hot-pink-neon", "Hot Pink Neon", "neon", ["#0a0510", "#ffe6f5", "#ff2daf", "#ff8ad8", "#0a0510"]),
  T("laser-green", "Laser Green", "terminal", ["#030a05", "#dfffe0", "#2bff6a", "#9fffb0", "#030a05"]),
  T("ultraviolet", "Ultraviolet", "neon", ["#07031a", "#efe6ff", "#8a2bff", "#c88aff", "#07031a"]),
  T("neon-orange", "Neon Orange", "neon", ["#120603", "#ffe9d6", "#ff6a2b", "#ffb088", "#120603"]),
  T("electric-teal", "Electric Teal", "terminal", ["#02100f", "#d6fff9", "#2bfff0", "#8affee", "#02100f"]),
  T("neon-gold", "Neon Gold", "neon", ["#120f02", "#fff6d6", "#ffd42b", "#fff09f", "#120f02"]),
  T("peach-sorbet", "Peach Sorbet", "organic", ["#fff2ea", "#3a1f0e", "#ffb88a", "#ffd9b8", "#ffffff"]),
  T("sprinkles", "Sprinkles", "ticket", ["#fff8e0", "#2b1e00", "#ff6fa5", "#5fc8ff", "#ffffff"]),

  // Studio: photo-led, soft shadow cards — the "real small-business page" look
  T("studio-cream", "Studio Cream", "studio", ["#faf7f1", "#241e14", "#c9774a", "#e8c9a8", "#ffffff"]),
  T("studio-sage", "Studio Sage", "studio", ["#f3f6ef", "#1e2a1a", "#5c7a4a", "#bcd3a8", "#ffffff"]),
  T("studio-blush", "Studio Blush", "studio", ["#fdf3f2", "#2e1414", "#c96a6a", "#f0c9c4", "#ffffff"]),
  T("studio-slate", "Studio Slate", "studio", ["#f4f5f7", "#181b20", "#3a5a8c", "#c3cfdd", "#ffffff"]),
  T("studio-night", "Studio Night", "studio", ["#15161a", "#f0efe9", "#e8a04c", "#3a3c44", "#15161a"]),

  // Sticker: cute, tilted cards with a sticker/washi-tape feel
  T("sticker-mint", "Sticker Mint", "sticker", ["#f1fbf3", "#13261a", "#3fae6e", "#bdf0d2", "#ffffff"]),
  T("sticker-peach", "Sticker Peach", "sticker", ["#fff4ec", "#331c0d", "#ff8a4d", "#ffd9b8", "#ffffff"]),
  T("sticker-sky", "Sticker Sky", "sticker", ["#eef7ff", "#0f2238", "#2f8fe0", "#bfe3ff", "#ffffff"]),
  T("sticker-grape", "Sticker Grape", "sticker", ["#f6f0fb", "#241433", "#8a4fd6", "#dcc4f5", "#ffffff"]),
  T("sticker-sun", "Sticker Sun", "sticker", ["#fffaeb", "#2b2206", "#e0a71f", "#ffe49a", "#2b2206"]),

  // Poster: loud block type, high contrast — gig-flyer energy
  T("poster-black", "Poster Black", "poster", ["#0c0c0c", "#f5f5f0", "#ffe14d", "#f5f5f0", "#0c0c0c"]),
  T("poster-cream", "Poster Cream", "poster", ["#f2ecd9", "#141208", "#d13b2a", "#f2ecd9", "#ffffff"]),
  T("poster-blue", "Poster Blue", "poster", ["#101a3d", "#eef2ff", "#ffd23f", "#eef2ff", "#101a3d"]),
  T("poster-green", "Poster Green", "poster", ["#0e1f12", "#ecf5ec", "#9be65c", "#ecf5ec", "#0e1f12"]),

  // Vinyl: music-card gradients and a Spotify-ish now-playing feel
  T("vinyl-sunset", "Vinyl Sunset", "vinyl", ["#1c0f1f", "#fbe9d6", "#ff8a5c", "#ffd36e", "#1c0f1f"]),
  T("vinyl-cyan", "Vinyl Cyan", "vinyl", ["#06161c", "#e3fbff", "#2fd9d9", "#9bf0e8", "#06161c"]),
  T("vinyl-rose", "Vinyl Rose", "vinyl", ["#1f0c14", "#ffe3ee", "#ff5c8a", "#ffb3cf", "#1f0c14"]),
  T("vinyl-lime", "Vinyl Lime", "vinyl", ["#101a06", "#eaffd0", "#9fe034", "#d7ff9e", "#101a06"]),
  T("vinyl-indigo", "Vinyl Indigo", "vinyl", ["#0b0a1f", "#e6e4ff", "#6a5cff", "#b6aaff", "#0b0a1f"]),

  T("ribbon-blush", "Ribbon Blush", "ribbon", ["#fdf2f4", "#2c1419", "#d6517a", "#f4b8c8", "#ffffff"]),
  T("ribbon-ink", "Ribbon Ink", "ribbon", ["#101317", "#f1f2f4", "#5c8cff", "#2a3340", "#101317"]),

  T("frame-linen", "Frame Linen", "frame", ["#f6f2ea", "#231d12", "#2a2a2a", "#d8c8a8", "#ffffff"]),
  T("frame-noir", "Frame Noir", "frame", ["#121212", "#f2f0ea", "#f2f0ea", "#2a2a2a", "#121212"]),

  T("badge-forest", "Badge Forest", "badge", ["#f2f5ee", "#14241a", "#2f5c3a", "#c7dcc2", "#ffffff"]),
  T("badge-rust", "Badge Rust", "badge", ["#fbf2ec", "#2b1507", "#b5502a", "#eac6ad", "#ffffff"]),

  T("split-citrus", "Split Citrus", "split", ["#fff6e9", "#231a05", "#ff9f1c", "#ffffff", "#1a1200"]),
  T("split-ocean", "Split Ocean", "split", ["#eef6fb", "#0c1b26", "#1f6feb", "#ffffff", "#ffffff"]),

  T("zine-mono", "Zine Mono", "zine", ["#efefe9", "#0d0d0d", "#0d0d0d", "#9a9a92", "#efefe9"]),
  T("zine-punk", "Zine Punk", "zine", ["#0c0c0c", "#f2f2ea", "#ff2b6a", "#f2f2ea", "#0c0c0c"]),

  T("stamp-sage", "Stamp Sage", "stamp", ["#f4f6f0", "#1e2a1a", "#4a7a52", "#cfe0c4", "#ffffff"]),
  T("stamp-rose", "Stamp Rose", "stamp", ["#fbf0f1", "#2e1416", "#c0566a", "#f0c9cf", "#ffffff"]),

  T("carnival-red", "Carnival Red", "carnival", ["#fff4e9", "#241208", "#e23b3b", "#ffd9a8", "#ffffff"]),
  T("carnival-teal", "Carnival Teal", "carnival", ["#eafbf7", "#07211c", "#1fae8e", "#bdf0e2", "#ffffff"]),

  T("catalog-slate", "Catalog Slate", "catalog", ["#f7f8f9", "#171a1f", "#3a5a8c", "#e2e6ea", "#ffffff"]),
  T("catalog-clay", "Catalog Clay", "catalog", ["#faf6f1", "#241c12", "#a9623c", "#e9ddcf", "#ffffff"]),

  // Arch Studio: Mediterranean rounded arches, terracotta, warm sandstone
  T("arch-terracotta", "Arch Terracotta", "arch", ["#fdf7f2", "#2d1b15", "#c85a38", "#eddcd2", "#ffffff"]),
  T("arch-olive", "Arch Olive", "arch", ["#f8f9f4", "#1e2419", "#566848", "#dfe5d5", "#ffffff"]),
  T("arch-sandstone", "Arch Sandstone", "arch", ["#fcf9f2", "#28231c", "#b08958", "#ebdcc7", "#ffffff"]),

  // Soft Clay: Neomorphic tactile pill buttons, buttery pastels, gentle shadows
  T("clay-cream", "Clay Cream", "clay", ["#f6f4ee", "#26231e", "#38332c", "#ded9cc", "#ffffff"]),
  T("clay-peach", "Clay Peach", "clay", ["#fdf5f2", "#2d1f1c", "#e67862", "#f6d8d0", "#ffffff"]),
  T("clay-sky", "Clay Sky", "clay", ["#f2f7fc", "#18222d", "#4b8ad1", "#d0e2f5", "#ffffff"]),

  // Bobby Bakes: Y2K bold puffy titles, bakery aesthetic, periwinkle & royal blue
  T("bakes-sky", "Bobby Bakes", "bakes", ["#bdd5ea", "#0a1931", "#150050", "#ffffff", "#ffffff"]),
  T("bakes-vanilla", "Bakes Vanilla", "bakes", ["#fef8ea", "#22190f", "#f38ba0", "#ffd5cd", "#ffffff"]),
  T("bakes-berry", "Bakes Berry", "bakes", ["#fdeff4", "#2c0e1e", "#c72c68", "#f7c5d7", "#ffffff"]),

  // Lavender Farm: British cottagecore, deep royal navy, English botanical
  T("lavender-bloom", "Lavender Farm", "lavender", ["#f9f7fc", "#1b1933", "#232b5d", "#d8d3e8", "#ffffff"]),
  T("lavender-sage", "Lavender Sage", "lavender", ["#f5f8f5", "#142318", "#2c4835", "#cee2d2", "#ffffff"]),
  T("lavender-dusk", "Lavender Dusk", "lavender", ["#131422", "#f1f0f8", "#786eb8", "#333552", "#ffffff"]),
];

export const familyOrder: Family[] = [
  "editorial",
  "chrome",
  "glass",
  "mono",
  "pop",
  "minimal",
  "gradient",
  "neon",
  "brutalist",
  "luxury",
  "ticket",
  "terminal",
  "deco",
  "organic",
  "handwritten",
  "duotone",
  "studio",
  "sticker",
  "poster",
  "vinyl",
  "ribbon",
  "frame",
  "badge",
  "split",
  "zine",
  "stamp",
  "carnival",
  "catalog",
  "arch",
  "clay",
  "bakes",
  "lavender",
];

const byId = new Map(themeList.map((t) => [t.id, t]));

export interface ResolvedTheme {
  def: ThemeDef;
  family: FamilyDef;
  tokens: ThemeTokens;
  nameFont: string;
  style: CSSProperties;
}

const channel = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const v = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const [r, g, b] = [0, 2, 4].map((i) => channel(parseInt(v.slice(i, i + 2), 16) / 255));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}
const ratio = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
};

/** Text colour for a button of colour `bg`: keep the theme's choice if it reads well, otherwise dark or light, whichever is clearer. */
export function readableOn(bg: string, preferred: string): string {
  try {
    if (ratio(preferred, bg) >= 3.5) return preferred;
    return ratio("#111111", bg) >= ratio("#ffffff", bg) ? "#111111" : "#ffffff";
  } catch {
    return preferred;
  }
}

export function getTheme(id: ThemeId): ResolvedTheme {
  const def = byId.get(id) ?? themeList[0]!;
  const family = families[def.family];
  const style: Record<string, string> = {
    "--t-bg": def.bg,
    "--t-fg": def.fg,
    "--t-accent": def.accent,
    "--t-accent2": def.accent2,
    "--t-on-accent": readableOn(def.accent, def.onAccent),
  };
  if (def.chrome) {
    style["--c1"] = def.chrome[0];
    style["--c2"] = def.chrome[1];
    style["--c3"] = def.chrome[2];
  }
  return {
    def,
    family,
    tokens: family.tokens,
    nameFont: fontClass[def.font ?? family.font],
    style: style as CSSProperties,
  };
}
