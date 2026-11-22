"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Clock, Globe, ShieldCheck, Video } from "lucide-react";
import type { BioLink, Profile } from "@/lib/types";
import { slotsForDay } from "@/lib/booking";
import { fontClass, getTheme, readableOn } from "@/lib/themes";
import { bookingPrice } from "./BookingModal";
import { ConsentCheck } from "./ConsentCheck";
import { WhatsAppIcon } from "./WhatsAppModal";
import { payWithRazorpay, type RazorpayPay } from "@/lib/razorpayClient";
import { Background } from "./BioPage";
import { Tilt } from "../ui/Tilt";

type Pay = RazorpayPay | { kind: "paypal"; url: string } | { kind: "upi"; upiId: string; link: string } | { kind: "link"; link: string };
type Result = { status: "confirmed" | "awaiting_payment" | "demo"; meetingUrl?: string; pays: Pay[] };
type DayInfo = { free: number; total: number };

const pad = (n: number) => String(n).padStart(2, "0");
const ymdOf = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

/**
 * A page for one booking card, like the ones Calendly or Topmate give you: who you are booking, what it costs,
 * a month calendar that shows which days still have room, the times left (taken ones shown crossed out) and a short form.
 * It wears the creator's own theme, so it still feels like their page.
 */
export function BookingPage({ profile, link, live }: { profile: Profile; link: BioLink; live: boolean }) {
  const cfg = link.booking!;
  const theme = getTheme(profile.theme);
  const t = theme.tokens;
  const nameFont = profile.fontOverride ? fontClass[profile.fontOverride as keyof typeof fontClass] ?? theme.nameFont : theme.nameFont;
  const style = profile.accentOverride
    ? ({ ...theme.style, "--t-accent": profile.accentOverride, "--t-on-accent": readableOn(profile.accentOverride, theme.def.onAccent) } as React.CSSProperties)
    : theme.style;

  // "Today" and the visible month are in the creator's time zone, because that is where the days are defined.
  const todayYmd = useMemo(() => new Intl.DateTimeFormat("en-CA", { timeZone: cfg.timeZone }).format(new Date()), [cfg.timeZone]);
  const [ty, tm] = todayYmd.split("-").map(Number) as [number, number];
  const [view, setView] = useState({ y: ty, m: tm - 1 });
  const monthKey = `${view.y}-${pad(view.m + 1)}`;
  const [days, setDays] = useState<Record<string, DayInfo> | null>(null);
  const [day, setDay] = useState("");
  const [slotData, setSlotData] = useState<{ free: number[]; all: number[] } | null>(null);
  const [slot, setSlot] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [agree, setAgree] = useState(false);
  // Set when the buyer opened the "Change the time" link from their confirmation email.
  const [resched, setResched] = useState<{ id: string; k: string; old: number } | null>(null);
  const [payErr, setPayErr] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState<Result | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const viewerTz = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return cfg.timeZone;
    }
  }, [cfg.timeZone]);
  // Compare by clock time, not name: "Asia/Calcutta" and "Asia/Kolkata" are the same place.
  const sameZone = useMemo(() => {
    const at = (tz: string, ms: number) => new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: tz }).format(new Date(ms));
    const n = Date.now();
    try {
      return at(viewerTz, n) === at(cfg.timeZone, n) && at(viewerTz, n + 180 * 86_400_000) === at(cfg.timeZone, n + 180 * 86_400_000);
    } catch {
      return true;
    }
  }, [viewerTz, cfg.timeZone]);

  // Which days of the month still have room.
  // Coming back from PayPal: the server already took the payment, so just show the confirmation (or what went wrong).
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
    } else if (q.get("pay") === "failed") setErr("We could not confirm your PayPal payment. If money left your account, contact the host with your booking details.");
    else if (q.get("pay") === "cancelled") setErr("Payment was cancelled. Pick a time and try again.");
  }, []);

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
    fetch(`/api/bookings?handle=${encodeURIComponent(profile.handle)}&linkId=${encodeURIComponent(link.id)}&month=${monthKey}`)
      .then((r) => r.json())
      .then((d) => !cancelled && setDays(d.days ?? {}))
      .catch(() => !cancelled && setDays({}));
    return () => {
      cancelled = true;
    };
  }, [monthKey, live, cfg, profile.handle, link.id, view.y, view.m]);

  // The times for the chosen day, free and taken.
  useEffect(() => {
    if (!day) return;
    let cancelled = false;
    setSlotData(null);
    if (!live) {
      const all = slotsForDay(cfg, day, []);
      setSlotData({ free: all, all });
      return;
    }
    fetch(`/api/bookings?handle=${encodeURIComponent(profile.handle)}&linkId=${encodeURIComponent(link.id)}&date=${day}`)
      .then((r) => r.json())
      .then((d) => !cancelled && setSlotData({ free: d.slots ?? [], all: d.all ?? d.slots ?? [] }))
      .catch(() => !cancelled && setSlotData({ free: [], all: [] }));
    return () => {
      cancelled = true;
    };
  }, [day, live, cfg, profile.handle, link.id]);

  const fmtTime = (ms: number, tz = cfg.timeZone) => new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", timeZone: tz }).format(new Date(ms));
  const fmtDay = (ms: number) => new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: cfg.timeZone }).format(new Date(ms));
  const monthLabel = new Date(view.y, view.m, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const firstWeekday = new Date(view.y, view.m, 1).getDay();
  const dim = new Date(view.y, view.m + 1, 0).getDate();
  const canPrev = view.y > ty || view.m > tm - 1;
  const lastAllowed = new Date(ty, tm - 1 + 2, 1); // today's month and the next two
  const canNext = new Date(view.y, view.m + 1, 1) <= lastAllowed;
  const price = bookingPrice(link);
  const free = cfg.price === 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!slot) return;
    if (!live) return setDone({ status: "demo", pays: [] });
    setBusy(true);
    setErr("");
    if (resched) {
      const r = await fetch("/api/bookings/reschedule", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: resched.id, k: resched.k, slot }) });
      const x = await r.json().catch(() => ({}));
      setBusy(false);
      if (!r.ok) return setErr(x.error ?? "Something went wrong");
      setDone({ status: x.status === "confirmed" ? "confirmed" : "awaiting_payment", meetingUrl: x.meetingUrl, pays: [] });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const res = await fetch("/api/bookings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ handle: profile.handle, linkId: link.id, slot, name, email, note, consent: agree }) });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.status === 409) {
      // Someone took it a moment ago: refresh the times and let the visitor pick again.
      setSlot(null);
      setDay((x) => x);
      setSlotData(null);
      fetch(`/api/bookings?handle=${encodeURIComponent(profile.handle)}&linkId=${encodeURIComponent(link.id)}&date=${day}`).then((r) => r.json()).then((x) => setSlotData({ free: x.slots ?? [], all: x.all ?? x.slots ?? [] }));
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
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Opens Razorpay for a held booking; on success the booking confirms by itself.
  async function payOnline(p: RazorpayPay, held?: Result) {
    setPayErr("");
    const r = await payWithRazorpay(p, { name, email, title: link.title, creator: profile.name });
    if (r.ok) {
      setDone({ status: "confirmed", meetingUrl: r.meetingUrl, pays: [] });
    } else {
      if (held) setDone(held);
      if (!r.cancelled) setPayErr(r.error ?? "");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Depth: every surface is lifted off the page with a soft long shadow and a bright top edge, so the page feels layered.
  const lift = "shadow-[0_40px_90px_-40px_rgba(0,0,0,0.65),0_2px_0_rgba(255,255,255,0.10)_inset]";
  const raised = "shadow-[0_14px_26px_-14px_rgba(0,0,0,0.6),0_1px_0_rgba(255,255,255,0.28)_inset]";
  const card = `relative rounded-[28px] border border-t-fg/15 bg-gradient-to-br from-t-fg/[0.11] via-t-fg/[0.05] to-t-fg/[0.02] p-5 backdrop-blur-xl sm:p-7 ${lift}`;
  const field = `w-full ${t.input}`;
  const cta = "rounded-full bg-t-accent px-6 py-3.5 text-center text-[15px] font-semibold text-t-on-accent shadow-[0_18px_40px_-12px_var(--t-accent),0_1px_0_rgba(255,255,255,0.4)_inset] transition hover:-translate-y-0.5 active:translate-y-0";
  const enter = (i: number) => ({ initial: { opacity: 0, y: 28 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.08 * i, duration: 0.7, ease: [0.2, 0.7, 0.2, 1] as const } });

  return (
    <div style={style} className={`relative isolate min-h-screen overflow-hidden ${t.root}`}>
      <Background theme={theme} />
      <div className="pointer-events-none absolute -left-24 top-0 h-[420px] w-[420px] rounded-full bg-t-accent/25 blur-[110px]" />
      <div className="pointer-events-none absolute -right-24 top-[40%] h-[380px] w-[380px] rounded-full bg-t-accent2/20 blur-[110px]" />
      <main className="relative z-10 mx-auto w-full max-w-5xl px-4 pb-32 pt-8 sm:px-6 sm:pt-12 lg:pb-16">
        {done ? (
          <motion.div {...enter(0)} className="mx-auto max-w-lg pt-6 sm:pt-12">
            <div className={`${card} text-center`}>
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-t-accent text-t-on-accent shadow-[0_20px_44px_-10px_var(--t-accent),0_1px_0_rgba(255,255,255,0.4)_inset]"><Check className="h-8 w-8" /></span>
              {done.status === "demo" ? (
                <>
                  <h1 className={`${nameFont} mt-5 text-[30px] leading-tight`}>This is how it works</h1>
                  <p className="mt-3 text-[15px] leading-relaxed opacity-75">Your visitor picks a time and pays the host directly. The host confirms and the meeting link arrives by email. Nothing was booked or charged here.</p>
                  <Link href="/create?focus=booking" className={`${cta} mt-6 block`}>Add a booking card to my page</Link>
                </>
              ) : (
                <>
                  <h1 className={`${nameFont} mt-5 text-[30px] leading-tight`}>{done.status === "confirmed" ? "You're booked" : "Time held for you"}</h1>
                  {slot && <p className="mt-2 text-[15px] font-medium">{fmtDay(slot)} · {fmtTime(slot)}</p>}
                  <p className={`${t.meta} mt-1`}>{cfg.timeZone.replace("_", " ")}{!sameZone && ` · ${fmtTime(slot ?? 0, viewerTz)} your time`}</p>
                  {done.status === "confirmed" ? (
                    <div className="mt-6 space-y-3 text-[14px]">
                      <p className="opacity-70">{resched ? "Your new time is saved. We emailed you the details." : "We emailed you the details and a calendar file. Join with this link:"}</p>
                      {done.meetingUrl && <a href={done.meetingUrl} target="_blank" rel="noreferrer" className={`${cta} block break-all`}>Open meeting link</a>}
                      {!resched && (
                        <a href={`https://wa.me/?text=${encodeURIComponent(`I just booked "${link.title}" with ${profile.name}. You can book too: ${typeof window !== "undefined" ? window.location.origin : ""}/${profile.handle}`)}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-full border border-t-fg/25 px-5 py-3 font-semibold">
                          <WhatsAppIcon className="h-4 w-4" /> Share on WhatsApp
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className="mt-6 space-y-3 text-[14px]">
                      <p className="opacity-70">{done.pays.some((p) => p.kind === "razorpay" || p.kind === "paypal") ? `One step left: pay ${price} to hold your time. Your meeting link appears the moment the payment goes through.` : `One step left: pay ${price} to ${profile.name}. Your meeting link is emailed as soon as they confirm the payment.`}</p>
                      {payErr && <p className="text-[13px] text-red-500">{payErr}</p>}
                      {done.pays.map((p) =>
                        p.kind === "razorpay" ? (
                          <button key="rzp" type="button" onClick={() => payOnline(p)} className={`${cta} block w-full`}>Pay {price} now</button>
                        ) : p.kind === "paypal" ? (
                          <a key="pp" href={p.url} className={`${cta} block`}>Pay {price} with PayPal</a>
                        ) : p.kind === "upi" ? (
                          <div key="upi">
                            <a href={p.link} className={`${cta} block`}>Pay with UPI</a>
                            <p className="mt-2 text-[13px] opacity-60">or UPI ID: <span className="select-all font-mono">{p.upiId}</span></p>
                          </div>
                        ) : (
                          <a key="link" href={p.link} target="_blank" rel="noreferrer" className="block rounded-full border border-t-fg/30 px-5 py-3 font-semibold">Pay by card or PayPal</a>
                        ),
                      )}
                      {!done.pays.length && <p className="opacity-60">The host will email you how to pay.</p>}
                    </div>
                  )}
                </>
              )}
              <Link href={`/${profile.handle}`} className={`${t.meta} mt-7 inline-block underline underline-offset-4`}>Back to {profile.name}&apos;s page</Link>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-6">
            {/* Who you are booking */}
            <motion.div {...enter(0)} className="col-span-2 lg:col-span-4">
              <Tilt max={2} glare={false} className="h-full">
                <div className={`${card} flex h-full flex-col justify-between gap-6`}>
                  <Link href={`/${profile.handle}`} className={`${t.meta} inline-flex w-fit items-center gap-1.5 hover:opacity-100`}>
                    <ArrowLeft className="h-3.5 w-3.5" /> Back to {profile.name}
                  </Link>
                  <div className="flex items-center gap-4">
                    {profile.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={profile.avatar} alt="" className="h-20 w-20 rounded-[24px] object-cover ring-2 ring-t-accent ring-offset-4 ring-offset-t-bg shadow-[0_18px_36px_-12px_var(--t-accent)] sm:h-24 sm:w-24" />
                    ) : (
                      <span className="grid h-20 w-20 place-items-center rounded-[24px] bg-t-accent text-[28px] font-semibold text-t-on-accent ring-2 ring-t-accent ring-offset-4 ring-offset-t-bg shadow-[0_18px_36px_-12px_var(--t-accent)] sm:h-24 sm:w-24">{profile.name.charAt(0)}</span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-[17px] font-semibold">{profile.name}</p>
                      <p className={`${t.meta} truncate`}>@{profile.handle}</p>
                    </div>
                  </div>
                  <div>
                    <h1 className={`${nameFont} text-[34px] leading-[1.02] sm:text-[46px]`}>{link.title}</h1>
                    {cfg.description && <p className="mt-3 max-w-[52ch] text-[15px] leading-relaxed opacity-75">{cfg.description}</p>}
                    {/* On phones the price, length and time zone sit in one row here, so the calendar comes right after. */}
                    <div className="mt-4 flex flex-wrap gap-2 lg:hidden">
                      <span className="rounded-full bg-t-accent px-3.5 py-1.5 text-[14px] font-bold text-t-on-accent shadow-[0_10px_22px_-10px_var(--t-accent)]">{price}</span>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-t-fg/15 bg-t-fg/[0.06] px-3 py-1.5 text-[13px]"><Clock className="h-3.5 w-3.5 opacity-70" />{cfg.durationMin} min</span>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-t-fg/15 bg-t-fg/[0.06] px-3 py-1.5 text-[13px]"><Video className="h-3.5 w-3.5 opacity-70" />Video call</span>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-t-fg/15 bg-t-fg/[0.06] px-3 py-1.5 text-[13px]"><Globe className="h-3.5 w-3.5 opacity-70" />{cfg.timeZone.split("/").pop()!.replace("_", " ")}</span>
                    </div>
                    {!free && <p className="mt-2 text-[12px] opacity-60 lg:hidden">Paid straight to the host. Showz takes 0%.</p>}
                  </div>
                </div>
              </Tilt>
            </motion.div>

            {/* Price */}
            <motion.div {...enter(1)} className="col-span-2 hidden lg:col-span-2 lg:block">
              <div className="relative flex h-full min-h-[150px] flex-col justify-between overflow-hidden rounded-[28px] bg-gradient-to-br from-t-accent to-t-accent2 p-6 text-t-on-accent shadow-[0_40px_80px_-30px_var(--t-accent),0_2px_0_rgba(255,255,255,0.35)_inset]">
                <span className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-white/25 blur-2xl" />
                <span className="relative text-[13px] font-medium opacity-80">{free ? "Free session" : "One session"}</span>
                <div className="relative">
                  <p className="text-[48px] font-bold leading-none tracking-tight sm:text-[56px]">{price}</p>
                  <p className="mt-2 text-[13px] opacity-80">{free ? "No payment needed" : "Paid straight to the host. Showz takes 0%."}</p>
                </div>
              </div>
            </motion.div>

            {/* Quick facts */}
            <motion.div {...enter(2)} className="col-span-1 hidden lg:col-span-2 lg:block">
              <div className="flex h-full min-h-[120px] flex-col justify-between rounded-[28px] bg-t-fg p-5 text-t-bg shadow-[0_30px_60px_-28px_rgba(0,0,0,0.7)] transition duration-300 hover:-translate-y-1">
                <Clock className="h-5 w-5 opacity-70" />
                <div>
                  <p className="text-[36px] font-bold leading-none">{cfg.durationMin}</p>
                  <p className="mt-1 text-[13px] opacity-70">minutes</p>
                </div>
              </div>
            </motion.div>
            <motion.div {...enter(2.5)} className="col-span-1 hidden lg:col-span-2 lg:block">
              <div className={`${card} flex h-full min-h-[120px] flex-col justify-between !p-5 transition duration-300 hover:-translate-y-1`}>
                <Video className="h-5 w-5 opacity-70" />
                <div>
                  <p className="text-[19px] font-semibold leading-tight">Video call</p>
                  <p className="mt-1 text-[13px] opacity-60">Link sent by email</p>
                </div>
              </div>
            </motion.div>
            <motion.div {...enter(3)} className="col-span-2 hidden lg:col-span-2 lg:block">
              <div className={`${card} flex h-full min-h-[120px] flex-col justify-between !p-5 transition duration-300 hover:-translate-y-1`}>
                <Globe className="h-5 w-5 opacity-70" />
                <div>
                  <p className="text-[19px] font-semibold leading-tight">{cfg.timeZone.replace("_", " ")}</p>
                  <p className="mt-1 text-[13px] opacity-60">{sameZone ? "Same as your time zone" : `You are in ${viewerTz.replace("_", " ")}`}</p>
                </div>
              </div>
            </motion.div>

            {/* Calendar */}
            <motion.section {...enter(4)} className={`${card} col-span-2 lg:col-span-3`} aria-label="Choose a date">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-[17px] font-semibold">{monthLabel}</h2>
                <div className="flex gap-1.5">
                  <button type="button" disabled={!canPrev} onClick={() => setView((v) => (v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 }))} aria-label="Previous month" className={`grid h-10 w-10 place-items-center rounded-full border border-t-fg/15 bg-t-fg/[0.06] disabled:opacity-30 ${raised}`}><ChevronLeft className="h-4 w-4" /></button>
                  <button type="button" disabled={!canNext} onClick={() => setView((v) => (v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 }))} aria-label="Next month" className={`grid h-10 w-10 place-items-center rounded-full border border-t-fg/15 bg-t-fg/[0.06] disabled:opacity-30 ${raised}`}><ChevronRight className="h-4 w-4" /></button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1.5 text-center">
                {["S", "M", "T", "W", "T", "F", "S"].map((w, i) => <span key={i} className="py-1 text-[11px] font-medium opacity-50">{w}</span>)}
                {Array.from({ length: firstWeekday }).map((_, i) => <span key={`b${i}`} />)}
                {Array.from({ length: dim }, (_, i) => i + 1).map((d) => {
                  const k = ymdOf(view.y, view.m, d);
                  const info = days?.[k];
                  const open = !!info && info.free > 0 && k >= todayYmd;
                  const full = !!info && info.free === 0 && info.total > 0 && k >= todayYmd;
                  const selected = k === day;
                  return (
                    <button
                      type="button"
                      key={k}
                      disabled={!open}
                      onClick={() => { setDay(k); setSlot(null); }}
                      aria-label={`${k}${open ? "" : full ? ", fully booked" : ", unavailable"}`}
                      aria-pressed={selected}
                      className={`relative aspect-square rounded-2xl text-[14px] transition ${
                        selected
                          ? "scale-105 bg-t-accent font-bold text-t-on-accent shadow-[0_14px_30px_-8px_var(--t-accent),0_1px_0_rgba(255,255,255,0.4)_inset]"
                          : open
                            ? `bg-t-fg/[0.10] font-medium hover:-translate-y-0.5 hover:bg-t-fg/[0.2] ${raised}`
                            : full
                              ? "opacity-35 line-through"
                              : "opacity-25"
                      } ${k === todayYmd && !selected ? "ring-1 ring-t-fg/40" : ""}`}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
              {days === null && <p className="mt-3 text-[13px] opacity-60">Loading availability…</p>}
              {days && !Object.values(days).some((x) => x.free > 0) && <p className="mt-3 text-[13px] opacity-60">No free days this month. Try the next one.</p>}
            </motion.section>

            {/* Times */}
            <motion.section {...enter(5)} className={`${card} col-span-2 lg:col-span-3`} aria-label="Choose a time">
              <h2 className="text-[17px] font-semibold">{day ? fmtDay(new Date(`${day}T12:00:00Z`).getTime()) : "Pick a day first"}</h2>
              <p className="mt-1 text-[13px] opacity-60">{day ? "Taken times are crossed out." : "Days that are filled in have times left."}</p>
              <div className="mt-4">
                {!day ? (
                  <div className="grid place-items-center rounded-2xl border border-dashed border-t-fg/20 py-12 text-[14px] opacity-60">Choose a day in the calendar</div>
                ) : slotData === null ? (
                  <p className="text-[13px] opacity-60">Loading times…</p>
                ) : slotData.all.length === 0 ? (
                  <p className="text-[13px] opacity-60">No times on this day.</p>
                ) : (
                  <div className="grid max-h-[340px] grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
                    {slotData.all.map((s) => {
                      const open = slotData.free.includes(s);
                      return (
                        <button
                          type="button"
                          key={s}
                          disabled={!open}
                          onClick={() => { setSlot(s); setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 60); }}
                          className={`rounded-2xl border px-3 py-3 text-[14px] transition ${
                            s === slot
                              ? "border-t-accent bg-t-accent font-bold text-t-on-accent shadow-[0_14px_30px_-10px_var(--t-accent),0_1px_0_rgba(255,255,255,0.4)_inset]"
                              : open
                                ? `border-t-fg/20 bg-t-fg/[0.07] hover:-translate-y-0.5 hover:border-t-fg/50 ${raised}`
                                : "border-t-fg/10 opacity-40"
                          }`}
                        >
                          <span className={open ? "" : "line-through"}>{fmtTime(s)}</span>
                          {!open && <span className="mt-0.5 block text-[10px] uppercase tracking-wider no-underline">Booked</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.section>

            {/* How it works (after the form on phones) */}
            <motion.section {...enter(6)} className={`${card} order-[9] col-span-2 lg:order-none lg:col-span-3`} aria-label="How it works">
              <h2 className="text-[17px] font-semibold">How it works</h2>
              <ol className="mt-4 space-y-4 text-[14px]">
                {[
                  ["Pick a day and time", "Only times that are still free can be chosen."],
                  [free ? "Confirm your details" : `Pay ${price} to ${profile.name.split(" ")[0]} directly`, free ? "No payment needed." : "By UPI or a card link. No platform fee is added."],
                  ["Get your meeting link", "It arrives by email as soon as the booking is confirmed."],
                ].map(([a, b], n) => (
                  <li key={a} className="flex gap-3.5">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-t-accent text-[13px] font-bold text-t-on-accent shadow-[0_10px_20px_-6px_var(--t-accent)]">{n + 1}</span>
                    <span>
                      <span className="block font-medium">{a}</span>
                      <span className="block opacity-60">{b}</span>
                    </span>
                  </li>
                ))}
              </ol>
              {!free && (
                <p className="mt-5 flex items-start gap-2 text-[12px] opacity-60">
                  <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Your payment goes straight to the host.
                </p>
              )}
            </motion.section>

            {/* Details */}
            <motion.section {...enter(7)} ref={formRef} className={`${card} col-span-2 transition-opacity lg:col-span-3 ${slot ? "" : "opacity-70"}`} aria-label="Your details">
              <h2 className="text-[17px] font-semibold">Your details</h2>
              {slot ? (
                <p className="mt-1 text-[14px] opacity-75">
                  {fmtDay(slot)} · {fmtTime(slot)}{!sameZone && ` (${fmtTime(slot, viewerTz)} your time)`}
                </p>
              ) : (
                <p className="mt-1 text-[14px] opacity-60">Choose a time first.</p>
              )}
              <form id="bookform" onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2">
                {!live && <p className="rounded-xl bg-t-fg/10 px-3 py-2 text-[12px] opacity-80 sm:col-span-2">Demo: try it. Nothing is booked or charged.</p>}
                {resched && <p className="rounded-xl bg-t-accent/15 px-3.5 py-2.5 text-[13px] sm:col-span-2">Changing your booking from <b>{fmtDay(resched.old)} · {fmtTime(resched.old)}</b>. Pick a new time above.</p>}
                {!resched && (<>
                <input required disabled={!slot} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" maxLength={80} className={field} autoComplete="name" />
                <input required disabled={!slot} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email" className={field} autoComplete="email" />
                <textarea disabled={!slot} value={note} onChange={(e) => setNote(e.target.value)} placeholder="What would you like to talk about? (optional)" maxLength={500} rows={3} className={`${field} sm:col-span-2`} />
                <ConsentCheck checked={agree} onChange={setAgree} className="sm:col-span-2" />
                </>)}
                {err && <p className="text-[13px] text-red-500 sm:col-span-2">{err}</p>}
                <button disabled={!slot || busy} className={`${cta} hidden w-full disabled:opacity-40 disabled:shadow-none sm:col-span-2 lg:block`}>
                  {busy ? "Booking…" : resched ? "Move my booking here" : free ? "Confirm booking" : `Continue · ${price}`}
                </button>
              </form>
            </motion.section>

            <p className={`${t.meta} order-[10] col-span-2 text-center lg:col-span-6`}>
              <Link href={`/${profile.handle}`} className="underline underline-offset-4">See everything by {profile.name}</Link> · <Link href={`/?ref=${encodeURIComponent(profile.handle)}`} className="underline underline-offset-4">Made with Showz</Link>
            </p>
          </div>
        )}
      </main>

      {/* Phones and tablets: the price and the confirm button stay in reach */}
      {!done && (
        <div data-bottom-bar className="fixed inset-x-0 bottom-0 z-30 border-t border-t-fg/15 bg-t-bg/85 px-4 py-3 shadow-[0_-20px_40px_-20px_rgba(0,0,0,0.5)] backdrop-blur-xl lg:hidden" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
          <div className="mx-auto flex max-w-md items-center gap-3">
            <div className="min-w-0 flex-1 text-[13px] leading-tight">
              <p className="truncate font-semibold">{slot ? `${fmtDay(slot).split(",")[0] ?? ""} · ${fmtTime(slot)}` : "Pick a time"}</p>
              <p className="opacity-60">{link.title} · {price}</p>
            </div>
            <button form="bookform" disabled={!slot || busy} className={`${cta} shrink-0 !px-5 !py-3 disabled:opacity-40 disabled:shadow-none`}>
              {busy ? "Booking…" : resched ? "Move here" : free ? "Confirm" : "Continue"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
