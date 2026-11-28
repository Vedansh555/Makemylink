"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Download, Share2, Star } from "lucide-react";

const card = "rounded-3xl border border-fg/10 bg-gradient-to-br from-fg/[0.05] to-fg/[0.015] p-5 shadow-[0_24px_50px_-30px_rgba(0,0,0,0.35),0_1px_0_rgba(255,255,255,0.4)_inset]";

export interface KitCard {
  id: string;
  title: string;
  price: number;
  currency: "INR" | "USD";
  durationMin: number;
}

const money = (c: KitCard) => (c.price === 0 ? "Free" : c.currency === "INR" ? `₹${c.price.toLocaleString("en-IN")}` : `$${c.price}`);

/** Words split into lines that fit `max` pixels on the canvas. */
function lines(ctx: CanvasRenderingContext2D, text: string, max: number) {
  const out: string[] = [];
  let cur = "";
  for (const w of text.split(/\s+/)) {
    const next = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(next).width > max && cur) {
      out.push(cur);
      cur = w;
    } else cur = next;
  }
  if (cur) out.push(cur);
  return out;
}

const STEPS = [
  { day: "Day 1", text: "Put your Showz link in your Instagram and LinkedIn bio" },
  { day: "Day 1", text: "Post the share card as a story, with the link sticker" },
  { day: "Day 2", text: "Publish the LinkedIn post below" },
  { day: "Day 3", text: "Put the share card on your WhatsApp status" },
  { day: "Day 4", text: "Message 5 people who asked you for help before" },
  { day: "Day 5", text: "Save the story as a highlight called “Book a call”" },
  { day: "Day 7", text: "Share one thing a past client learned from you" },
];

/** Everything a creator needs to get their first paid booking: a share card, ready posts and a 7-day plan. */
export function BookingKit({ handle, name, cards }: { handle: string; name: string; cards: KitCard[] }) {
  const [pick, setPick] = useState(cards[0]?.id ?? "");
  const c = cards.find((x) => x.id === pick) ?? cards[0];
  const [tab, setTab] = useState<"story" | "linkedin" | "whatsapp">("story");
  const [copied, setCopied] = useState(false);
  const [done, setDone] = useState<number[]>([]);
  const canvas = useRef<HTMLCanvasElement>(null);
  const store = `showz-kit-${handle}`;
  const origin = typeof window !== "undefined" ? window.location.origin : "https://showz.me";
  const host = origin.replace(/^https?:\/\//, "");
  const url = c ? `${origin}/${handle}/${c.id}` : `${origin}/${handle}`;

  useEffect(() => {
    try {
      setDone(JSON.parse(localStorage.getItem(store) ?? "[]"));
    } catch {}
  }, [store]);
  const toggle = (i: number) => {
    const next = done.includes(i) ? done.filter((x) => x !== i) : [...done, i];
    setDone(next);
    try {
      localStorage.setItem(store, JSON.stringify(next));
    } catch {}
  };

  const posts = useMemo(() => {
    if (!c) return { story: "", linkedin: "", whatsapp: "" };
    const what = `${c.title} · ${c.durationMin} min · ${money(c)}`;
    return {
      story: `I'm opening a few 1:1 slots 🗓️\n${what}\nPick a time and book here: ${url}`,
      linkedin: `I keep getting the same questions in my DMs, so I've opened a few 1:1 sessions.\n\n${c.title}: ${c.durationMin} minutes, ${money(c)}. You pick a time that suits you, pay in a minute, and get the meeting link straight away.\n\nBook here: ${url}`,
      whatsapp: `Taking a few 1:1 sessions this week: ${c.title} (${c.durationMin} min, ${money(c)}). Book a time here: ${url}`,
    };
  }, [c, url]);

  // The share card: 1080 x 1350, drawn in the browser so it always matches the current session.
  const draw = useCallback(() => {
    const cv = canvas.current;
    if (!cv || !c) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const W = 1080, H = 1350, P = 96;
    ctx.fillStyle = "#141414";
    ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(W * 0.85, H * 0.1, 40, W * 0.85, H * 0.1, 700);
    g.addColorStop(0, "rgba(255,91,55,0.55)");
    g.addColorStop(1, "rgba(255,91,55,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "500 40px system-ui, sans-serif";
    ctx.fillText("Book a 1:1 session with", P, 230);
    ctx.fillStyle = "#ffffff";
    // Shrink the name until it fits in two lines, so long names are never cut off.
    let size = 112;
    let nameLines: string[] = [];
    for (; size >= 56; size -= 8) {
      ctx.font = `italic 400 ${size}px Georgia, 'Times New Roman', serif`;
      nameLines = lines(ctx, name || handle, W - P * 2);
      if (nameLines.length <= 2 && nameLines.every((l) => ctx.measureText(l).width <= W - P * 2)) break;
    }
    let y = 360;
    for (const l of nameLines.slice(0, 2)) {
      ctx.fillText(l, P, y, W - P * 2);
      y += size * 1.05;
    }
    ctx.font = "700 64px system-ui, sans-serif";
    y += 40;
    for (const l of lines(ctx, c.title, W - P * 2).slice(0, 3)) {
      ctx.fillText(l, P, y, W - P * 2);
      y += 78;
    }
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "500 46px system-ui, sans-serif";
    ctx.fillText(`${c.durationMin} min  ·  ${money(c)}`, P, y + 30);
    // link pill
    const label = `${host}/${handle}`;
    ctx.font = "700 44px system-ui, sans-serif";
    const tw = Math.min(ctx.measureText(label).width, W - P * 2 - 80);
    const bx = P, by = H - 260, bh = 110, bw = tw + 80;
    ctx.fillStyle = "#ff5b37";
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 55);
    ctx.fill();
    ctx.fillStyle = "#141414";
    ctx.fillText(label, bx + 40, by + 70, W - P * 2 - 80);
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.font = "500 34px system-ui, sans-serif";
    ctx.fillText("Pick a time · pay in a minute · get the link instantly", P, H - 96);
  }, [c, name, handle, host]);
  useEffect(draw, [draw]);

  const blob = () => new Promise<Blob | null>((res) => canvas.current?.toBlob(res, "image/png") ?? res(null));
  async function download() {
    const b = await blob();
    if (!b) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(b);
    a.download = `${handle}-booking.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
  async function share() {
    const b = await blob();
    const file = b ? new File([b], `${handle}-booking.png`, { type: "image/png" }) : null;
    try {
      if (file && navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], text: posts.story });
      else await download();
    } catch {}
  }
  const copy = () => {
    navigator.clipboard?.writeText(posts[tab]).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  if (!c) return null;
  const progress = done.length;
  return (
    <div className={card}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[15px] font-semibold">Get your first booking</p>
          <p className="mt-1 text-[13px] text-fg/55">A share card, posts written for you, and a 7-day plan. Bookings come from telling people, so do one step a day.</p>
        </div>
        {cards.length > 1 && (
          <select value={pick} onChange={(e) => setPick(e.target.value)} aria-label="Which session" className="min-h-[40px] max-w-full rounded-xl border border-fg/15 bg-bg px-3 text-[13px]">
            {cards.map((x) => (
              <option key={x.id} value={x.id}>{x.title}</option>
            ))}
          </select>
        )}
      </div>

      <div className="mt-5 grid gap-6 md:grid-cols-[minmax(0,240px)_minmax(0,1fr)]">
        <div>
          <canvas ref={canvas} width={1080} height={1350} className="aspect-[4/5] w-full max-w-[240px] rounded-2xl border border-fg/10" aria-label="Share card preview" />
          <div className="mt-3 flex max-w-[240px] gap-2">
            <button type="button" onClick={share} className="flex min-h-[42px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-fg px-3 text-[13px] font-semibold text-bg">
              <Share2 className="h-4 w-4" /> Share
            </button>
            <button type="button" onClick={download} aria-label="Download the share card" className="grid min-h-[42px] w-12 place-items-center rounded-xl border border-fg/20">
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex rounded-full border border-fg/10 bg-fg/5 p-1 text-[12px]">
            {([["story", "Story"], ["linkedin", "LinkedIn"], ["whatsapp", "WhatsApp"]] as const).map(([k, label]) => (
              <button key={k} type="button" onClick={() => { setTab(k); setCopied(false); }} className={`min-h-[36px] flex-1 rounded-full px-2 transition ${tab === k ? "bg-fg font-medium text-bg" : "text-fg/60 hover:text-fg"}`}>
                {label}
              </button>
            ))}
          </div>
          <p className="mt-3 whitespace-pre-line rounded-xl border border-fg/10 bg-bg/80 p-3.5 text-[13px] leading-relaxed text-fg/80 [overflow-wrap:anywhere]">{posts[tab]}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={copy} className="min-h-[40px] rounded-xl bg-fg px-4 text-[13px] font-semibold text-bg">{copied ? "Copied" : "Copy text"}</button>
            {tab === "whatsapp" && <a href={`https://wa.me/?text=${encodeURIComponent(posts.whatsapp)}`} target="_blank" rel="noreferrer" className="inline-flex min-h-[40px] items-center rounded-xl border border-fg/20 px-4 text-[13px]">Open WhatsApp</a>}
            {tab === "linkedin" && <a href={`https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(posts.linkedin)}`} target="_blank" rel="noreferrer" className="inline-flex min-h-[40px] items-center rounded-xl border border-fg/20 px-4 text-[13px]">Open LinkedIn</a>}
          </div>

          <div className="mt-6 flex items-baseline justify-between">
            <p className="text-[14px] font-semibold">Your 7-day plan</p>
            <p className="text-[12px] text-fg/50 tabular-nums">{progress} of {STEPS.length} done</p>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-fg/[0.07]">
            <div className="h-full rounded-full bg-[#ff5b37] transition-[width] duration-300" style={{ width: `${(progress / STEPS.length) * 100}%` }} />
          </div>
          <ul className="mt-3 space-y-1">
            {STEPS.map((s, i) => {
              const on = done.includes(i);
              return (
                <li key={i}>
                  <button type="button" onClick={() => toggle(i)} aria-pressed={on} className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-2 text-left text-[13px] transition hover:bg-fg/[0.04]">
                    <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border transition ${on ? "border-[#ff5b37] bg-[#ff5b37] text-[#111]" : "border-fg/25"}`}>{on && <Check className="h-3.5 w-3.5" />}</span>
                    <span className="w-12 shrink-0 text-fg/45">{s.day}</span>
                    <span className={on ? "text-fg/45 line-through" : "text-fg/80"}>{s.text}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

interface BuyerReview {
  id: string;
  name: string;
  role: string | null;
  quote: string;
  rating: number;
  status: "pending" | "approved" | "hidden";
  created_at: number;
}

/** Reviews buyers left after their session. Nothing shows on the page until the creator approves it. */
export function BuyerReviews() {
  const [list, setList] = useState<BuyerReview[] | null>(null);
  const [busy, setBusy] = useState("");
  const load = useCallback(async () => {
    const r = await fetch("/api/reviews");
    if (r.ok) setList(((await r.json()) as { reviews: BuyerReview[] }).reviews);
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  async function act(id: string, action: "approve" | "hide") {
    setBusy(id);
    await fetch("/api/reviews", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action }) });
    setBusy("");
    load();
  }

  return (
    <div className={card}>
      <p className="text-[15px] font-semibold">Reviews from buyers</p>
      <p className="mt-1 text-[13px] text-fg/55">A few hours after each session, the buyer is emailed a short review form. You choose which reviews show on your page.</p>
      {list === null ? (
        <div className="mt-4 h-16 animate-pulse rounded-2xl bg-fg/[0.05]" />
      ) : list.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-fg/15 px-4 py-6 text-center text-[13px] text-fg/50">No reviews yet. They arrive after your first sessions.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {list.map((r) => (
            <li key={r.id} className="rounded-2xl border border-fg/10 bg-bg/70 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="flex gap-0.5" aria-label={`${r.rating} out of 5 stars`}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} className={`h-4 w-4 ${n <= r.rating ? "fill-[#ff5b37] text-[#ff5b37]" : "text-fg/20"}`} />
                  ))}
                </span>
                <span className={`text-[12px] font-semibold ${r.status === "approved" ? "text-emerald-500" : r.status === "hidden" ? "text-fg/40" : "text-amber-500"}`}>
                  {r.status === "approved" ? "On your page" : r.status === "hidden" ? "Hidden" : "New"}
                </span>
              </div>
              <p className="mt-2 text-[14px] leading-relaxed text-fg/80 [overflow-wrap:anywhere]">“{r.quote}”</p>
              <p className="mt-1 text-[12px] text-fg/50 [overflow-wrap:anywhere]">{r.name}{r.role ? `, ${r.role}` : ""}</p>
              <div className="mt-3 flex gap-2">
                {r.status !== "approved" && <button disabled={busy === r.id} onClick={() => act(r.id, "approve")} className="min-h-[38px] rounded-lg bg-fg px-3.5 text-[12px] font-semibold text-bg disabled:opacity-50">Show on my page</button>}
                {r.status !== "hidden" && <button disabled={busy === r.id} onClick={() => act(r.id, "hide")} className="min-h-[38px] rounded-lg border border-fg/20 px-3.5 text-[12px] disabled:opacity-50">{r.status === "approved" ? "Remove from page" : "Hide"}</button>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
