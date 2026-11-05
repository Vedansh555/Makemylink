"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Clock, Globe, ShieldCheck, Video } from "lucide-react";
import type { BioLink, Profile } from "@/lib/types";
import { slotsForDay } from "@/lib/booking";
import { fontClass, getTheme, readableOn } from "@/lib/themes";
import { bookingPrice } from "./BookingModal";

type Pay = { kind: "upi"; upiId: string; link: string } | { kind: "link"; link: string };
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
    const res = await fetch("/api/bookings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ handle: profile.handle, linkId: link.id, slot, name, email, note }) });
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
    setDone(d);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const card = "rounded-3xl border border-t-fg/15 bg-t-fg/[0.04] p-5 sm:p-7";
  const field = `w-full ${t.input}`;
  const pill = "inline-flex items-center gap-1.5 rounded-full border border-t-fg/15 px-3 py-1 text-[12px]";

  const host = (
    <div className={`${card} lg:sticky lg:top-8`}>
      <Link href={`/${profile.handle}`} className={`${t.meta} inline-flex items-center gap-1.5 hover:opacity-100`}>
        <ArrowLeft className="h-3.5 w-3.5" /> {profile.name}
      </Link>
      <div className="mt-5 flex items-center gap-3">
        {profile.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.avatar} alt="" className="h-14 w-14 rounded-full object-cover ring-1 ring-t-fg/20" />
        ) : (
          <span className="grid h-14 w-14 place-items-center rounded-full bg-t-fg/10 text-[20px]">{profile.name.charAt(0)}</span>
        )}
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold">{profile.name}</p>
          <p className={`${t.meta} truncate`}>@{profile.handle}</p>
        </div>
      </div>
      <h1 className={`${nameFont} mt-5 text-[30px] leading-[1.05] sm:text-[36px]`}>{link.title}</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        <span className={pill}><Clock className="h-3.5 w-3.5" /> {cfg.durationMin} min</span>
        <span className={pill}><Video className="h-3.5 w-3.5" /> Video call</span>
        <span className={`${pill} font-semibold`}>{price}</span>
      </div>
      {cfg.description && <p className="mt-4 text-[15px] leading-relaxed opacity-75">{cfg.description}</p>}

      <ol className="mt-6 space-y-3 border-t border-t-fg/10 pt-5 text-[14px]">
        {[
          ["Pick a day and time", "Only times that are still free are shown."],
          [free ? "Confirm your details" : `Pay ${price} to ${profile.name.split(" ")[0]} directly`, free ? "No payment needed." : "By UPI or card link. No platform fee is added."],
          ["Get your meeting link", "It arrives by email as soon as the booking is confirmed."],
        ].map(([a, b], n) => (
          <li key={a} className="flex gap-3">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-t-fg/10 text-[11px] font-semibold">{n + 1}</span>
            <span>
              <span className="block font-medium">{a}</span>
              <span className="block opacity-60">{b}</span>
            </span>
          </li>
        ))}
      </ol>
      {!free && (
        <p className="mt-5 flex items-start gap-2 text-[12px] opacity-60">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Your payment goes straight to the host. Showz takes 0%.
        </p>
      )}
    </div>
  );

  return (
    <div style={style} className={`relative min-h-screen ${t.root}`}>
      <main className="mx-auto w-full max-w-5xl px-4 pb-32 pt-8 sm:px-6 sm:pt-12 lg:pb-16">
        {done ? (
          <div className="mx-auto max-w-lg">
            <div className={`${card} text-center`}>
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-t-accent text-t-on-accent"><Check className="h-7 w-7" /></span>
              {done.status === "demo" ? (
                <>
                  <h1 className={`${nameFont} mt-5 text-[30px] leading-tight`}>This is how it works</h1>
                  <p className="mt-3 text-[15px] leading-relaxed opacity-75">Your visitor picks a time and pays the host directly. The host confirms and the meeting link arrives by email. Nothing was booked or charged here.</p>
                  <Link href="/create?focus=booking" className={`${t.button} mt-6 block`}>Add a booking card to my page</Link>
                </>
              ) : (
                <>
                  <h1 className={`${nameFont} mt-5 text-[30px] leading-tight`}>{done.status === "confirmed" ? "You're booked" : "Time held for you"}</h1>
                  {slot && <p className="mt-2 text-[15px] font-medium">{fmtDay(slot)} · {fmtTime(slot)}</p>}
                  <p className={`${t.meta} mt-1`}>{cfg.timeZone.replace("_", " ")}{!sameZone && ` · ${fmtTime(slot ?? 0, viewerTz)} your time`}</p>
                  {done.status === "confirmed" ? (
                    <div className="mt-6 space-y-3 text-[14px]">
                      <p className="opacity-70">We emailed you the details. Join with this link:</p>
                      {done.meetingUrl && <a href={done.meetingUrl} target="_blank" rel="noreferrer" className={`${t.button} block break-all`}>Open meeting link</a>}
                    </div>
                  ) : (
                    <div className="mt-6 space-y-3 text-[14px]">
                      <p className="opacity-70">One step left: pay {price} to {profile.name}. Your meeting link is emailed as soon as they confirm the payment.</p>
                      {done.pays.map((p) =>
                        p.kind === "upi" ? (
                          <div key="upi">
                            <a href={p.link} className={`${t.button} block`}>Pay with UPI</a>
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
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:gap-7">
            {host}

            <div className="space-y-5">
              <section className={card} aria-label="Choose a date and time">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="text-[17px] font-semibold">Select a date and time</h2>
                  <span className={`${t.meta} flex items-center gap-1.5`}><Globe className="h-3.5 w-3.5" />{cfg.timeZone.replace("_", " ")}</span>
                </div>

                <div className="mt-5 grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,220px)]">
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-[15px] font-medium">{monthLabel}</p>
                      <div className="flex gap-1">
                        <button type="button" disabled={!canPrev} onClick={() => setView((v) => (v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 }))} aria-label="Previous month" className="grid h-9 w-9 place-items-center rounded-full border border-t-fg/15 disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
                        <button type="button" disabled={!canNext} onClick={() => setView((v) => (v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 }))} aria-label="Next month" className="grid h-9 w-9 place-items-center rounded-full border border-t-fg/15 disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
                      </div>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center">
                      {["S", "M", "T", "W", "T", "F", "S"].map((w, i) => <span key={i} className={`${t.meta} py-1 !text-[10px]`}>{w}</span>)}
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
                            className={`relative aspect-square rounded-full text-[14px] transition ${
                              selected ? "bg-t-accent font-semibold text-t-on-accent" : open ? "bg-t-fg/[0.08] font-medium hover:bg-t-fg/20" : full ? "opacity-35 line-through" : "opacity-25"
                            } ${k === todayYmd && !selected ? "ring-1 ring-t-fg/40" : ""}`}
                          >
                            {d}
                          </button>
                        );
                      })}
                    </div>
                    {days === null && <p className={`${t.meta} mt-3`}>Loading availability…</p>}
                    {days && !Object.values(days).some((x) => x.free > 0) && <p className="mt-3 text-[13px] opacity-60">No free days this month. Try the next one.</p>}
                  </div>

                  <div>
                    <p className="mb-3 text-[15px] font-medium">{day ? fmtDay(new Date(`${day}T12:00:00Z`).getTime()) : "Pick a day"}</p>
                    {!day ? (
                      <p className="text-[13px] opacity-60">Days with a filled circle have times left.</p>
                    ) : slotData === null ? (
                      <p className="text-[13px] opacity-60">Loading times…</p>
                    ) : slotData.all.length === 0 ? (
                      <p className="text-[13px] opacity-60">No times on this day.</p>
                    ) : (
                      <div className="grid max-h-[320px] grid-cols-2 gap-2 overflow-y-auto pr-1 md:grid-cols-1">
                        {slotData.all.map((s) => {
                          const open = slotData.free.includes(s);
                          return (
                            <button
                              type="button"
                              key={s}
                              disabled={!open}
                              onClick={() => { setSlot(s); setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 60); }}
                              className={`rounded-xl border px-3 py-2.5 text-[14px] transition ${
                                s === slot ? "border-t-accent bg-t-accent font-semibold text-t-on-accent" : open ? "border-t-fg/25 hover:border-t-fg/60" : "border-t-fg/10 opacity-40"
                              }`}
                            >
                              <span className={open ? "" : "line-through"}>{fmtTime(s)}</span>
                              {!open && <span className="ml-2 text-[10px] uppercase tracking-wider">Booked</span>}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {!sameZone && <p className={`${t.meta} mt-3 !normal-case !tracking-normal`}>Times are in the host&apos;s zone. You are in {viewerTz.replace("_", " ")}.</p>}
                  </div>
                </div>
              </section>

              <section ref={formRef} className={`${card} ${slot ? "" : "opacity-60"}`} aria-label="Your details">
                <h2 className="text-[17px] font-semibold">Your details</h2>
                {slot ? (
                  <p className="mt-1 text-[14px] opacity-70">
                    {fmtDay(slot)} · {fmtTime(slot)}{!sameZone && ` (${fmtTime(slot, viewerTz)} your time)`}
                  </p>
                ) : (
                  <p className="mt-1 text-[14px] opacity-60">Choose a time above first.</p>
                )}
                <form id="bookform" onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2">
                  {!live && <p className="rounded-xl bg-t-fg/10 px-3 py-2 text-[12px] opacity-80 sm:col-span-2">Demo: try it. Nothing is booked or charged.</p>}
                  <input required disabled={!slot} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" maxLength={80} className={field} autoComplete="name" />
                  <input required disabled={!slot} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email" className={field} autoComplete="email" />
                  <textarea disabled={!slot} value={note} onChange={(e) => setNote(e.target.value)} placeholder="What would you like to talk about? (optional)" maxLength={500} rows={3} className={`${field} sm:col-span-2`} />
                  {err && <p className="text-[13px] text-red-500 sm:col-span-2">{err}</p>}
                  <button disabled={!slot || busy} className={`${t.button} hidden w-full disabled:opacity-40 sm:col-span-2 lg:block`}>
                    {busy ? "Booking…" : free ? "Confirm booking" : `Continue · ${price}`}
                  </button>
                </form>
              </section>
              <p className={`${t.meta} text-center`}>
                <Link href={`/${profile.handle}`} className="underline underline-offset-4">See everything by {profile.name}</Link> · <Link href={`/?ref=${encodeURIComponent(profile.handle)}`} className="underline underline-offset-4">Made with Showz</Link>
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Phones and tablets: the price and the confirm button stay in reach */}
      {!done && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-t-fg/15 bg-t-bg/90 px-4 py-3 backdrop-blur lg:hidden" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
          <div className="mx-auto flex max-w-md items-center gap-3">
            <div className="min-w-0 flex-1 text-[13px] leading-tight">
              <p className="truncate font-semibold">{slot ? `${fmtDay(slot).split(",")[0] ?? ""} · ${fmtTime(slot)}` : "Pick a time"}</p>
              <p className="opacity-60">{link.title} · {price}</p>
            </div>
            <button form="bookform" disabled={!slot || busy} className={`${t.button} shrink-0 disabled:opacity-40`}>
              {busy ? "Booking…" : free ? "Confirm" : "Continue"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
