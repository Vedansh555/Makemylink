"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Globe,
  Lock,
  Mail,
  MessageSquare,
  User,
  Video,
} from "lucide-react";
import type { BioLink, Profile } from "@/lib/types";
import { slotsForDay } from "@/lib/booking";
import { fontClass, getTheme, readableOn } from "@/lib/themes";
import { bookingPrice } from "./BookingModal";
import { ConsentCheck } from "./ConsentCheck";
import { payLinkHost } from "@/lib/payLink";
import { WhatsAppIcon } from "./WhatsAppModal";
import { payWithRazorpay, type RazorpayPay } from "@/lib/razorpayClient";
import { Background } from "./BioPage";

type Pay =
  | RazorpayPay
  | { kind: "paypal"; url: string }
  | { kind: "link"; link: string; exact?: number };

type Result = {
  status: "confirmed" | "awaiting_payment" | "demo";
  meetingUrl?: string;
  pays: Pay[];
};

type DayInfo = { free: number; total: number };

const pad = (n: number) => String(n).padStart(2, "0");
const ymdOf = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

function ordinal(d: number) {
  if (d > 3 && d < 21) return `${d}th`;
  switch (d % 10) {
    case 1:
      return `${d}st`;
    case 2:
      return `${d}nd`;
    case 3:
      return `${d}rd`;
    default:
      return `${d}th`;
  }
}

const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

/**
 * Cal.com-inspired desktop & mobile booking experience.
 * Features a unified, high-contrast dark card with 3 interconnected columns:
 * - Col 1: Host avatar, name, meeting title, duration, Google Meet badge, timezone, price.
 * - Col 2: Month calendar grid with clean square tiles and availability indicators.
 * - Col 3: Selected day header with 12h/24h toggle & vertical time slot pills.
 * Clicking a slot smoothly transitions to the guest details form with 0 page jumping.
 */
export function BookingPage({ profile, link, live }: { profile: Profile; link: BioLink; live: boolean }) {
  const cfg = link.booking!;
  const theme = getTheme(profile.theme);
  const nameFont = profile.fontOverride
    ? fontClass[profile.fontOverride as keyof typeof fontClass] ?? theme.nameFont
    : theme.nameFont;
  const style = profile.accentOverride
    ? ({
        ...theme.style,
        "--t-accent": profile.accentOverride,
        "--t-on-accent": readableOn(profile.accentOverride, theme.def.onAccent),
      } as React.CSSProperties)
    : theme.style;

  // "Today" and visible month in creator's timezone
  const todayYmd = useMemo(
    () => new Intl.DateTimeFormat("en-CA", { timeZone: cfg.timeZone }).format(new Date()),
    [cfg.timeZone],
  );
  const [ty, tm] = todayYmd.split("-").map(Number) as [number, number];
  const [view, setView] = useState({ y: ty, m: tm - 1 });
  const monthKey = `${view.y}-${pad(view.m + 1)}`;

  const [days, setDays] = useState<Record<string, DayInfo> | null>(null);
  const [day, setDay] = useState("");
  const [slotData, setSlotData] = useState<{ free: number[]; all: number[] } | null>(null);
  const [slot, setSlot] = useState<number | null>(null);
  const [use24h, setUse24h] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [payErr, setPayErr] = useState("");
  
  // Reschedule & Status states
  const [resched, setResched] = useState<{ id: string; k: string; old: number } | null>(null);
  const [done, setDone] = useState<Result | null>(null);
  const [monthFull, setMonthFull] = useState(false);
  // Sent with the time lookups, so a buyer can still move a session after the creator's Pro has ended.
  const moving = resched ? `&reschedule=${encodeURIComponent(resched.id)}&k=${encodeURIComponent(resched.k)}` : "";

  const viewerTz = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return cfg.timeZone;
    }
  }, [cfg.timeZone]);

  const sameZone = useMemo(() => {
    const at = (tz: string, ms: number) =>
      new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: tz }).format(new Date(ms));
    const n = Date.now();
    try {
      return (
        at(viewerTz, n) === at(cfg.timeZone, n) &&
        at(viewerTz, n + 180 * 86_400_000) === at(cfg.timeZone, n + 180 * 86_400_000)
      );
    } catch {
      return true;
    }
  }, [viewerTz, cfg.timeZone]);

  // PayPal return & Reschedule check
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const rid = q.get("reschedule");
    const rk = q.get("k");
    if (rid && rk) {
      fetch(`/api/bookings/reschedule?id=${encodeURIComponent(rid)}&k=${encodeURIComponent(rk)}`)
        .then((r) => r.json())
        .then((x) => (x.slot ? setResched({ id: rid, k: rk, old: x.slot }) : setErr(x.error ?? "This link is not valid")))
        .catch(() => {});
    }
    const paid = q.get("paid");
    if (paid) {
      fetch(`/api/bookings/status?id=${encodeURIComponent(paid)}`)
        .then((r) => r.json())
        .then((x) => {
          if (x.status === "confirmed") {
            setSlot(x.slot);
            setDone({ status: "confirmed", meetingUrl: x.meetingUrl, pays: [] });
          }
        })
        .catch(() => {});
    } else if (q.get("pay") === "failed") {
      setErr("We could not confirm your PayPal payment. If money left your account, contact the host with your booking details.");
    } else if (q.get("pay") === "pending") {
      setErr("PayPal is still checking your payment. Your time is held, and the host will email you the meeting link once it arrives.");
    } else if (q.get("pay") === "cancelled") {
      setErr("Payment was cancelled. Pick a time and try again.");
    }
  }, []);

  // Fetch month availability
  useEffect(() => {
    let cancelled = false;
    setDays(null);
    if (!live) {
      const out: Record<string, DayInfo> = {};
      const n = new Date(view.y, view.m + 1, 0).getDate();
      for (let d = 1; d <= n; d++) {
        const k = ymdOf(view.y, view.m, d);
        const total = slotsForDay(cfg, k, []).length;
        if (total) out[k] = { free: total, total };
      }
      setDays(out);
      return;
    }
    fetch(
      `/api/bookings?handle=${encodeURIComponent(profile.handle)}&linkId=${encodeURIComponent(link.id)}&month=${monthKey}${moving}`,
    )
      .then((r) => r.json())
      .then((d) => { if (cancelled) return; setMonthFull(!!d.full); setDays(d.days ?? {}); })
      .catch(() => !cancelled && setDays({}));
    return () => {
      cancelled = true;
    };
  }, [monthKey, live, cfg, profile.handle, link.id, view.y, view.m, moving]);

  // Auto-select first available day if none selected
  useEffect(() => {
    if (day || !days) return;
    const firstFree = Object.keys(days)
      .sort()
      .find((k) => (days[k]?.free ?? 0) > 0 && k >= todayYmd);
    if (firstFree) {
      setDay(firstFree);
    }
  }, [days, day, todayYmd]);

  // Fetch times for chosen day
  useEffect(() => {
    if (!day) return;
    let cancelled = false;
    setSlotData(null);
    if (!live) {
      const all = slotsForDay(cfg, day, []);
      setSlotData({ free: all, all });
      return;
    }
    fetch(
      `/api/bookings?handle=${encodeURIComponent(profile.handle)}&linkId=${encodeURIComponent(link.id)}&date=${day}${moving}`,
    )
      .then((r) => r.json())
      .then((d) => !cancelled && setSlotData({ free: d.slots ?? [], all: d.all ?? d.slots ?? [] }))
      .catch(() => !cancelled && setSlotData({ free: [], all: [] }));
    return () => {
      cancelled = true;
    };
  }, [day, live, cfg, profile.handle, link.id, moving]);

  const fmtSlotTime = (ms: number, is24h = use24h, tz = cfg.timeZone) => {
    if (is24h) {
      return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: tz }).format(
        new Date(ms),
      );
    }
    return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: tz })
      .format(new Date(ms))
      .toLowerCase()
      .replace(" ", "");
  };

  const fmtFullDay = (ms: number) =>
    new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: cfg.timeZone,
    }).format(new Date(ms));

  const monthLabel = new Date(view.y, view.m, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const firstWeekday = (new Date(view.y, view.m, 1).getDay() + 6) % 7; // Monday = 0
  const dim = new Date(view.y, view.m + 1, 0).getDate();
  const prevDim = new Date(view.y, view.m, 0).getDate();

  const canPrev = view.y > ty || view.m > tm - 1;
  const lastAllowed = new Date(ty, tm - 1 + 3, 1);
  const canNext = new Date(view.y, view.m + 1, 1) <= lastAllowed;

  const price = bookingPrice(link);
  const free = cfg.price === 0;

  // Selected day header in right column (e.g., "Tue 24th")
  const dayHeader = useMemo(() => {
    if (!day) return "Select a date";
    const [y, m, d] = day.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    const wd = dt.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
    return `${wd} ${ordinal(d)}`;
  }, [day]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!slot) return;
    if (!live) return setDone({ status: "demo", pays: [] });
    setBusy(true);
    setErr("");
    if (resched) {
      const r = await fetch("/api/bookings/reschedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: resched.id, k: resched.k, slot }),
      });
      const x = await r.json().catch(() => ({}));
      setBusy(false);
      if (!r.ok) return setErr(x.error ?? "Something went wrong");
      setDone({
        status: x.status === "confirmed" ? "confirmed" : "awaiting_payment",
        meetingUrl: x.meetingUrl,
        pays: [],
      });
      return;
    }
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        handle: profile.handle,
        linkId: link.id,
        slot,
        name,
        email,
        note,
        consent: agree,
      }),
    });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.status === 409) {
      setSlot(null);
      setSlotData(null);
      fetch(
        `/api/bookings?handle=${encodeURIComponent(profile.handle)}&linkId=${encodeURIComponent(link.id)}&date=${day}${moving}`,
      )
        .then((r) => r.json())
        .then((x) => setSlotData({ free: x.slots ?? [], all: x.all ?? x.slots ?? [] }));
      setErr("Someone just booked this time slot. Please choose another one.");
      return;
    }
    if (!res.ok) return setErr(d.error ?? "Something went wrong");
    const pp = (d.pays as Pay[] | undefined)?.find((p): p is { kind: "paypal"; url: string } => p.kind === "paypal");
    if (d.status === "awaiting_payment" && pp) {
      window.location.href = pp.url;
      return;
    }
    const online = (d.pays as Pay[] | undefined)?.find((p): p is RazorpayPay => p.kind === "razorpay");
    if (d.status === "awaiting_payment" && online) {
      void payOnline(online, d);
      return;
    }
    setDone(d);
  }

  async function payOnline(p: RazorpayPay, held?: Result) {
    setPayErr("");
    const r = await payWithRazorpay(p, { name, email, title: link.title, creator: profile.name });
    if (r.ok) {
      setDone({ status: "confirmed", meetingUrl: r.meetingUrl, pays: [] });
    } else {
      if (held) setDone(held);
      if (!r.cancelled) setPayErr(r.error ?? "");
    }
  }


  return (
    <div style={style} className="relative isolate min-h-screen overflow-x-clip bg-t-bg text-t-fg font-sans antialiased">
      <Background theme={theme} />
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute -left-28 -top-28 h-[500px] w-[500px] rounded-full bg-t-accent/15 blur-[130px]" />
      <div className="pointer-events-none absolute -right-28 top-1/3 h-[500px] w-[500px] rounded-full bg-t-accent2/10 blur-[130px]" />

      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center p-3 sm:p-6 lg:p-10">
        {done ? (
          /* Confirmation / Success Screen */
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg rounded-[28px] border border-t-fg/10 bg-t-bg/95 p-6 sm:p-8 text-center shadow-2xl backdrop-blur-2xl"
          >
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-t-fg text-t-bg shadow-lg">
              <Check className="h-8 w-8 stroke-[2.5]" />
            </span>

            {done.status === "demo" ? (
              <>
                <h1 className={`${nameFont} mt-5 text-[28px] font-bold leading-tight`}>This is how it works</h1>
                <p className="mt-3 text-[14px] leading-relaxed text-t-fg/70">
                  Your visitor picks a time and pays you directly. You confirm and the meeting link arrives by email.
                  Showz takes 0% commission. Nothing was booked or charged here.
                </p>
                <Link
                  href="/create?focus=booking"
                  className="mt-6 block rounded-xl bg-t-fg px-5 py-3.5 text-[14px] font-bold text-t-bg transition hover:bg-t-fg/90"
                >
                  Add a booking card to my page
                </Link>
              </>
            ) : (
              <>
                <h1 className={`${nameFont} mt-5 text-[28px] font-bold leading-tight`}>
                  {done.status === "confirmed" ? "You're booked!" : "Time held for you"}
                </h1>
                {slot && (
                  <div className="mt-4 rounded-xl border border-t-fg/10 bg-t-fg/5 p-3.5 text-left text-[14px]">
                    <p className="font-semibold text-t-fg">{fmtFullDay(slot)}</p>
                    <p className="mt-0.5 text-t-fg/70">
                      {fmtSlotTime(slot, false)} - {fmtSlotTime(slot + cfg.durationMin * 60_000, false)} ({cfg.durationMin}m)
                    </p>
                    <p className="mt-1 text-[12px] text-t-fg/50">
                      Time zone: {cfg.timeZone.replace("_", " ")}
                      {!sameZone && ` · ${fmtSlotTime(slot, false, viewerTz)} your time`}
                    </p>
                  </div>
                )}

                {done.status === "confirmed" ? (
                  <div className="mt-6 space-y-3 text-[14px]">
                    <p className="text-t-fg/70">
                      {resched
                        ? "Your new time is saved. We emailed you the updated details."
                        : "We emailed you the confirmation and a calendar invite. Join with this link:"}
                    </p>
                    {done.meetingUrl && (
                      <a
                        href={done.meetingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-xl bg-t-fg px-5 py-3.5 font-bold text-t-bg transition hover:bg-t-fg/90"
                      >
                        Open Google Meet Link
                      </a>
                    )}
                    {!resched && (
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(
                          `I just booked "${link.title}" with ${profile.name}. Book here: ${
                            typeof window !== "undefined" ? window.location.origin : ""
                          }/${profile.handle}`,
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 rounded-xl border border-t-fg/20 bg-t-fg/5 px-5 py-3 font-semibold text-t-fg hover:bg-t-fg/10 transition"
                      >
                        <WhatsAppIcon className="h-4 w-4" /> Share on WhatsApp
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="mt-6 space-y-3 text-[14px]">
                    <p className="text-t-fg/70">
                      {done.pays.some((p) => p.kind === "razorpay" || p.kind === "paypal")
                        ? `One step left: pay ${price} to hold your spot. Your meeting link appears as soon as payment is completed.`
                        : `One step left: pay ${price} directly to ${profile.name}. Your meeting link is sent as soon as they confirm.`}
                    </p>
                    {payErr && <p className="text-[13px] text-red-400">{payErr}</p>}
                    {done.pays.map((p) =>
                      p.kind === "razorpay" ? (
                        <button
                          key="rzp"
                          type="button"
                          onClick={() => payOnline(p)}
                          className="block w-full rounded-xl bg-t-fg px-5 py-3.5 font-bold text-t-bg transition hover:bg-t-fg/90"
                        >
                          Pay {price} now
                        </button>
                      ) : p.kind === "paypal" ? (
                        <a
                          key="pp"
                          href={p.url}
                          className="block rounded-xl bg-t-fg px-5 py-3.5 font-bold text-t-bg transition hover:bg-t-fg/90"
                        >
                          Pay {price} with PayPal
                        </a>
                      ) : (
                        <div key="link">
                          <a
                            href={p.link}
                            target="_blank"
                            rel="noreferrer"
                            className={done.pays.length > 1 ? "block rounded-xl border border-t-fg/20 bg-t-fg/5 px-5 py-3 font-semibold text-t-fg hover:bg-t-fg/10" : "block w-full rounded-xl bg-t-fg px-5 py-3.5 font-bold text-t-bg transition hover:bg-t-fg/90"}
                          >
                            {done.pays.length > 1 ? "Or pay with the creator's payment link" : `Pay ${p.exact ? `₹${(p.exact / 100).toFixed(2)}` : price}`}
                          </a>
                          {p.exact ? (
                            <div className="mt-3 rounded-xl border border-t-fg/15 bg-t-fg/5 px-4 py-3 text-[13px] text-t-fg/75">
                              Enter exactly <b className="text-t-fg tabular-nums">₹{(p.exact / 100).toFixed(2)}</b>, paise included. That exact amount tells us it is your booking, so it confirms by itself and your meeting link arrives by email within a minute or two.
                            </div>
                          ) : (
                            <p className="mt-2 text-[12px] text-t-fg/50">Opens {payLinkHost(p.link) ?? "the creator's payment page"}. Pay exactly {price}; the host confirms it and emails your meeting link.</p>
                          )}
                        </div>
                      ),
                    )}
                  </div>
                )}
              </>
            )}

            <Link
              href={`/${profile.handle}`}
              className="mt-7 inline-block text-[13px] text-t-fg/60 hover:text-t-fg underline underline-offset-4"
            >
              Back to {profile.name}&apos;s profile
            </Link>
          </motion.div>
        ) : (
          /* Main Cal.com 3-Column Shell */
          <div className="w-full max-w-5xl rounded-[28px] border border-t-fg/10 bg-t-bg/95 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] backdrop-blur-2xl overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-12 md:divide-x md:divide-t-fg/10">
              {/* Column 1: Host & Meeting Details (~280px / 4 cols) */}
              <div className="p-6 md:p-7 md:col-span-4 flex flex-col justify-between border-b md:border-b-0 border-t-fg/10">
                <div className="space-y-5">
                  <Link
                    href={`/${profile.handle}`}
                    className="inline-flex items-center gap-1.5 text-[13px] font-medium text-t-fg/60 hover:text-t-fg transition"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Back to {profile.name}
                  </Link>

                  <div className="flex items-center gap-3">
                    {profile.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={profile.avatar}
                        alt=""
                        className="h-12 w-12 rounded-full object-cover ring-2 ring-t-fg/10"
                      />
                    ) : (
                      <span className="grid h-12 w-12 place-items-center rounded-full bg-t-fg/10 text-[18px] font-bold text-t-fg">
                        {profile.name.charAt(0)}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-medium text-t-fg/70">{profile.name}</p>
                      <p className="truncate text-[13px] text-t-fg/40">@{profile.handle}</p>
                    </div>
                  </div>

                  <div>
                    <h1 className={`${nameFont} text-[24px] sm:text-[28px] font-bold leading-tight text-t-fg`}>
                      {link.title}
                    </h1>
                    {cfg.description && (
                      <p className="mt-2 text-[14px] leading-relaxed text-t-fg/65 line-clamp-3">
                        {cfg.description}
                      </p>
                    )}
                  </div>

                  {resched && (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-[13px] text-amber-200">
                      <p className="font-semibold">Rescheduling session</p>
                      <p className="mt-0.5 text-amber-200/80">
                        Previous time: {fmtFullDay(resched.old)} · {fmtSlotTime(resched.old, false)}
                      </p>
                    </div>
                  )}

                  {/* Metadata spec items (Cal.com layout) */}
                  <div className="space-y-3 pt-2 text-[14px] text-t-fg/75">
                    <div className="flex items-center gap-2.5">
                      <Clock className="h-4 w-4 text-t-fg/50 shrink-0" />
                      <span>{cfg.durationMin}m</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Video className="h-4 w-4 text-t-fg/50 shrink-0" />
                      <span>Google Meet</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Globe className="h-4 w-4 text-t-fg/50 shrink-0" />
                      <span className="truncate">
                        {cfg.timeZone.replace("_", " ")}
                        {!sameZone && (
                          <span className="block text-[12px] text-t-fg/40">
                            Your time: {viewerTz.replace("_", " ")}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Price & 0% fee assurance */}
                <div className="mt-6 pt-5 border-t border-t-fg/10">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[13px] text-t-fg/50 font-medium">{free ? "Free Session" : "Fee"}</span>
                    <span className="text-[22px] font-bold text-t-fg">{price}</span>
                  </div>
                </div>
              </div>

              {/* Columns 2 & 3: Calendar & Slots OR Guest Details Form */}
              <div className="md:col-span-8 flex flex-col">
                <AnimatePresence mode="wait">
                  {slot ? (
                    /* Step 2: Guest Details Form (Smooth transition when slot selected) */
                    <motion.div
                      key="form-step"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="p-6 md:p-8 flex-1 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between pb-4 border-b border-t-fg/10">
                          <button
                            type="button"
                            onClick={() => setSlot(null)}
                            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-t-fg/70 hover:text-t-fg transition"
                          >
                            <ArrowLeft className="h-4 w-4" /> Change date or time
                          </button>
                          <span className="text-[12px] font-medium text-t-fg/50">Step 2 of 2</span>
                        </div>

                        {/* Selected Time Pill */}
                        <div className="mt-5 rounded-2xl border border-t-fg/15 bg-t-fg/[0.04] p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="grid h-10 w-10 place-items-center rounded-xl bg-t-fg text-t-bg font-bold">
                              <CalendarIcon className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-[15px] font-semibold text-t-fg">{fmtFullDay(slot)}</p>
                              <p className="text-[13px] text-t-fg/70">
                                {fmtSlotTime(slot, use24h)} - {fmtSlotTime(slot + cfg.durationMin * 60_000, use24h)} (
                                {cfg.durationMin}m)
                                {!sameZone && ` · ${fmtSlotTime(slot, use24h, viewerTz)} local`}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSlot(null)}
                            className="text-[12px] font-medium text-t-fg/50 hover:text-t-fg underline underline-offset-2"
                          >
                            Change
                          </button>
                        </div>

                        <form id="bookform" onSubmit={submit} className="mt-6 space-y-4">
                          {!live && (
                            <p className="rounded-xl border border-t-fg/10 bg-t-fg/5 px-3.5 py-2 text-[12px] text-t-fg/70">
                              Demo mode: Nothing is charged or booked. You can test the exact booking experience.
                            </p>
                          )}

                          <div>
                            <label className="block text-[12px] font-medium uppercase tracking-wider text-t-fg/60 mb-1.5">
                              Your Name *
                            </label>
                            <div className="relative">
                              <User className="absolute left-3.5 top-3.5 h-4 w-4 text-t-fg/40" />
                              <input
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Rahul Sharma"
                                maxLength={80}
                                autoComplete="name"
                                className="w-full rounded-xl border border-t-fg/15 bg-t-fg/5 pl-10 pr-4 py-3 text-[14px] text-t-fg outline-none placeholder:text-t-fg/30 focus:border-t-fg/50 transition"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[12px] font-medium uppercase tracking-wider text-t-fg/60 mb-1.5">
                              Email Address *
                            </label>
                            <div className="relative">
                              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-t-fg/40" />
                              <input
                                required
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                autoComplete="email"
                                className="w-full rounded-xl border border-t-fg/15 bg-t-fg/5 pl-10 pr-4 py-3 text-[14px] text-t-fg outline-none placeholder:text-t-fg/30 focus:border-t-fg/50 transition"
                              />
                            </div>
                            <p className="mt-1 text-[11px] text-t-fg/40">Calendar invite and meeting link sent here</p>
                          </div>

                          <div>
                            <label className="block text-[12px] font-medium uppercase tracking-wider text-t-fg/60 mb-1.5">
                              What would you like to discuss? <span className="opacity-50">(optional)</span>
                            </label>
                            <div className="relative">
                              <MessageSquare className="absolute left-3.5 top-3.5 h-4 w-4 text-t-fg/40" />
                              <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Briefly share topics, questions, or goals for our call..."
                                maxLength={500}
                                rows={2}
                                className="w-full rounded-xl border border-t-fg/15 bg-t-fg/5 pl-10 pr-4 py-2.5 text-[14px] text-t-fg outline-none placeholder:text-t-fg/30 focus:border-t-fg/50 transition resize-none"
                              />
                            </div>
                          </div>

                          <div className="pt-1">
                            <ConsentCheck checked={agree} onChange={setAgree} className="text-t-fg/80" />
                          </div>

                          {err && <p className="text-[13px] text-red-400 font-medium">{err}</p>}

                          <button
                            type="submit"
                            disabled={busy}
                            className="w-full rounded-xl bg-t-fg py-3.5 text-[15px] font-bold text-t-bg transition hover:bg-t-fg/90 disabled:opacity-50 shadow-lg cursor-pointer"
                          >
                            {busy
                              ? "Processing…"
                              : resched
                              ? "Confirm Reschedule"
                              : free
                              ? "Confirm Booking"
                              : `Continue to Payment · ${price}`}
                          </button>
                        </form>
                      </div>

                      <div className="mt-6 flex items-center justify-center gap-1.5 text-[12px] text-t-fg/40">
                        <Lock className="h-3.5 w-3.5" /> End-to-end encrypted · Direct creator booking
                      </div>
                    </motion.div>
                  ) : (
                    /* Step 1: Calendar & Time Slots (Exact Cal.com 2-part grid) */
                    <motion.div
                      key="calendar-step"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="grid grid-cols-1 lg:grid-cols-12 flex-1 lg:divide-x lg:divide-t-fg/10"
                    >
                      {/* Center: Month Calendar Grid (~330px / 7 cols) */}
                      <div className="p-5 sm:p-6 lg:col-span-7 flex flex-col justify-between">
                        <div>
                          {/* Calendar Navigation Header */}
                          <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-[16px] font-semibold text-t-fg tracking-tight">{monthLabel}</h2>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={!canPrev}
                                onClick={() =>
                                  setView((v) => (v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 }))
                                }
                                aria-label="Previous month"
                                className="grid h-8 w-8 place-items-center rounded-lg border border-t-fg/10 bg-t-fg/5 text-t-fg/70 hover:text-t-fg hover:border-t-fg/30 disabled:opacity-20 transition"
                              >
                                <ChevronLeft className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                disabled={!canNext}
                                onClick={() =>
                                  setView((v) => (v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 }))
                                }
                                aria-label="Next month"
                                className="grid h-8 w-8 place-items-center rounded-lg border border-t-fg/10 bg-t-fg/5 text-t-fg/70 hover:text-t-fg hover:border-t-fg/30 disabled:opacity-20 transition"
                              >
                                <ChevronRight className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          {/* Weekdays Row: MON, TUE, WED, THU, FRI, SAT, SUN */}
                          <div className="grid grid-cols-7 gap-1 text-center mb-1">
                            {WEEKDAYS.map((w) => (
                              <span key={w} className="py-1 text-[11px] font-semibold text-t-fg/40 tracking-wider">
                                {w}
                              </span>
                            ))}
                          </div>

                          {/* Date Tiles Grid */}
                          <div className="grid grid-cols-7 gap-1.5 text-center">
                            {/* Leading blank / previous month days */}
                            {Array.from({ length: firstWeekday }).map((_, i) => {
                              const prevD = prevDim - firstWeekday + 1 + i;
                              return (
                                <span
                                  key={`prev-${i}`}
                                  className="aspect-square grid place-items-center text-[13px] text-t-fg/15 cursor-default select-none"
                                >
                                  {prevD}
                                </span>
                              );
                            })}

                            {/* Current month days */}
                            {Array.from({ length: dim }, (_, i) => i + 1).map((d) => {
                              const k = ymdOf(view.y, view.m, d);
                              const info = days?.[k];
                              const open = !!info && info.free > 0 && k >= todayYmd;
                              const selected = k === day;
                              const isToday = k === todayYmd;

                              return (
                                <button
                                  type="button"
                                  key={k}
                                  disabled={!open}
                                  onClick={() => setDay(k)}
                                  aria-label={`${k}${open ? ", available" : ", unavailable"}`}
                                  className={`relative aspect-square rounded-xl text-[14px] font-medium transition cursor-pointer select-none flex flex-col items-center justify-center ${
                                    selected
                                      ? "bg-t-fg text-t-bg font-bold shadow-lg scale-[1.04] z-10"
                                      : open
                                      ? "bg-t-fg/[0.08] text-t-fg hover:bg-t-fg/[0.14] hover:scale-[1.02]"
                                      : "text-t-fg/20 bg-transparent cursor-default"
                                  } ${isToday && !selected ? "ring-1 ring-t-fg/30" : ""}`}
                                >
                                  <span>{d}</span>
                                  {open && !selected && (
                                    <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-t-fg/60" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {days === null ? (
                          <p className="mt-4 text-[12px] text-t-fg/40">Loading availability…</p>
                        ) : days && !Object.values(days).some((x) => x.free > 0) ? (
                          <p className="mt-4 text-[12px] text-t-fg/50">No free dates this month. Check next month.</p>
                        ) : null}
                      </div>

                      {/* Right: Selected Day Header + 12h/24h toggle + Time Slots (~240px / 5 cols) */}
                      <div className="p-5 sm:p-6 lg:col-span-5 flex flex-col border-t lg:border-t-0 border-t-fg/10">
                        <div className="flex items-center justify-between pb-3.5 border-b border-t-fg/10">
                          <h3 className="text-[15px] font-semibold text-t-fg tracking-tight">{dayHeader}</h3>
                          {/* 12h / 24h Toggle Pill */}
                          <div className="flex items-center rounded-lg border border-t-fg/10 bg-t-fg/5 p-0.5 text-[11px] font-medium text-t-fg/70">
                            <button
                              type="button"
                              onClick={() => setUse24h(false)}
                              className={`min-h-[34px] min-w-[38px] rounded px-2 py-0.5 transition ${
                                !use24h ? "bg-t-fg/20 text-t-fg font-semibold" : "hover:text-t-fg"
                              }`}
                            >
                              12h
                            </button>
                            <button
                              type="button"
                              onClick={() => setUse24h(true)}
                              className={`min-h-[34px] min-w-[38px] rounded px-2 py-0.5 transition ${
                                use24h ? "bg-t-fg/20 text-t-fg font-semibold" : "hover:text-t-fg"
                              }`}
                            >
                              24h
                            </button>
                          </div>
                        </div>

                        {/* Time slots vertical column */}
                        <div className="mt-4 flex-1">
                          {monthFull ? (
                            <div className="grid h-48 place-items-center rounded-2xl border border-dashed border-t-fg/10 px-6 text-center text-[13px] text-t-fg/55">
                              No times left this month. Please contact {profile.name} directly.
                            </div>
                          ) : !day ? (
                            <div className="grid h-48 place-items-center rounded-2xl border border-dashed border-t-fg/10 text-[13px] text-t-fg/40">
                              Choose a date from the calendar
                            </div>
                          ) : slotData === null ? (
                            <div className="space-y-2">
                              {[1, 2, 3, 4].map((n) => (
                                <div key={n} className="h-11 w-full animate-pulse rounded-xl bg-t-fg/5" />
                              ))}
                            </div>
                          ) : slotData.all.length === 0 ? (
                            <div className="grid h-48 place-items-center rounded-2xl border border-dashed border-t-fg/10 text-[13px] text-t-fg/40">
                              No slots configured for this day
                            </div>
                          ) : (
                            <div className="no-scrollbar space-y-2 max-h-[360px] overflow-y-auto overscroll-contain">
                              {slotData.all.map((s) => {
                                const open = slotData.free.includes(s);
                                return (
                                  <button
                                    type="button"
                                    key={s}
                                    disabled={!open}
                                    onClick={() => setSlot(s)}
                                    className={`w-full py-2.5 px-4 rounded-xl text-center text-[14px] font-medium transition cursor-pointer ${
                                      open
                                        ? "border border-t-fg/10 hover:border-t-fg/40 bg-t-fg/[0.04] hover:bg-t-fg/[0.09] text-t-fg/90 hover:text-t-fg"
                                        : "border border-t-fg/5 bg-transparent opacity-30 line-through text-t-fg/40 cursor-not-allowed"
                                    }`}
                                  >
                                    <span>{fmtSlotTime(s, use24h)}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        )}

        {/* Footer Link & Branding */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-2.5 text-center text-[12px] leading-relaxed text-t-fg/40 [overflow-wrap:anywhere]">
          <Link href={`/${profile.handle}`} className="hover:text-t-fg/80 underline underline-offset-4">
            {profile.name}
          </Link>
          <span>·</span>
          <Link
            href={`/?ref=${encodeURIComponent(profile.handle)}`}
            className="hover:text-t-fg/80 underline underline-offset-4"
          >
            Powered by Showz
          </Link>
          <span>·</span>
          <span>0% commission direct booking</span>
        </div>
      </main>
    </div>
  );
}
