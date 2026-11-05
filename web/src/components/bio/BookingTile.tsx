"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, CalendarDays, Clock } from "lucide-react";
import type { BioLink } from "@/lib/types";
import { slotsForDay } from "@/lib/booking";
import { bookingPrice } from "./BookingModal";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * The booking card on a profile, drawn as a bento tile: what it is, what it costs, and the next free times,
 * so a visitor sees there is room before tapping. Tapping opens the booking window.
 */
export function BookingTile({ link, handle, live, compact, onOpen }: { link: BioLink; handle: string; live: boolean; compact: boolean; onOpen: () => void }) {
  const cfg = link.booking!;
  const [next, setNext] = useState<{ label: string; times: number[] } | null>(null);

  useEffect(() => {
    if (compact) return;
    let cancelled = false;
    const fmtYmd = new Intl.DateTimeFormat("en-CA", { timeZone: cfg.timeZone });
    const label = (ymd: string) => {
      const today = fmtYmd.format(new Date());
      const tomorrow = fmtYmd.format(new Date(Date.now() + 86_400_000));
      if (ymd === today) return "Today";
      if (ymd === tomorrow) return "Tomorrow";
      return new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${ymd}T12:00:00Z`));
    };
    (async () => {
      const [ty, tm] = fmtYmd.format(new Date()).split("-").map(Number) as [number, number];
      for (let add = 0; add < 2; add++) {
        const y = tm - 1 + add > 11 ? ty + 1 : ty;
        const m = (tm - 1 + add) % 12;
        const month = `${y}-${pad(m + 1)}`;
        let days: Record<string, { free: number }> = {};
        if (live) {
          days = await fetch(`/api/bookings?handle=${encodeURIComponent(handle)}&linkId=${encodeURIComponent(link.id)}&month=${month}`).then((r) => r.json()).then((d) => d.days ?? {}).catch(() => ({}));
        } else {
          for (let d = 1; d <= new Date(y, m + 1, 0).getDate(); d++) {
            const k = `${month}-${pad(d)}`;
            const n = slotsForDay(cfg, k, []).length;
            if (n) days[k] = { free: n };
          }
        }
        const first = Object.keys(days).sort().find((k) => days[k]!.free > 0);
        if (first) {
          const times: number[] = live
            ? await fetch(`/api/bookings?handle=${encodeURIComponent(handle)}&linkId=${encodeURIComponent(link.id)}&date=${first}`).then((r) => r.json()).then((d) => d.slots ?? []).catch(() => [])
            : slotsForDay(cfg, first, []);
          if (!cancelled && times.length) setNext({ label: label(first), times: times.slice(0, 3) });
          return;
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cfg, compact, handle, link.id, live]);

  const price = bookingPrice(link);
  const fmt = (ms: number) => new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", timeZone: cfg.timeZone }).format(new Date(ms));

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative flex h-full w-full cursor-pointer flex-col justify-between gap-4 overflow-hidden rounded-3xl border border-t-fg/15 bg-gradient-to-br from-t-accent/30 via-t-fg/[0.07] to-t-fg/[0.02] p-5 text-left text-t-fg shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6),0_1px_0_rgba(255,255,255,0.25)_inset] backdrop-blur-xl transition duration-300 hover:-translate-y-0.5"
    >
      <span className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-t-accent/40 blur-3xl transition group-hover:bg-t-accent/60" />
      <span className="relative flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-t-accent text-t-on-accent shadow-[0_12px_24px_-8px_var(--t-accent),0_1px_0_rgba(255,255,255,0.4)_inset]">
          <CalendarDays className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[16px] font-semibold leading-snug">{link.title}</span>
          <span className="mt-1 flex items-center gap-1.5 text-[12px] opacity-65">
            <Clock className="h-3 w-3" /> {cfg.durationMin} min · Video call
          </span>
        </span>
        <span className="shrink-0 rounded-full bg-t-fg px-3 py-1 text-[13px] font-bold text-t-bg">{price}</span>
      </span>

      {!compact && (
        <span className="relative block">
          <span className="block text-[11px] font-medium opacity-60">{next ? `Next free: ${next.label}` : "Pick a time that suits you"}</span>
          <span className="mt-2 flex flex-wrap gap-1.5">
            {(next?.times ?? []).map((ms) => (
              <span key={ms} className="rounded-xl border border-t-fg/20 bg-t-fg/[0.08] px-2.5 py-1 text-[12px] font-medium shadow-[0_6px_12px_-8px_rgba(0,0,0,0.6)]">
                {fmt(ms)}
              </span>
            ))}
          </span>
        </span>
      )}

      <span className="relative flex items-center justify-between rounded-2xl bg-t-accent px-4 py-2.5 text-[14px] font-semibold text-t-on-accent shadow-[0_14px_28px_-10px_var(--t-accent)]">
        Book a time
        <ArrowUpRight className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </span>
    </button>
  );
}
