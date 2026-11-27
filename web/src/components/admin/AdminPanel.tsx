"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Logo } from "../landing/Nav";

interface User {
  id: string;
  email: string;
  plan: string;
  plan_renews_at: number | null;
  created_at: number;
  email_verified: boolean;
  handle: string | null;
  suspended: boolean;
  views: number;
  verified_label: string | null;
  referred_by: string | null;
}
interface Overview {
  totals: { users: number; pro: number; new7: number; pages: number; suspended: number; subs: number; bookings: number };
  users: User[];
  payments: { provider: string; amount: number; currency: string; status: string; created_at: number }[];
  reports: { id: string; handle: string; reason: string; details: string | null; reporter_email: string | null; created_at: number; user_id: string | null; suspended: boolean }[];
  setup: { label: string; state: "ok" | "warn" | "off"; note: string }[];
}

const card = "rounded-2xl border border-fg/10 bg-fg/[0.03] p-5";
const btn = "min-h-[38px] rounded-lg border border-fg/20 px-3 py-1.5 text-[12px] hover:border-fg/50 disabled:opacity-40";

export function AdminPanel() {
  const [data, setData] = useState<Overview | null>(null);
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (query: string) => {
    const r = await fetch(`/api/admin/overview?q=${encodeURIComponent(query)}`);
    if (r.ok) setData(await r.json());
  }, []);
  useEffect(() => {
    load("");
  }, [load]);

  async function act(body: Record<string, unknown>, confirmText?: string) {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(true);
    setMsg("");
    const r = await fetch("/api/admin/action", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const o = await r.json().catch(() => ({}));
    setBusy(false);
    setMsg(r.ok ? ("checked" in o ? `Link check done: ${o.checked} links checked.` : "Done.") : (o.error ?? "Failed"));
    load(q);
  }

  const t = data?.totals;
  const stats: [string, number | undefined][] = [["Users", t?.users], ["Pro", t?.pro], ["New (7 days)", t?.new7], ["Pages", t?.pages], ["Suspended", t?.suspended], ["Emails collected", t?.subs], ["Bookings", t?.bookings]];

  return (
    <main className="min-h-screen bg-bg text-fg">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 sm:px-6">
        <Logo />
        <Link href="/dashboard" className="text-[13px] text-fg/55 hover:text-fg">My dashboard</Link>
      </header>
      <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <h1 className="font-display text-[40px] italic leading-none sm:text-[56px]">Admin</h1>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {stats.map(([l, v]) => (
            <div key={l} className={card}>
              <p className="text-[10px] uppercase tracking-[0.18em] text-fg/45">{l}</p>
              <p className="mt-1 font-display text-[34px] leading-none">{v ?? "–"}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-10 font-display text-[28px] italic">Page reports {data?.reports.length ? <span className="ml-1 rounded-full bg-[#ff5b37] px-2.5 py-0.5 align-middle font-sans text-[13px] font-bold not-italic text-[#111]">{data.reports.length}</span> : null}</h2>
        <div className={`${card} mt-3`}>
          {data?.reports.length ? (
            <ul className="divide-y divide-fg/10">
              {data.reports.map((r) => (
                <li key={r.id} className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 text-[13px]">
                    <p className="font-semibold">
                      <Link href={`/${r.handle}`} target="_blank" className="underline">/{r.handle}</Link> · {r.reason}
                      {r.suspended && <span className="ml-2 rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold text-red-400">TAKEN DOWN</span>}
                    </p>
                    {r.details && <p className="mt-1 whitespace-pre-wrap text-fg/65 [overflow-wrap:anywhere]">{r.details}</p>}
                    <p className="mt-1 text-[11px] text-fg/45">{new Date(r.created_at).toLocaleString()}{r.reporter_email ? ` · from ${r.reporter_email}` : ""}</p>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    {r.user_id && !r.suspended && <button disabled={busy} className={`${btn} !border-red-500/40 text-red-400`} onClick={() => act({ action: "suspend", userId: r.user_id }, `Take down /${r.handle}? Visitors will see a 404.`)}>Take down</button>}
                    <button disabled={busy} className={btn} onClick={() => act({ action: "resolve_report", reportId: r.id })}>Mark done</button>
                  </div>
                </li>
              ))}
            </ul>
          ) : <p className="text-[14px] text-fg/50">No open reports.</p>}
        </div>

        <h2 className="mt-10 font-display text-[28px] italic">Setup status</h2>
        <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {data?.setup.map((s) => (
            <div key={s.label} className={`${card} !p-4`}>
              <p className="flex items-center gap-2 text-[13px] font-semibold">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${s.state === "ok" ? "bg-emerald-500" : s.state === "warn" ? "bg-amber-500" : "bg-red-500"}`} />
                {s.label}
              </p>
              <p className="mt-1 text-[12px] leading-snug text-fg/55 [overflow-wrap:anywhere]">{s.note}</p>
            </div>
          ))}
        </div>

        <div className={`${card} mt-10 flex flex-wrap items-center justify-between gap-3`}>
          <div>
            <p className="text-[14px] font-semibold">Broken-link check</p>
            <p className="text-[12px] text-fg/50">Checks every live link on Pro pages now. Email alerts go out for links that just broke.</p>
          </div>
          <button disabled={busy} onClick={() => act({ action: "linkcheck" })} className="rounded-xl bg-fg px-5 py-2.5 text-[13px] font-semibold text-bg disabled:opacity-50">
            {busy ? "Working…" : "Run link check now"}
          </button>
        </div>
        {msg && <p className="mt-3 text-[14px]">{msg}</p>}

        <form onSubmit={(e) => { e.preventDefault(); load(q); }} className="mt-8 flex gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by email or handle" className="min-w-0 flex-1 rounded-xl border border-fg/15 bg-bg/60 px-4 py-2.5 text-[14px] outline-none focus:border-fg/40" />
          <button className="rounded-xl bg-fg px-5 text-[13px] font-semibold text-bg">Search</button>
        </form>

        <div className="mt-4 overflow-x-auto rounded-2xl border border-fg/10">
          <table className="w-full min-w-[820px] text-left text-[13px]">
            <thead className="border-b border-fg/10 text-fg/50">
              <tr>
                {["User", "Page", "Plan", "Views", "Joined", "Actions"].map((h) => <th key={h} className="p-3 font-normal">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {data?.users.map((u) => (
                <tr key={u.id + (u.handle ?? '')} className="border-b border-fg/5 align-top last:border-0">
                  <td className="p-3">
                    <p className="font-medium">{u.email}</p>
                    <p className="text-[11px] text-fg/45">{u.email_verified ? "verified" : "not verified"}{u.verified_label ? ` · badge: ${u.verified_label}` : ""}{u.referred_by ? ` · invited by @${u.referred_by}` : ""}</p>
                  </td>
                  <td className="p-3">
                    {u.handle ? <Link href={`/${u.handle}`} target="_blank" className="underline">/{u.handle}</Link> : "–"}
                    {u.suspended && <span className="ml-2 rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold text-red-400">TAKEN DOWN</span>}
                  </td>
                  <td className="p-3">
                    {u.plan === "pro" ? "Pro" : "Free"}
                    {u.plan === "pro" && u.plan_renews_at && <p className="text-[11px] text-fg/45">until {new Date(u.plan_renews_at).toLocaleDateString()}</p>}
                  </td>
                  <td className="p-3">{u.views}</td>
                  <td className="p-3 text-fg/55">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1.5">
                      <button disabled={busy} className={btn} onClick={() => act({ action: "grant_pro", userId: u.id, days: 30 })}>+30d Pro</button>
                      {u.plan === "pro" && <button disabled={busy} className={btn} onClick={() => act({ action: "revoke_pro", userId: u.id }, `Remove Pro from ${u.email}?`)}>Remove Pro</button>}
                      {u.suspended ? (
                        <button disabled={busy} className={btn} onClick={() => act({ action: "unsuspend", userId: u.id })}>Restore page</button>
                      ) : (
                        <button disabled={busy || !u.handle} className={btn} onClick={() => act({ action: "suspend", userId: u.id }, `Take down /${u.handle}? Visitors will see a 404.`)}>Take down</button>
                      )}
                      <button disabled={busy} className={`${btn} !border-red-500/40 text-red-400`} onClick={() => act({ action: "delete", userId: u.id }, `Delete ${u.email} and everything of theirs forever?`)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {data && !data.users.length && <tr><td className="p-4 text-fg/50" colSpan={6}>No users found.</td></tr>}
            </tbody>
          </table>
        </div>

        <h2 className="mt-10 font-display text-[28px] italic">Recent payments</h2>
        <div className={`${card} mt-3`}>
          {data?.payments.length ? (
            <ul className="divide-y divide-fg/10 text-[14px]">
              {data.payments.map((p, i) => (
                <li key={i} className="flex justify-between py-2">
                  <span>{p.provider} · {p.currency === "INR" ? "₹" : "$"}{p.amount}</span>
                  <span className="text-fg/50">{p.status} · {new Date(p.created_at).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          ) : <p className="text-[14px] text-fg/50">No payments yet.</p>}
        </div>
      </div>
    </main>
  );
}
