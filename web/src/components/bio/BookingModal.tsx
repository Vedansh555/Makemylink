"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import type { BioLink } from "@/lib/types";
import Link from "next/link";
import { slotsForDay } from "@/lib/booking";
import { ConsentCheck } from "./ConsentCheck";
import { payWithRazorpay, type RazorpayPay } from "@/lib/razorpayClient";

const money = (price: number, cur: "INR" | "USD") => (price === 0 ? "Free" : cur === "INR" ? `₹${price.toLocaleString("en-IN")}` : `$${price}`);
export const bookingPrice = (l: BioLink) => (l.booking ? money(l.booking.price, l.booking.currency) : "");

type Pay = RazorpayPay | { kind: "upi"; upiId: string; link: string } | { kind: "link"; link: string };
type Result = { status: "confirmed" | "awaiting_payment" | "demo"; meetingUrl?: string; pays: Pay[] };

export function BookingModal({ link, handle, live, onClose }: { link: BioLink; handle: string; live: boolean; onClose: () => void }) {
  const cfg = link.booking!;
  const days = useMemo(() => {
    const out: string[] = [];
    const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: cfg.timeZone });
    for (let i = 0; i < 21 && out.length < 14; i++) {
      const d = fmt.format(new Date(Date.now() + i * 86_400_000));
      const wd = new Date(`${d}T12:00:00Z`).getUTCDay();
      if (cfg.days.includes(wd)) out.push(d);
    }
    return out;
  }, [cfg]);
  const [day, setDay] = useState(days[0] ?? "");
  const [slots, setSlots] = useState<number[] | null>(null);
  const [slot, setSlot] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [agree, setAgree] = useState(false);
  const [payErr, setPayErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState<Result | null>(null);

  useEffect(() => {
    if (!day) return;
    // On demo pages there is no server record, so show the same time slots locally.
    if (!live) {
      setSlots(slotsForDay(cfg, day, []));
      return;
    }
    let cancelled = false;
    fetch(`/api/bookings?handle=${encodeURIComponent(handle)}&linkId=${encodeURIComponent(link.id)}&date=${day}`)
      .then((r) => r.json())
      .then((d) => !cancelled && setSlots(d.slots ?? []))
      .catch(() => !cancelled && setSlots([]));
    return () => {
      cancelled = true;
    };
  }, [day, handle, link.id, live, cfg]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!slot) return;
    if (!live) {
      setDone({ status: "demo", pays: [] });
      return;
    }
    setBusy(true);
    setErr("");
    const res = await fetch("/api/bookings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ handle, linkId: link.id, slot, name, email, note, consent: agree }) });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setErr(d.error ?? "Something went wrong");
    const online = (d.pays as Pay[] | undefined)?.find((p): p is RazorpayPay => p.kind === "razorpay");
    if (d.status === "awaiting_payment" && online) {
      void payOnline(online, d);
      return;
    }
    setDone(d);
  }

  // Opens Razorpay for a held booking; on success the booking confirms by itself.
  async function payOnline(p: RazorpayPay, held?: Result) {
    setPayErr("");
    const r = await payWithRazorpay(p, { name, email, title: link.title, creator: link.title });
    if (r.ok) setDone({ status: "confirmed", meetingUrl: r.meetingUrl, pays: [] });
    else {
      if (held) setDone(held);
      if (!r.cancelled) setPayErr(r.error ?? "");
    }
  }

  const fmtTime = (ms: number) => new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", timeZone: cfg.timeZone }).format(new Date(ms));
  const field = "w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-[14px] text-white outline-none placeholder:text-white/30 focus:border-white/40";

  return (
    <div role="dialog" aria-modal="true" onClick={onClose} className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div onClick={(e) => e.stopPropagation()} className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-white/15 bg-[#141518] p-6 text-white shadow-2xl sm:rounded-3xl">
        <button type="button" onClick={onClose} aria-label="Close" className="absolute right-4 top-4 rounded-full p-1 text-white/50 hover:bg-white/10 hover:text-white">
          <X className="h-4 w-4" />
        </button>
        <h3 className="pr-8 text-[20px] font-bold">{link.title}</h3>
        <p className="mt-1 text-[13px] text-white/55">
          {cfg.durationMin} min · {money(cfg.price, cfg.currency)} · {cfg.timeZone.replace("_", " ")}
        </p>
        {cfg.description && <p className="mt-3 text-[14px] text-white/70">{cfg.description}</p>}

        {done ? (
          <div className="mt-6 space-y-4 text-[14px]">
            {done.status === "demo" ? (
              <>
                <p className="text-[16px] font-semibold">This is how it works</p>
                <p className="text-white/70">Your visitor picks a time and pays the creator directly by UPI or card link. The creator confirms, and the meeting link arrives by email. Nothing was booked or charged here.</p>
                <Link href="/create?focus=booking" className="block rounded-xl bg-white px-4 py-3 text-center font-semibold text-black">Add a booking card to my page</Link>
              </>
            ) : done.status === "confirmed" ? (
              <>
                <p className="text-[16px] font-semibold">You&apos;re booked ✓</p>
                <p className="text-white/70">We emailed you the details. Join with this link:</p>
                {done.meetingUrl && (
                  <a href={done.meetingUrl} target="_blank" rel="noreferrer" className="block break-all rounded-xl bg-white px-4 py-3 text-center font-semibold text-black">
                    Open meeting link
                  </a>
                )}
              </>
            ) : (
              <>
                <p className="text-[16px] font-semibold">Slot held. One step left.</p>
                <p className="text-white/70">{done.pays.some((p) => p.kind === "razorpay") ? `Pay ${money(cfg.price, cfg.currency)} to hold your time. Your meeting link appears the moment the payment goes through.` : `Pay ${money(cfg.price, cfg.currency)} directly to the creator. Your meeting link is emailed as soon as they confirm payment.`}</p>
                {payErr && <p className="text-[13px] text-red-300">{payErr}</p>}
                {done.pays.map((p) =>
                  p.kind === "razorpay" ? (
                    <button key="rzp" type="button" onClick={() => payOnline(p)} className="block w-full rounded-xl bg-white px-4 py-3 text-center font-semibold text-black">
                      Pay {money(cfg.price, cfg.currency)} now
                    </button>
                  ) : p.kind === "upi" ? (
                    <div key="upi">
                      <a href={p.link} className="block rounded-xl bg-white px-4 py-3 text-center font-semibold text-black">
                        Pay with UPI (India)
                      </a>
                      <p className="mt-2 text-center text-white/50">or UPI ID: <span className="select-all font-mono text-white">{p.upiId}</span></p>
                    </div>
                  ) : (
                    <a key="link" href={p.link} target="_blank" rel="noreferrer" className="block rounded-xl border border-white/30 px-4 py-3 text-center font-semibold text-white">
                      Pay by card or PayPal
                    </a>
                  ),
                )}
                {!done.pays.length && <p className="text-white/50">The creator will email you how to pay.</p>}
              </>
            )}
          </div>
        ) : (
          <form onSubmit={submit} className="mt-5 space-y-4">
            {!live && <p className="rounded-lg bg-white/10 px-3 py-2 text-[12px] text-white/70">Demo: try it. Nothing is booked or charged.</p>}
            <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
              {days.map((d) => (
                <button
                  type="button"
                  key={d}
                  onClick={() => {
                    setDay(d);
                    setSlot(null);
                    setSlots(null);
                  }}
                  className={`shrink-0 rounded-xl border px-3 py-2 text-center text-[12px] ${d === day ? "border-white bg-white text-black" : "border-white/15 text-white/70"}`}
                >
                  <div className="uppercase tracking-wider opacity-60">{new Date(`${d}T12:00:00Z`).toLocaleDateString("en-IN", { weekday: "short", timeZone: "UTC" })}</div>
                  <div className="text-[15px] font-bold">{d.slice(8)}</div>
                </button>
              ))}
            </div>
            {slots === null ? (
              <p className="text-[13px] text-white/50">Loading times…</p>
            ) : slots.length === 0 ? (
              <p className="text-[13px] text-white/50">No times left this day. Try another.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {slots.map((s) => (
                  <button type="button" key={s} onClick={() => setSlot(s)} className={`rounded-lg border py-2 text-[13px] ${s === slot ? "border-white bg-white text-black" : "border-white/15 text-white/80"}`}>
                    {fmtTime(s)}
                  </button>
                ))}
              </div>
            )}
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" maxLength={80} className={field} />
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email" className={field} />
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="What do you want to talk about? (optional)" maxLength={500} rows={2} className={field} />
            <ConsentCheck checked={agree} onChange={setAgree} className="text-white" />
            {err && <p className="text-[13px] text-red-300">{err}</p>}
            <button disabled={!slot || busy} className="w-full rounded-xl bg-white py-3 text-[14px] font-bold text-black disabled:opacity-40">
              {busy ? "Booking…" : cfg.price === 0 ? "Confirm booking" : `Continue · ${money(cfg.price, cfg.currency)}`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
