"use client";

import { useState } from "react";
import { Star } from "lucide-react";

const field = "w-full rounded-xl border border-fg/15 bg-bg px-4 py-3 text-[14px] outline-none transition placeholder:text-fg/35 focus:border-fg/50";

export function ReviewForm({ id, k, defaultName, host }: { id: string; k: string; defaultName: string; host: string }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [quote, setQuote] = useState("");
  const [name, setName] = useState(defaultName);
  const [role, setRole] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) return setErr("Tap a star rating first.");
    setBusy(true);
    setErr("");
    const r = await fetch("/api/reviews", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, k, rating, quote, name, role }) });
    const o = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setErr(o.error ?? "Something went wrong. Please try again.");
    setDone(true);
  }

  if (done) {
    return (
      <div className="mt-6 rounded-2xl border border-fg/10 bg-bg p-5">
        <p className="text-[15px] font-semibold">Thank you!</p>
        <p className="mt-1 text-[14px] text-fg/60">Your review was sent to {host}. It appears on their page if they choose to show it.</p>
      </div>
    );
  }

  const shown = hover || rating;
  return (
    <form onSubmit={send} className="mt-6 space-y-4">
      <div role="radiogroup" aria-label="Rating" className="flex gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? "s" : ""}`} onClick={() => setRating(n)} onMouseEnter={() => setHover(n)} className="grid h-11 w-11 place-items-center rounded-xl transition hover:bg-fg/5">
            <Star className={`h-7 w-7 transition ${n <= shown ? "fill-[#ff5b37] text-[#ff5b37]" : "text-fg/25"}`} />
          </button>
        ))}
      </div>
      <textarea required minLength={5} maxLength={400} rows={4} value={quote} onChange={(e) => setQuote(e.target.value)} placeholder="What did you get out of the session?" className={`${field} resize-none`} aria-label="Your review" />
      <div className="grid gap-3 sm:grid-cols-2">
        <input required maxLength={60} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className={field} aria-label="Your name" />
        <input maxLength={80} value={role} onChange={(e) => setRole(e.target.value)} placeholder="Role (optional), e.g. SDE at a startup" className={field} aria-label="Your role" />
      </div>
      <p className="text-[12px] text-fg/45">Your name, role and words may be shown on {host}&apos;s page. Your email is never shown.</p>
      {err && <p className="text-[13px] font-medium text-[#d93a2b]">{err}</p>}
      <button disabled={busy} className="min-h-[50px] w-full rounded-xl bg-fg text-[15px] font-semibold text-bg transition hover:opacity-90 disabled:opacity-50">{busy ? "Sending…" : "Send review"}</button>
    </form>
  );
}
