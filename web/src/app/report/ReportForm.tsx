"use client";

import { useState } from "react";

const REASONS = ["Scam or fraud", "Phishing or fake login", "Pretending to be someone else", "Harassment or hate", "Adult or illegal content", "Something else"];

export function ReportForm({ initial }: { initial: string }) {
  const [handle, setHandle] = useState(initial);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [sent, setSent] = useState(false);
  const field = "w-full rounded-xl border border-fg/15 bg-bg px-3.5 py-3 text-[14px] outline-none focus:border-fg/40";

  if (sent) return <p className="!mt-0 !text-fg">Thank you. We review every report and remove pages that break our rules.</p>;

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setErr("");
        const r = await fetch("/api/report", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ handle, reason, details, email }) });
        const d = await r.json().catch(() => ({}));
        setBusy(false);
        if (!r.ok) return setErr(d.error ?? "Something went wrong");
        setSent(true);
      }}
      className="space-y-4"
    >
      <label className="block text-[14px] font-medium">
        Page
        <div className="mt-1.5 flex items-center rounded-xl border border-fg/15 bg-bg focus-within:border-fg/40">
          <span className="pl-3.5 text-[14px] text-fg/45">showz.me/</span>
          <input required value={handle} onChange={(e) => setHandle(e.target.value)} className="w-full bg-transparent px-1 py-3 text-[14px] outline-none" placeholder="handle" />
        </div>
      </label>
      <fieldset>
        <legend className="text-[14px] font-medium">What is wrong?</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {REASONS.map((r) => (
            <label key={r} className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 py-3 text-[14px] ${reason === r ? "border-fg bg-fg/[0.04]" : "border-fg/15"}`}>
              <input type="radio" name="reason" required checked={reason === r} onChange={() => setReason(r)} className="accent-current" />
              {r}
            </label>
          ))}
        </div>
      </fieldset>
      <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={3} maxLength={1000} placeholder="Anything that helps us check (optional)" className={field} />
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email, if you want a reply (optional)" className={field} />
      {err && <p className="!text-[13px] !text-red-500">{err}</p>}
      <button disabled={busy} className="rounded-full bg-fg px-6 py-3 text-[14px] font-semibold text-bg disabled:opacity-50">{busy ? "Sending…" : "Send report"}</button>
    </form>
  );
}
