"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Calendar as CalendarIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Globe,
  Lock,
  Mail,
  MessageSquare,
  ShieldCheck,
  User,
  Video,
  X,
  ArrowLeft,
} from "lucide-react";
import type { BioLink } from "@/lib/types";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { slotsForDay } from "@/lib/booking";
import { ConsentCheck } from "./ConsentCheck";
import { WhatsAppIcon } from "./WhatsAppModal";
import { payWithRazorpay, type RazorpayPay } from "@/lib/razorpayClient";

const money = (price: number, cur: "INR" | "USD") =>
  price === 0 ? "Free" : cur === "INR" ? `₹${price.toLocaleString("en-IN")}` : `$${price}`;
export const bookingPrice = (l: BioLink) => (l.booking ? money(l.booking.price, l.booking.currency) : "");

type Pay =
  | RazorpayPay
  | { kind: "paypal"; url: string }
  | { kind: "upi"; upiId: string; link: string }
  | { kind: "link"; link: string };

type Result = { status: "confirmed" | "awaiting_payment" | "demo"; meetingUrl?: string; pays: Pay[] };

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

export function BookingModal({
  link,
  handle,
  live,
  onClose,
}: {
  link: BioLink;
  handle: string;
  live: boolean;
  onClose: () => void;
}) {
  const cfg = link.booking!;

  // Month navigation in creator's timezone
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
  const [payErr, setPayErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState<Result | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);

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
    fetch(`/api/bookings?handle=${encodeURIComponent(handle)}&linkId=${encodeURIComponent(link.id)}&month=${monthKey}`)
      .then((r) => r.json())
      .then((d) => !cancelled && setDays(d.days ?? {}))
      .catch(() => !cancelled && setDays({}));
    return () => {
      cancelled = true;
    };
  }, [monthKey, live, cfg, handle, link.id, view.y, view.m]);

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
    fetch(`/api/bookings?handle=${encodeURIComponent(handle)}&linkId=${encodeURIComponent(link.id)}&date=${day}`)
      .then((r) => r.json())
      .then((d) => !cancelled && setSlotData({ free: d.slots ?? [], all: d.all ?? d.slots ?? [] }))
      .catch(() => !cancelled && setSlotData({ free: [], all: [] }));
    return () => {
      cancelled = true;
    };
  }, [day, live, cfg, handle, link.id]);

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
  const firstWeekday = (new Date(view.y, view.m, 1).getDay() + 6) % 7;
  const dim = new Date(view.y, view.m + 1, 0).getDate();
  const prevDim = new Date(view.y, view.m, 0).getDate();

  const canPrev = view.y > ty || view.m > tm - 1;
  const lastAllowed = new Date(ty, tm - 1 + 3, 1);
  const canNext = new Date(view.y, view.m + 1, 1) <= lastAllowed;

  const price = money(cfg.price, cfg.currency);
  const free = cfg.price === 0;

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
    if (!live) {
      setDone({ status: "demo", pays: [] });
      return;
    }
    setBusy(true);
    setErr("");
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ handle, linkId: link.id, slot, name, email, note, consent: agree }),
    });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.status === 409) {
      setSlot(null);
      setSlotData(null);
      fetch(`/api/bookings?handle=${encodeURIComponent(handle)}&linkId=${encodeURIComponent(link.id)}&date=${day}`)
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
    const r = await payWithRazorpay(p, { name, email, title: link.title, creator: link.title });
    if (r.ok) setDone({ status: "confirmed", meetingUrl: r.meetingUrl, pays: [] });
    else {
      if (held) setDone(held);
      if (!r.cancelled) setPayErr(r.error ?? "");
    }
  }

  const copyUpi = (text: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/75 p-0 backdrop-blur-md sm:items-center sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-t-3xl border border-white/15 bg-[#121215] text-white shadow-2xl sm:rounded-3xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-20 rounded-full p-2 text-white/50 hover:bg-white/10 hover:text-white transition"
        >
          <X className="h-5 w-5" />
        </button>

        {done ? (
          /* Success / Confirmation */
          <div className="p-6 sm:p-8 text-center max-w-lg mx-auto">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white text-black shadow-lg">
              <Check className="h-8 w-8 stroke-[2.5]" />
            </span>

            {done.status === "demo" ? (
              <>
                <h3 className="mt-5 text-[24px] font-bold">This is how it works</h3>
                <p className="mt-3 text-[14px] text-white/70">
                  Your visitor picks a time and pays you directly. The meeting link arrives by email. Showz takes 0% commission.
                  Nothing was booked or charged here.
                </p>
                <Link
                  href="/create?focus=booking"
                  className="mt-6 block rounded-xl bg-white px-5 py-3.5 text-center font-bold text-black"
                >
                  Add a booking card to my page
                </Link>
              </>
            ) : done.status === "confirmed" ? (
              <>
                <h3 className="mt-5 text-[24px] font-bold">You&apos;re booked!</h3>
                {slot && (
                  <p className="mt-2 text-[14px] text-white/80">
                    {fmtFullDay(slot)} · {fmtSlotTime(slot, false)}
                  </p>
                )}
                <p className="mt-3 text-[14px] text-white/70">
                  We emailed you the details and calendar invite. Join with this link:
                </p>
                {done.meetingUrl && (
                  <a
                    href={done.meetingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 block break-all rounded-xl bg-white px-4 py-3 font-bold text-black hover:bg-white/90"
                  >
                    Open Google Meet Link
                  </a>
                )}
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `I just booked "${link.title}". Book here: ${
                      typeof window !== "undefined" ? window.location.origin : ""
                    }/${handle}`,
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-3 font-semibold text-white hover:bg-white/10"
                >
                  <WhatsAppIcon className="h-4 w-4" /> Share on WhatsApp
                </a>
              </>
            ) : (
              <>
                <h3 className="mt-5 text-[24px] font-bold">Slot held. One step left.</h3>
                {slot && (
                  <p className="mt-2 text-[14px] text-white/80">
                    {fmtFullDay(slot)} · {fmtSlotTime(slot, false)}
                  </p>
                )}
                <p className="mt-3 text-[14px] text-white/70">
                  {done.pays.some((p) => p.kind === "razorpay" || p.kind === "paypal")
                    ? `Pay ${price} to hold your spot. Your meeting link appears the moment payment is confirmed.`
                    : `Pay ${price} directly to the creator. Your meeting link is sent as soon as they confirm.`}
                </p>
                {payErr && <p className="mt-2 text-[13px] text-red-400">{payErr}</p>}
                <div className="mt-5 space-y-3">
                  {done.pays.map((p) =>
                    p.kind === "paypal" ? (
                      <a
                        key="pp"
                        href={p.url}
                        className="block w-full rounded-xl bg-white px-4 py-3 font-bold text-black"
                      >
                        Pay {price} with PayPal
                      </a>
                    ) : p.kind === "razorpay" ? (
                      <button
                        key="rzp"
                        type="button"
                        onClick={() => payOnline(p)}
                        className="block w-full rounded-xl bg-white px-4 py-3 font-bold text-black"
                      >
                        Pay {price} now
                      </button>
                    ) : p.kind === "upi" ? (
                      <div key="upi" className="space-y-2">
                        <a
                          href={p.link}
                          className="block rounded-xl bg-[#25d366] px-4 py-3 font-bold text-black"
                        >
                          Pay with UPI App
                        </a>
                        <div className="flex items-center justify-between rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-[13px]">
                          <span className="font-mono text-white/90">{p.upiId}</span>
                          <button
                            type="button"
                            onClick={() => copyUpi(p.upiId)}
                            className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-[11px] font-medium text-white hover:bg-white/20"
                          >
                            <Copy className="h-3 w-3" /> {copiedUpi ? "Copied" : "Copy"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <a
                        key="link"
                        href={p.link}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-xl border border-white/30 px-4 py-3 font-semibold text-white"
                      >
                        Pay via card or link
                      </a>
                    ),
                  )}
                </div>
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="mt-6 text-[13px] text-white/60 hover:text-white underline underline-offset-4"
            >
              Close
            </button>
          </div>
        ) : (
          /* Cal.com 3-column / 2-step Booking UI */
          <div className="grid grid-cols-1 md:grid-cols-12 md:divide-x md:divide-white/10">
            {/* Col 1: Details (~4 cols) */}
            <div className="p-6 md:p-7 md:col-span-4 flex flex-col justify-between border-b md:border-b-0 border-white/10">
              <div className="space-y-4">
                <p className="text-[13px] font-medium text-white/50">@{handle}</p>
                <h3 className="text-[22px] font-bold leading-snug">{link.title}</h3>
                {cfg.description && (
                  <p className="text-[13px] leading-relaxed text-white/65 line-clamp-3">{cfg.description}</p>
                )}

                <div className="space-y-2.5 pt-1 text-[13px] text-white/75">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-white/50 shrink-0" />
                    <span>{cfg.durationMin}m</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4 text-white/50 shrink-0" />
                    <span>Google Meet</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-white/50 shrink-0" />
                    <span className="truncate">
                      {cfg.timeZone.replace("_", " ")}
                      {!sameZone && <span className="block text-[11px] text-white/40">Local: {viewerTz.replace("_", " ")}</span>}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10">
                <div className="flex items-baseline justify-between">
                  <span className="text-[12px] text-white/50">{free ? "Free session" : "Price"}</span>
                  <span className="text-[20px] font-bold text-white">{price}</span>
                </div>
                <p className="mt-1 flex items-center gap-1 text-[11px] text-emerald-400">
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0" /> 100% direct host payout · 0% fee
                </p>
              </div>
            </div>

            {/* Col 2 & 3: Calendar / Time Slots OR Form */}
            <div className="md:col-span-8 flex flex-col">
              <AnimatePresence mode="wait">
                {slot ? (
                  /* Form Step */
                  <motion.div
                    key="modal-form"
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    className="p-6 md:p-8 flex-1 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-white/10">
                        <button
                          type="button"
                          onClick={() => setSlot(null)}
                          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-white/70 hover:text-white"
                        >
                          <ArrowLeft className="h-4 w-4" /> Change date or time
                        </button>
                        <span className="text-[12px] text-white/50">Step 2 of 2</span>
                      </div>

                      <div className="mt-4 rounded-xl border border-white/15 bg-white/5 p-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <CalendarIcon className="h-4 w-4 text-white/70" />
                          <span className="text-[14px] font-medium text-white">
                            {fmtFullDay(slot)} · {fmtSlotTime(slot, use24h)} ({cfg.durationMin}m)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSlot(null)}
                          className="text-[11px] text-white/50 hover:text-white underline underline-offset-2"
                        >
                          Change
                        </button>
                      </div>

                      <form onSubmit={submit} className="mt-5 space-y-3.5">
                        {!live && (
                          <p className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[12px] text-white/70">
                            Demo mode: You can test the exact flow without paying or booking.
                          </p>
                        )}
                        <div>
                          <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/60 mb-1">
                            Your Name *
                          </label>
                          <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-white/40" />
                            <input
                              required
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              placeholder="Your full name"
                              maxLength={80}
                              className="w-full rounded-xl border border-white/15 bg-white/5 pl-9 pr-3.5 py-2.5 text-[14px] text-white outline-none placeholder:text-white/30 focus:border-white/50"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/60 mb-1">
                            Email Address *
                          </label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-white/40" />
                            <input
                              required
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="you@example.com"
                              className="w-full rounded-xl border border-white/15 bg-white/5 pl-9 pr-3.5 py-2.5 text-[14px] text-white outline-none placeholder:text-white/30 focus:border-white/50"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/60 mb-1">
                            Topics / Goals <span className="opacity-50">(optional)</span>
                          </label>
                          <div className="relative">
                            <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-white/40" />
                            <textarea
                              value={note}
                              onChange={(e) => setNote(e.target.value)}
                              placeholder="What would you like to talk about?"
                              maxLength={500}
                              rows={2}
                              className="w-full rounded-xl border border-white/15 bg-white/5 pl-9 pr-3.5 py-2 text-[14px] text-white outline-none placeholder:text-white/30 focus:border-white/50 resize-none"
                            />
                          </div>
                        </div>

                        <ConsentCheck checked={agree} onChange={setAgree} className="text-white/80" />

                        {err && <p className="text-[13px] text-red-400">{err}</p>}

                        <button
                          type="submit"
                          disabled={busy}
                          className="w-full rounded-xl bg-white py-3 text-[14px] font-bold text-black transition hover:bg-white/90 disabled:opacity-50 shadow-lg cursor-pointer"
                        >
                          {busy ? "Booking…" : free ? "Confirm Booking" : `Continue to Payment · ${price}`}
                        </button>
                      </form>
                    </div>

                    <p className="mt-4 text-center text-[11px] text-white/40 flex items-center justify-center gap-1">
                      <Lock className="h-3 w-3" /> Encrypted & direct host booking
                    </p>
                  </motion.div>
                ) : (
                  /* Calendar & Slots Step */
                  <motion.div
                    key="modal-calendar"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-1 sm:grid-cols-12 flex-1 sm:divide-x sm:divide-white/10"
                  >
                    {/* Calendar grid */}
                    <div className="p-5 sm:col-span-7 flex flex-col justify-between">
                      <div>
                        <div className="mb-3.5 flex items-center justify-between">
                          <h4 className="text-[15px] font-semibold text-white">{monthLabel}</h4>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              disabled={!canPrev}
                              onClick={() =>
                                setView((v) => (v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 }))
                              }
                              className="grid h-7 w-7 place-items-center rounded-lg border border-white/10 bg-white/5 text-white/70 hover:text-white disabled:opacity-20"
                            >
                              <ChevronLeft className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={!canNext}
                              onClick={() =>
                                setView((v) => (v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 }))
                              }
                              className="grid h-7 w-7 place-items-center rounded-lg border border-white/10 bg-white/5 text-white/70 hover:text-white disabled:opacity-20"
                            >
                              <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-7 gap-1 text-center mb-1">
                          {WEEKDAYS.map((w) => (
                            <span key={w} className="py-0.5 text-[10px] font-semibold text-white/40 tracking-wider">
                              {w}
                            </span>
                          ))}
                        </div>

                        <div className="grid grid-cols-7 gap-1 text-center">
                          {Array.from({ length: firstWeekday }).map((_, i) => (
                            <span
                              key={`p-${i}`}
                              className="aspect-square grid place-items-center text-[12px] text-white/15 select-none"
                            >
                              {prevDim - firstWeekday + 1 + i}
                            </span>
                          ))}

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
                                className={`relative aspect-square rounded-lg text-[13px] font-medium transition cursor-pointer select-none flex flex-col items-center justify-center ${
                                  selected
                                    ? "bg-white text-black font-bold shadow-md z-10"
                                    : open
                                    ? "bg-[#202024] text-white hover:bg-[#2b2b32]"
                                    : "text-white/20 bg-transparent cursor-default"
                                } ${isToday && !selected ? "ring-1 ring-white/30" : ""}`}
                              >
                                <span>{d}</span>
                                {open && !selected && (
                                  <span className="absolute bottom-1 h-1 w-1 rounded-full bg-white/60" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {days === null ? (
                        <p className="mt-3 text-[11px] text-white/40">Loading availability…</p>
                      ) : days && !Object.values(days).some((x) => x.free > 0) ? (
                        <p className="mt-3 text-[11px] text-white/50">No free dates this month.</p>
                      ) : null}
                    </div>

                    {/* Time slots */}
                    <div className="p-5 sm:col-span-5 flex flex-col border-t sm:border-t-0 border-white/10">
                      <div className="flex items-center justify-between pb-3 border-b border-white/10">
                        <span className="text-[14px] font-semibold text-white">{dayHeader}</span>
                        <div className="flex items-center rounded-lg border border-white/10 bg-white/5 p-0.5 text-[10px] font-medium text-white/70">
                          <button
                            type="button"
                            onClick={() => setUse24h(false)}
                            className={`rounded px-1.5 py-0.5 transition ${
                              !use24h ? "bg-white/20 text-white font-semibold" : "hover:text-white"
                            }`}
                          >
                            12h
                          </button>
                          <button
                            type="button"
                            onClick={() => setUse24h(true)}
                            className={`rounded px-1.5 py-0.5 transition ${
                              use24h ? "bg-white/20 text-white font-semibold" : "hover:text-white"
                            }`}
                          >
                            24h
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 flex-1">
                        {!day ? (
                          <div className="grid h-36 place-items-center rounded-xl border border-dashed border-white/10 text-[12px] text-white/40">
                            Choose a date
                          </div>
                        ) : slotData === null ? (
                          <div className="space-y-1.5">
                            {[1, 2, 3].map((n) => (
                              <div key={n} className="h-9 w-full animate-pulse rounded-lg bg-white/5" />
                            ))}
                          </div>
                        ) : slotData.all.length === 0 ? (
                          <div className="grid h-36 place-items-center rounded-xl border border-dashed border-white/10 text-[12px] text-white/40">
                            No slots on this date
                          </div>
                        ) : (
                          <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                            {slotData.all.map((s) => {
                              const open = slotData.free.includes(s);
                              return (
                                <button
                                  type="button"
                                  key={s}
                                  disabled={!open}
                                  onClick={() => setSlot(s)}
                                  className={`w-full py-2 px-3 rounded-lg text-center text-[13px] font-medium transition cursor-pointer ${
                                    open
                                      ? "border border-white/10 hover:border-white/40 bg-white/[0.04] hover:bg-white/[0.09] text-white"
                                      : "border border-white/5 opacity-30 line-through text-white/40 cursor-not-allowed"
                                  }`}
                                >
                                  {fmtSlotTime(s, use24h)}
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
        )}
      </div>
    </div>
  );
}
