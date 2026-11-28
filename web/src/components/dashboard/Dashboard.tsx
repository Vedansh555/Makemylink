"use client";

import { FREE_LIMITS } from "@/lib/plans";

import Link from "next/link";
import Script from "next/script";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { detectRegion, formatPrice, plans, type Billing, type Region } from "@/lib/pricing";
import { Logo } from "../landing/Nav";

type PageInfo = { id: string; handle: string; name: string; views: number; subs: number; primary: boolean };
type Tab = "pages" | "overview" | "leads" | "bookings" | "links" | "domain" | "billing" | "account";
interface Data {
  plan: "free" | "pro";
  pageId: string;
  bookingPage?: boolean;
  /** Free plan only: paid bookings still allowed this month. */
  bookingsLeft?: number | null;
  hasProducts?: boolean;
  hasChat?: boolean;
  handle: string;
  days: number;
  daily: { day: string; kind: string; n: number }[];
  perLink: { target: string; title: string; n: number }[];
  countries: { country: string; n: number }[];
  subscribers: { total: number; recent: { email: string; name?: string | null; source?: string | null; created_at: number }[]; limit: number | null };
  bookings: { id: string; title: string; buyer_name: string; buyer_email: string; slot_start: number; note: string; amount: number; currency: string; status: string; provider?: string | null }[];
  health: { link_id: string; url: string; status: number | null; ok: boolean; checked_at: number }[];
  checklist: { key: string; label: string; done: boolean; href?: string }[];
}
declare global {
  interface Window {
    Razorpay?: new (o: Record<string, unknown>) => { open(): void };
  }
}

const card = "rounded-3xl border border-fg/10 bg-gradient-to-br from-fg/[0.05] to-fg/[0.015] p-5 shadow-[0_24px_50px_-30px_rgba(0,0,0,0.35),0_1px_0_rgba(255,255,255,0.4)_inset]";

export function Dashboard() {
  const router = useRouter();
  const params = useSearchParams();
  const [tab, setTab] = useState<Tab>((params.get("tab") as Tab) || "pages");
  const [data, setData] = useState<Data | null>(null);
  const [pageId, setPageId] = useState<string>(params.get("page") ?? "");
  const [pages, setPages] = useState<{ pages: PageInfo[]; limit: number; plan: "free" | "pro" } | null>(null);
  const [email, setEmail] = useState("");
  const [verified, setVerified] = useState(true);
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const load = useCallback(async () => {
    const me = await fetch("/api/auth/me");
    if (!me.ok) return router.replace("/login");
    const u = (await me.json()).user;
    setEmail(u.email);
    setVerified(u.emailVerified !== false);
    setIsAdmin(!!u.isAdmin);
    const [r, pr] = await Promise.all([fetch(`/api/dashboard${pageId ? `?page=${encodeURIComponent(pageId)}` : ""}`), fetch("/api/pages")]);
    if (pr.ok) setPages(await pr.json());
    if (r.ok) setData(await r.json());
    else setError("Could not load your dashboard.");
  }, [router, pageId]);
  useEffect(() => {
    load();
  }, [load]);

  const tabs: [Tab, string][] = [["pages", "My pages"], ["overview", "Overview"], ["leads", "Emails"], ["bookings", "Bookings"], ["links", "Link health"], ["domain", "Domain"], ["billing", "Plan"], ["account", "Account"]];

  return (
    <main className="min-h-screen bg-bg text-fg">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-6 sm:px-6">
        <Logo />
        <div className="flex items-center gap-3 text-[13px]">
          {isAdmin && <Link href="/admin" className="rounded-lg bg-fg px-3.5 py-2 font-semibold text-bg">Admin</Link>}
          <Link href={data ? `/create?page=${data.pageId}` : "/create"} className="rounded-lg border border-fg/15 px-3.5 py-2 hover:border-fg/40">Edit page</Link>
          {data && <Link href={`/${data.handle}`} className="hidden text-fg/55 hover:text-fg sm:block">/{data.handle}</Link>}
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-4 pb-24 sm:px-6">
        <h1 className="font-display text-[40px] italic leading-none sm:text-[56px]">Dashboard</h1>
        <p className="mt-2 text-[13px] text-fg/45 [overflow-wrap:anywhere]">{email}</p>
        <nav className="no-scrollbar mt-6 flex gap-1 overflow-x-auto rounded-full border border-fg/10 bg-fg/5 p-1">
          {tabs.map(([id, label]) => (
            <button key={id} ref={tab === id ? (el) => { const row = el?.parentElement; if (el && row) row.scrollLeft = el.offsetLeft - row.offsetLeft - (row.clientWidth - el.offsetWidth) / 2; } : undefined} onClick={() => setTab(id)} className={`shrink-0 rounded-full px-4 py-2 text-[13px] ${tab === id ? "bg-fg text-bg" : "text-fg/60 hover:text-fg"}`}>
              {label}
            </button>
          ))}
        </nav>
        {pages && pages.pages.length > 1 && tab !== "pages" && tab !== "billing" && tab !== "account" && (
          <label className="mt-4 flex items-center gap-2 text-[13px] text-fg/60">
            Showing
            <select value={data?.pageId ?? ""} onChange={(e) => { setData(null); setPageId(e.target.value); }} className="rounded-lg border border-fg/15 bg-bg px-3 py-1.5 text-fg">
              {pages.pages.map((pg) => <option key={pg.id} value={pg.id}>@{pg.handle}</option>)}
            </select>
          </label>
        )}
        <ReturnNotice />
        {!verified && <VerifyBanner />}
        {error && <p className="mt-6 text-[14px] text-red-400">{error}</p>}
        {!data && !error && <p className="mt-8 text-fg/50">Loading…</p>}
        {data && (
          <div className="mt-6">
            {tab === "pages" && <PagesTab info={pages} current={data.pageId} choose={(id, t) => { setData(null); setPageId(id); setTab(t); }} reload={load} goBilling={() => setTab("billing")} />}
            {tab === "overview" && <Overview d={data} goBilling={() => setTab("billing")} />}
            {tab === "leads" && <Leads d={data} />}
            {tab === "bookings" && <Bookings d={data} reload={load} />}
            {tab === "links" && <Health d={data} />}
            {tab === "domain" && <DomainTab d={data} />}
            {tab === "account" && <AccountTab email={email} />}
            {tab === "billing" && <Billing d={data} email={email} reload={load} />}
          </div>
        )}
      </div>
    </main>
  );
}

/** Says what happened after the person comes back from an email link or a payment page. */
function ReturnNotice() {
  const params = useSearchParams();
  const [closed, setClosed] = useState(false);
  const note: [boolean, string] | null =
    params.get("verified") === "1" ? [true, "Your email is confirmed. Thank you."]
    : params.get("verify") === "expired" ? [false, "That confirmation link has expired or was already used. Use Resend link to get a new one."]
    : params.get("badge") === "1" ? [true, "Your Verified badge is on. Your page now shows the tick."]
    : params.get("badge") === "expired" ? [false, "That badge link has expired or was already used. Send a new one below."]
    : params.get("paid") === "failed" ? [false, "The payment didn't go through, so your plan hasn't changed. If money left your account, email us with the reference."]
    : null;
  if (!note || closed) return null;
  return (
    <div role="status" className={`mt-6 flex items-start gap-3 rounded-2xl border p-4 text-[14px] ${note[0] ? "border-emerald-500/30 bg-emerald-500/[0.07]" : "border-[#ff5b37]/40 bg-[#ff5b37]/[0.07]"}`}>
      <span className="min-w-0 flex-1">{note[1]}</span>
      <button onClick={() => setClosed(true)} className="shrink-0 text-[13px] font-semibold underline underline-offset-4">Close</button>
    </div>
  );
}

function PagesTab({ info, current, choose, reload, goBilling }: { info: { pages: PageInfo[]; limit: number; plan: "free" | "pro" } | null; current: string; choose: (id: string, tab: Tab) => void; reload: () => void; goBilling: () => void }) {
  const [handle, setHandle] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  if (!info) return <p className="text-fg/50">Loading…</p>;
  const full = info.pages.length >= info.limit;
  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/pages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ handle }) });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setMsg(d.error ?? "Something went wrong");
    window.location.href = `/create?page=${d.id}`;
  }
  async function remove(pg: PageInfo) {
    if (!window.confirm(`Delete @${pg.handle}, its emails, bookings and stats? This cannot be undone.`)) return;
    const res = await fetch(`/api/pages?id=${pg.id}`, { method: "DELETE" });
    if (!res.ok) return setMsg((await res.json().catch(() => ({}))).error ?? "Could not delete");
    reload();
  }
  return (
    <div>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-[repeat(2,minmax(0,1fr))]">
        {info.pages.map((pg) => (
          <div key={pg.id} className={`${card} min-w-0 ${pg.id === current ? "border-[#ff5b37]/50" : ""}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[17px] font-semibold">{pg.name}</p>
                <Link href={`/${pg.handle}`} className="block truncate text-[13px] text-fg/50 hover:text-fg">showz.me/{pg.handle}</Link>
              </div>
              {pg.primary && <span className="shrink-0 rounded-full bg-fg/10 px-2.5 py-1 text-[10px] uppercase tracking-wider text-fg/60">Main</span>}
            </div>
            <p className="mt-3 text-[13px] text-fg/55">{pg.views} views (30 days) · {pg.subs} emails</p>
            <div className="mt-4 flex flex-wrap gap-2 text-[13px]">
              <Link href={`/create?page=${pg.id}`} className="rounded-lg bg-fg px-3.5 py-2 font-semibold text-bg">Edit</Link>
              <button onClick={() => choose(pg.id, "overview")} className="rounded-lg border border-fg/15 px-3.5 py-2 hover:border-fg/40">Stats</button>
              <button onClick={() => choose(pg.id, "leads")} className="rounded-lg border border-fg/15 px-3.5 py-2 hover:border-fg/40">Emails</button>
              {!pg.primary && <button onClick={() => remove(pg)} className="rounded-lg px-3 py-2 text-fg/45 hover:text-red-400">Delete</button>}
            </div>
          </div>
        ))}
      </div>
      <div className={`${card} mt-4`}>
        <p className="text-[15px] font-semibold">Add another page</p>
        <p className="mt-1 text-[13px] text-fg/55">{info.pages.length} of {info.limit} pages used. {info.plan === "free" ? "Free accounts get 1 page. Pro gives you up to 5, for example one per business, client or campaign." : "Each page has its own link, theme, emails and bookings."}</p>
        {full && info.plan === "free" ? (
          <button onClick={goBilling} className="mt-4 rounded-xl bg-[#ff5b37] px-5 py-2.5 text-[14px] font-semibold text-[#111]">Go Pro for more pages</button>
        ) : full ? (
          <p className="mt-3 text-[13px] text-fg/50">You have used all {info.limit} pages.</p>
        ) : (
          <form onSubmit={add} className="mt-4 flex flex-col gap-2 sm:flex-row">
            <div className="flex flex-1 items-center rounded-xl border border-fg/15 bg-bg px-3.5 text-[14px]">
              <span className="text-fg/40">showz.me/</span>
              <input value={handle} onChange={(e) => setHandle(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ""))} placeholder="newpage" maxLength={30} required className="min-w-0 flex-1 bg-transparent py-2.5 pl-1 outline-none" />
            </div>
            <button disabled={busy || handle.length < 2} className="rounded-xl bg-fg px-5 py-2.5 text-[14px] font-semibold text-bg disabled:opacity-40">{busy ? "Creating…" : "Create page"}</button>
          </form>
        )}
        {msg && <p className="mt-3 text-[13px] text-red-400">{msg}</p>}
      </div>
    </div>
  );
}

function Locked({ children, goBilling }: { children: React.ReactNode; goBilling?: () => void }) {
  return (
    <div className="rounded-xl border border-dashed border-fg/20 p-4 text-[13px] text-fg/55">
      {children}{" "}
      {goBilling && (
        <button onClick={goBilling} className="font-semibold text-[#ff5b37] underline">
          Get Pro
        </button>
      )}
    </div>
  );
}

function Overview({ d, goBilling }: { d: Data; goBilling: () => void }) {
  const views = d.daily.filter((x) => x.kind === "view").reduce((a, b) => a + b.n, 0);
  const clicks = d.daily.filter((x) => x.kind === "click").reduce((a, b) => a + b.n, 0);
  const byDay = new Map<string, { v: number; c: number }>();
  for (let i = d.days - 1; i >= 0; i--) byDay.set(new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10), { v: 0, c: 0 });
  d.daily.forEach((x) => {
    const e = byDay.get(x.day);
    if (!e) return;
    if (x.kind === "view") e.v += x.n;
    else e.c += x.n;
  });
  const max = Math.max(1, ...[...byDay.values()].map((x) => x.v));
  const doneCount = d.checklist.filter((c) => c.done).length;
  return (
    <div className="space-y-4">
      {doneCount < d.checklist.length && (
        <div className={card}>
          <div className="flex items-center justify-between gap-3">
            <p className="text-[15px] font-semibold">Getting started</p>
            <p className="text-[12px] text-fg/50">{doneCount} of {d.checklist.length} done</p>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-fg/10">
            <div className="h-full rounded-full bg-[#ff5b37] transition-all" style={{ width: `${(doneCount / d.checklist.length) * 100}%` }} />
          </div>
          <ul className="mt-4 divide-y divide-fg/10">
            {d.checklist.map((c) => (
              <li key={c.key} className="flex items-center gap-3 py-2.5 text-[14px]">
                <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] ${c.done ? "bg-[#ff5b37] text-[#111]" : "border border-fg/25 text-transparent"}`}>✓</span>
                <span className={c.done ? "text-fg/50" : ""}>{c.label}</span>
                {!c.done && c.href && (
                  <Link href={c.href} className="ml-auto shrink-0 whitespace-nowrap py-1 pl-2 text-[12px] font-semibold text-[#c8431f] underline underline-offset-4">
                    Do it
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        {[[`Views (${d.days}d)`, views], [`Clicks (${d.days}d)`, clicks], ["Emails collected", d.subscribers.total]].map(([l, v]) => (
          <div key={l as string} className={card}>
            <p className="text-[11px] uppercase tracking-[0.2em] text-fg/45">{l}</p>
            <p className="mt-2 font-display text-[48px] leading-none">{v}</p>
          </div>
        ))}
      </div>
      <div className={card}>
        <p className="text-[11px] uppercase tracking-[0.2em] text-fg/45">Views per day</p>
        <div className="mt-4 flex h-32 items-end gap-1" role="img" aria-label="Views per day">
          {[...byDay.entries()].map(([day, x]) => (
            <div key={day} title={`${day}: ${x.v} views, ${x.c} clicks`} className="flex-1 rounded-t bg-[#ff5b37]" style={{ height: `${Math.max(3, (x.v / max) * 100)}%`, opacity: x.v ? 1 : 0.25 }} />
          ))}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className={card}>
          <p className="text-[11px] uppercase tracking-[0.2em] text-fg/45">Top links</p>
          {d.plan === "pro" ? (
            d.perLink.length ? (
              <ul className="mt-3 space-y-2 text-[14px]">{d.perLink.map((l) => <li key={l.target} className="flex justify-between gap-3"><span className="truncate">{l.title}</span><span className="text-fg/55">{l.n}</span></li>)}</ul>
            ) : <p className="mt-3 text-[14px] text-fg/50">No clicks yet.</p>
          ) : <div className="mt-3"><Locked goBilling={goBilling}>See which links get clicked.</Locked></div>}
        </div>
        <div className={card}>
          <p className="text-[11px] uppercase tracking-[0.2em] text-fg/45">Visitors by country</p>
          {d.plan === "pro" ? (
            d.countries.length ? (
              <ul className="mt-3 space-y-2 text-[14px]">{d.countries.map((c) => <li key={c.country} className="flex justify-between"><span>{c.country}</span><span className="text-fg/55">{c.n}</span></li>)}</ul>
            ) : <p className="mt-3 text-[14px] text-fg/50">No data yet.</p>
          ) : <div className="mt-3"><Locked goBilling={goBilling}>See where your visitors are.</Locked></div>}
        </div>
      </div>
      <AnnounceKit handle={d.handle} booking={!!d.bookingPage} products={!!d.hasProducts} chat={!!d.hasChat} />
    </div>
  );
}

function AnnounceKit({ handle, booking, products, chat }: { handle: string; booking: boolean; products: boolean; chat: boolean }) {
  const [channel, setChannel] = useState<"linkedin" | "instagram" | "whatsapp">("linkedin");
  const [copied, setCopied] = useState(false);
  const siteUrl = typeof window !== "undefined" ? window.location.origin : "";
  const pageUrl = `${siteUrl}/${handle}`;

  // The words follow what the page actually offers: bookings, products, a chat button, or just links.
  const offer = booking ? "You can now book a time with me directly" : products ? "Everything I make and recommend is now in one place" : chat ? "You can now message me directly" : "All my links are now in one place";
  const detail = booking ? "pick a slot that suits you and pay in a minute" : products ? "tap any item to get it" : chat ? "one tap opens a chat with me" : "my latest work, socials and more";
  const posts = {
    linkedin: `${offer}: ${detail}. ${pageUrl}`,
    instagram: `New link in my bio ✨ ${offer.toLowerCase()} — ${detail}. ${pageUrl}`,
    whatsapp: `Hi! ${offer}: ${detail}. ${pageUrl}`,
  };

  const copy = () => {
    navigator.clipboard?.writeText(posts[channel]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={card}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[15px] font-semibold">Announce your page</p>
          <p className="mt-1 text-[13px] text-fg/55">Ready-to-post announcements for your social channels. Tap to copy and get your first visits.</p>
        </div>
        <div className="flex rounded-full border border-fg/10 bg-fg/5 p-1 text-[12px]">
          {(["linkedin", "instagram", "whatsapp"] as const).map((ch) => (
            <button
              key={ch}
              type="button"
              onClick={() => { setChannel(ch); setCopied(false); }}
              className={`min-h-[36px] rounded-full px-3 py-1.5 capitalize transition ${channel === ch ? "bg-fg text-bg font-medium" : "text-fg/60 hover:text-fg"}`}
            >
              {ch === "linkedin" ? "LinkedIn / X" : ch === "instagram" ? "Instagram" : "WhatsApp"}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 rounded-xl border border-fg/10 bg-bg/80 p-3.5 text-[13px] text-fg/80 leading-relaxed font-mono">
        {posts[channel]}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={copy}
          className="rounded-xl bg-fg px-4 py-2 text-[13px] font-semibold text-bg transition hover:bg-[#ff5b37] hover:text-[#111]"
        >
          {copied ? "Copied ✓" : "Copy text"}
        </button>
        {channel === "whatsapp" && (
          <a
            href={`https://wa.me/?text=${encodeURIComponent(posts.whatsapp)}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-fg/20 px-4 py-2 text-[13px] text-fg/70 hover:text-fg"
          >
            Share on WhatsApp ↗
          </a>
        )}
        <a
          href={`/${handle}`}
          target="_blank"
          rel="noreferrer"
          className="rounded-xl border border-fg/20 px-4 py-2 text-[13px] text-fg/70 hover:text-fg"
        >
          Open page ↗
        </a>
      </div>
    </div>
  );
}

function Leads({ d }: { d: Data }) {
  return (
    <div className={card}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[15px]">
          <b>{d.subscribers.total}</b> {d.subscribers.limit ? `of ${d.subscribers.limit} ` : ""}emails
        </p>
        {d.plan === "pro" ? (
          <a href={`/api/subscribers/export?page=${d.pageId}`} download className="rounded-lg bg-fg px-4 py-2 text-[13px] font-semibold text-bg">Download CSV</a>
        ) : (
          <span className="text-[12px] text-fg/50">CSV export is on Pro</span>
        )}
      </div>
      <ul className="mt-4 divide-y divide-fg/10 text-[14px]">
        {d.subscribers.recent.map((s) => (
          <li key={s.email} className="flex justify-between gap-3 py-2"><span className="truncate">{s.name ? <>{s.name} <span className="text-fg/45">· {s.email}</span></> : s.email}</span><span className="shrink-0 text-fg/45">{s.source === "whatsapp" && <span className="mr-2 rounded-full bg-[#25d366]/15 px-2 py-0.5 text-[10px] font-semibold text-[#128c4a]">WhatsApp</span>}{new Date(s.created_at).toLocaleDateString()}</span></li>
        ))}
        {!d.subscribers.recent.length && <li className="py-2 text-fg/50">Nobody has joined yet. Turn on “Collect emails” in the editor.</li>}
      </ul>
    </div>
  );
}

function Bookings({ d, reload }: { d: Data; reload: () => void }) {
  async function setStatus(id: string, status: "confirmed" | "cancelled") {
    await fetch("/api/bookings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    reload();
  }
  const bookUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/${d.handle}/book`;
  return (
    <div className="space-y-4">
    {d.plan !== "pro" && (
      <div className={`${card} text-[14px] text-fg/70`}>
        Free includes {FREE_LIMITS.bookings} paid bookings a month. <b className="text-fg">{d.bookingsLeft ?? FREE_LIMITS.bookings} left</b> this month. Pro has no limit.
      </div>
    )}
    <GatewayCard />
    {d.bookingPage ? (
      <div className={card}>
        <p className="text-[15px] font-semibold">Your booking page</p>
        <p className="mt-1 text-[13px] text-fg/55">Share this link on its own, in a YouTube description, a WhatsApp status or an email. People see your calendar, the times left and book straight away, without opening your whole profile.</p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input readOnly value={bookUrl} onFocus={(e) => e.currentTarget.select()} className="min-w-0 flex-1 rounded-xl border border-fg/15 bg-bg px-3.5 py-2.5 text-[13px]" />
          <button onClick={() => navigator.clipboard?.writeText(bookUrl)} className="rounded-xl bg-fg px-4 py-2.5 text-[13px] font-semibold text-bg">Copy link</button>
          <a href={`/${d.handle}/book`} target="_blank" rel="noreferrer" className="rounded-xl border border-fg/15 px-4 py-2.5 text-center text-[13px]">Open</a>
        </div>
      </div>
    ) : null}
    <div className={card}>
      {!d.bookings.length && <p className="text-[14px] text-fg/50">No bookings yet. Add a booking card in the editor.</p>}
      <ul className="divide-y divide-fg/10">
        {d.bookings.map((b) => (
          <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-[14px]">
            <div>
              <p className="font-semibold">{b.title} · {b.buyer_name}</p>
              <p className="text-fg/55">{new Date(b.slot_start).toLocaleString()} · {b.buyer_email}</p>
              {b.note && <p className="text-fg/45">“{b.note}”</p>}
              {b.amount > 0 && b.status !== "cancelled" && (
                <p className="text-[12px] text-fg/45">
                  {b.provider === "razorpay" || b.provider === "paypal"
                    ? `${b.status === "confirmed" ? "Paid online with" : "Waiting for payment on"} ${b.provider === "razorpay" ? "Razorpay" : "PayPal"}`
                    : b.provider === "paypal_pending"
                      ? b.status === "confirmed" ? "Paid with PayPal" : "PayPal is reviewing this payment: check PayPal, then Mark paid"
                      : b.status === "confirmed" ? "Marked paid by you" : "Payment link: check the money arrived, then Mark paid"}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] uppercase tracking-wider text-fg/50">{b.amount ? `${b.currency === "INR" ? "₹" : "$"}${b.amount}` : "Free"} · {b.status.replace("_", " ")}</span>
              {b.status === "awaiting_payment" && <button onClick={() => setStatus(b.id, "confirmed")} className="min-h-[38px] rounded-lg bg-fg px-3.5 py-1.5 text-[12px] font-semibold text-bg">Mark paid</button>}
              {b.status !== "cancelled" && <button onClick={() => setStatus(b.id, "cancelled")} className="min-h-[38px] rounded-lg border border-fg/20 px-3.5 py-1.5 text-[12px]">Cancel</button>}
            </div>
          </li>
        ))}
      </ul>
    </div>
    </div>
  );
}

/** Lets a creator connect their own Razorpay (rupees) and PayPal (dollars) so paid bookings confirm by themselves. The money goes straight to them. */
type GwStatus = { connected: boolean; keyId: string | null; mode: "test" | "live" };
function GatewayCard() {
  const [info, setInfo] = useState<{ razorpay: GwStatus; paypal: GwStatus; hook?: { connected: boolean; url?: string; secret?: string } } | null>(null);
  const load = useCallback(async () => {
    const r = await fetch("/api/gateway");
    if (r.ok) setInfo(await r.json());
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className={card}>
      <p className="text-[15px] font-semibold">Get paid automatically</p>
      <p className="mt-1 text-[13px] text-fg/55">Connect your own account so bookings are paid on the page and confirm by themselves, with no clicking &ldquo;Mark paid&rdquo;. The money goes straight to your account, never through Showz. Until you connect, buyers pay through the payment link on your booking card, and you press &ldquo;Mark paid&rdquo;.</p>
      <div className="mt-4 divide-y divide-fg/10">
        <GatewayRow
          title="Razorpay"
          sub="For bookings priced in rupees (₹). Buyers can pay by UPI, card or netbanking."
          status={info?.razorpay}
          reload={load}
          provider="razorpay"
          steps={["Open your Razorpay dashboard, then Account & Settings, then API Keys.", "Click Generate Key. Copy the Key ID and the Key Secret (Razorpay shows the secret only once).", "Paste both below. Keys starting rzp_test_ are safe for trying it out."]}
          fields={[{ name: "keyId", label: "Key ID (rzp_live_… or rzp_test_…)" }, { name: "keySecret", label: "Key Secret", secret: true }]}
        />
        <GatewayRow
          title="PayPal"
          sub="For bookings priced in dollars ($)."
          status={info?.paypal}
          reload={load}
          provider="paypal"
          steps={["Go to developer.paypal.com and log in with your PayPal Business account.", "Open Apps & Credentials, then Create App. Pick Live (or Sandbox to practise).", "Copy the Client ID and the Secret and paste them below."]}
          fields={[{ name: "clientId", label: "Client ID" }, { name: "clientSecret", label: "Secret", secret: true }]}
          sandboxOption
        />
        <HookRow hook={info?.hook} reload={load} />
      </div>
    </div>
  );
}

function HookRow({ hook, reload }: { hook?: { connected: boolean; url?: string; secret?: string }; reload: () => void }) {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState("");
  async function turnOn() {
    setBusy(true);
    await fetch("/api/gateway", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider: "hook" }) });
    setBusy(false);
    reload();
  }
  async function turnOff() {
    if (!confirm("Turn off automatic confirmation for your payment link? You will press Mark paid again. Also delete the webhook in Razorpay.")) return;
    await fetch("/api/gateway?provider=hook", { method: "DELETE" });
    reload();
  }
  const copy = (label: string, v?: string) => {
    if (!v) return;
    navigator.clipboard?.writeText(v).then(() => setCopied(label)).catch(() => {});
  };
  const box = "flex min-h-[44px] items-center gap-2 rounded-xl border border-fg/15 bg-bg px-3.5 py-2";
  return (
    <div className="py-4 last:pb-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[14px] font-semibold">
            Payment link{hook?.connected && <span className="ml-2 text-[12px] font-semibold text-emerald-500">Confirms automatically</span>}
          </p>
          <p className="text-[13px] text-fg/55">Add your razorpay.me link to a booking card. Turn on automatic confirmation so you never press Mark paid: no API keys or website needed.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/create?focus=booking" className="rounded-xl border border-fg/20 px-4 py-2 text-[13px]">Add link</Link>
          {hook?.connected ? (
            <button onClick={turnOff} className="rounded-xl border border-fg/20 px-4 py-2 text-[13px]">Turn off</button>
          ) : (
            <button onClick={turnOn} disabled={busy} className="rounded-xl bg-fg px-4 py-2.5 text-[13px] font-semibold text-bg disabled:opacity-50">{busy ? "Setting up…" : "Turn on"}</button>
          )}
        </div>
      </div>
      {hook?.connected && (
        <div className="mt-4 space-y-3">
          <ol className="list-decimal space-y-1 pl-5 text-[13px] text-fg/65">
            <li>In your Razorpay dashboard (Live mode), open Account &amp; Settings, then Webhooks, then Add New Webhook.</li>
            <li>Paste the address and the secret below.</li>
            <li>Tick the events <b>payment.captured</b> and <b>payment_link.paid</b>, then save.</li>
          </ol>
          {[["Webhook address", hook.url], ["Secret", hook.secret]].map(([label, v]) => (
            <div key={label}>
              <p className="mb-1 text-[12px] text-fg/50">{label}</p>
              <div className={box}>
                <span className="min-w-0 flex-1 break-all font-mono text-[12px]">{v}</span>
                <button type="button" onClick={() => copy(label!, v)} className="shrink-0 rounded-lg border border-fg/20 px-3 py-1.5 text-[12px]">{copied === label ? "Copied" : "Copy"}</button>
              </div>
            </div>
          ))}
          <p className="text-[12px] text-fg/45">Each buyer is asked to pay their own exact amount (for example ₹499.37), which tells us whose payment it is. Works best with a razorpay.me link, where the buyer types the amount. If a payment can&apos;t be matched, the booking waits for you to press Mark paid.</p>
        </div>
      )}
    </div>
  );
}

function GatewayRow({ title, sub, status, reload, provider, steps, fields, sandboxOption }: { title: string; sub: string; status?: GwStatus; reload: () => void; provider: "razorpay" | "paypal"; steps: string[]; fields: { name: string; label: string; secret?: boolean }[]; sandboxOption?: boolean }) {
  const [open, setOpen] = useState(false);
  const [vals, setVals] = useState<Record<string, string>>({});
  const [sandbox, setSandbox] = useState(false);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const field = "min-w-0 rounded-xl border border-fg/15 bg-bg px-3.5 py-2.5 text-[13px]";

  async function connect(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const r = await fetch("/api/gateway", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider, ...vals, sandbox }) });
    const o = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setMsg(o.error ?? "Something went wrong");
    setVals({});
    setOpen(false);
    reload();
  }
  async function disconnect() {
    if (!confirm(`Disconnect ${title}? New bookings go back to manual payment (your payment link).`)) return;
    await fetch(`/api/gateway?provider=${provider}`, { method: "DELETE" });
    reload();
  }

  return (
    <div className="py-4 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[14px] font-semibold">
            {title}
            {status?.connected && <span className={`ml-2 text-[12px] font-semibold ${status.mode === "live" ? "text-emerald-500" : "text-amber-500"}`}>{status.mode === "live" ? "Connected" : "Connected (test mode, no real money)"}</span>}
          </p>
          <p className="text-[13px] text-fg/55">{sub}</p>
        </div>
        {status?.connected ? (
          <button onClick={disconnect} className="rounded-xl border border-fg/20 px-4 py-2 text-[13px]">Disconnect</button>
        ) : !open ? (
          <button onClick={() => setOpen(true)} className="rounded-xl bg-fg px-4 py-2.5 text-[13px] font-semibold text-bg">Connect {title}</button>
        ) : null}
      </div>
      {status?.connected && <p className="mt-2 break-all font-mono text-[12px] text-fg/55">{status.keyId}</p>}
      {open && !status?.connected && (
        <form onSubmit={connect} className="mt-4 space-y-3">
          <ol className="list-decimal space-y-1 pl-5 text-[13px] text-fg/65">
            {steps.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ol>
          <div className="flex flex-col gap-2 sm:flex-row">
            {fields.map((f) => (
              <input key={f.name} required type={f.secret ? "password" : "text"} value={vals[f.name] ?? ""} onChange={(e) => setVals((v) => ({ ...v, [f.name]: e.target.value }))} placeholder={f.label} autoComplete={f.secret ? "new-password" : "off"} spellCheck={false} className={`${field} flex-1`} />
            ))}
          </div>
          {sandboxOption && (
            <label className="flex items-center gap-2 text-[13px] text-fg/65">
              <input type="checkbox" checked={sandbox} onChange={(e) => setSandbox(e.target.checked)} className="h-4 w-4" />
              These are Sandbox (test) keys
            </label>
          )}
          <p className="text-[12px] text-fg/45">We check the keys with {title}, then store the secret locked, and never show it again. You can disconnect at any time, and you can delete the key at {title} too.</p>
          {msg && <p className="text-[13px] text-red-500">{msg}</p>}
          <div className="flex gap-2">
            <button disabled={busy} className="rounded-xl bg-fg px-4 py-2.5 text-[13px] font-semibold text-bg disabled:opacity-50">{busy ? "Checking…" : "Connect"}</button>
            <button type="button" onClick={() => setOpen(false)} className="rounded-xl border border-fg/20 px-4 py-2.5 text-[13px]">Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}

/** "Verified by Showz": the owner proves a work or college email once, and their page shows a tick. */
function BadgeCard() {
  const [label, setLabel] = useState<string | null | undefined>(undefined);
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => setLabel(d.user?.verifiedLabel ?? null)).catch(() => setLabel(null));
  }, []);
  async function send(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const r = await fetch("/api/verify-work", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    const o = await r.json().catch(() => ({}));
    setBusy(false);
    setMsg(r.ok ? `We sent a link to ${email}. Open it to switch on your badge.` : (o.error ?? "Something went wrong"));
  }
  async function remove() {
    await fetch("/api/verify-work", { method: "DELETE" });
    setLabel(null);
  }
  if (label === undefined) return null;
  return (
    <div className={card}>
      <p className="text-[15px] font-semibold">Verified badge</p>
      {label ? (
        <>
          <p className="mt-1 text-[13px] text-fg/55">Your page shows a tick and &ldquo;Verified by Showz · {label}&rdquo;. Visitors know you are real.</p>
          <button onClick={remove} className="mt-3 rounded-xl border border-fg/20 px-4 py-2 text-[13px]">Remove badge</button>
        </>
      ) : (
        <form onSubmit={send}>
          <p className="mt-1 text-[13px] text-fg/55">Confirm a work or college email once (like you@company.com or you@iitr.ac.in) and your page gets a tick. Only the part after @ is shown. It helps people trust you before they pay.</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" className="min-w-0 flex-1 rounded-xl border border-fg/15 bg-bg px-3.5 py-2.5 text-[13px]" />
            <button disabled={busy} className="rounded-xl bg-fg px-4 py-2.5 text-[13px] font-semibold text-bg disabled:opacity-50">{busy ? "Sending…" : "Send link"}</button>
          </div>
          {msg && <p className="mt-2 text-[13px] text-fg/70">{msg}</p>}
        </form>
      )}
    </div>
  );
}

/** Invite a creator: both get a free Pro month once the invited creator gets their first lead or booking. */
function InviteCard() {
  const [handle, setHandle] = useState("");
  const [invites, setInvites] = useState<{ joined: number; rewarded: number } | null>(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => { setHandle(d.user?.handle ?? ""); setInvites(d.user?.invites ?? null); }).catch(() => {});
  }, []);
  if (!handle) return null;
  const url = `${typeof window !== "undefined" ? window.location.origin : ""}/?ref=${handle}`;
  return (
    <div className={card}>
      <p className="text-[15px] font-semibold">Invite a creator, both get a free month</p>
      <p className="mt-1 text-[13px] text-fg/55">Share your invite link. When the creator you invite gets their first lead or booking, you both get a month of Pro free. The &ldquo;Made with Showz&rdquo; link on your page counts too.</p>
      {invites && (
        <p className="mt-2 text-[13px] font-semibold">
          {invites.joined} joined with your link · {invites.rewarded} free month{invites.rewarded === 1 ? "" : "s"} earned
        </p>
      )}
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input readOnly value={url} onFocus={(e) => e.currentTarget.select()} className="min-w-0 flex-1 rounded-xl border border-fg/15 bg-bg px-3.5 py-2.5 text-[13px]" />
        <button onClick={() => { navigator.clipboard?.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800); }} className="rounded-xl bg-fg px-4 py-2.5 text-[13px] font-semibold text-bg">{copied ? "Copied" : "Copy link"}</button>
        <a href={`https://wa.me/?text=${encodeURIComponent(`I made my page with Showz. Bookings with 0% commission and a free plan. Try it: ${url}`)}`} target="_blank" rel="noreferrer" className="rounded-xl border border-fg/20 px-4 py-2.5 text-center text-[13px]">Share on WhatsApp</a>
      </div>
    </div>
  );
}

function Health({ d }: { d: Data }) {
  if (d.plan !== "pro") return <Locked>Pro checks your links every day and emails you when one breaks.</Locked>;
  return (
    <div className={card}>
      {!d.health.length && <p className="text-[14px] text-fg/50">No checks yet. The first daily check will fill this in.</p>}
      <ul className="divide-y divide-fg/10 text-[14px]">
        {d.health.map((h) => (
          <li key={h.link_id} className="flex items-center justify-between gap-3 py-2">
            <span className="truncate">{h.url}</span>
            <span className={`shrink-0 text-[12px] font-semibold ${h.ok ? "text-emerald-500" : "text-red-400"}`}>{h.ok ? "OK" : `Broken (${h.status ?? "no response"})`}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Billing({ d, email, reload }: { d: Data; email: string; reload: () => void }) {
  const [region, setRegion] = useState<Region>("GLOBAL");
  const [period, setPeriod] = useState<Billing>("yearly");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const params = useSearchParams();
  useEffect(() => setRegion(detectRegion()), []);
  useEffect(() => {
    if (params.get("upgraded")) {
      setMsg("Thanks! Your payment is being confirmed. Pro switches on in a few seconds.");
      const t = setTimeout(reload, 4000);
      return () => clearTimeout(t);
    }
  }, [params, reload]);
  const pro = plans.find((p) => p.id === "pro")!;
  const price = pro.price[region][period];

  async function buy() {
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/billing/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ period, region }) });
    const o = await res.json().catch(() => ({}));
    if (!res.ok) {
      setBusy(false);
      return setMsg(o.error ?? "Something went wrong");
    }
    if (o.provider === "stripe" || o.provider === "paypal") {
      window.location.href = o.url;
      return;
    }
    if (!window.Razorpay) {
      setBusy(false);
      return setMsg("Payment window did not load. Refresh and try again.");
    }
    new window.Razorpay({
      key: o.keyId,
      order_id: o.orderId,
      amount: o.amount,
      currency: o.currency,
      name: "Showz Pro",
      description: period === "yearly" ? "1 year" : "1 month",
      prefill: { email },
      theme: { color: "#ff5b37" },
      modal: { ondismiss: () => setBusy(false) },
      handler: async (r: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
        const v = await fetch("/api/billing/razorpay/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: r.razorpay_order_id, paymentId: r.razorpay_payment_id, signature: r.razorpay_signature }),
        });
        setBusy(false);
        setMsg(v.ok ? "You're on Pro. Thank you!" : "We received your payment but could not confirm it yet. It will switch on shortly.");
        reload();
      },
    }).open();
  }

  return (
    <div className={card}>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <p className="text-[11px] uppercase tracking-[0.2em] text-fg/45">Your plan</p>
      <p className="mt-2 font-display text-[44px] italic leading-none">{d.plan === "pro" ? "Pro" : "Free"}</p>
      {d.plan === "pro" ? (
        <p className="mt-3 text-[14px] text-fg/60">Pro is active. Pay again any time to add more time. It is added to what you have left.</p>
      ) : (
        <p className="mt-3 text-[14px] text-fg/60">Unlimited bookings, card sizes, all themes, CSV export, 30-day analytics and link checks are on Pro.</p>
      )}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex rounded-full border border-fg/10 bg-fg/5 p-1 text-[13px]">
          {(["monthly", "yearly"] as Billing[]).map((b) => (
            <button key={b} onClick={() => setPeriod(b)} className={`rounded-full px-4 py-2 ${period === b ? "bg-fg text-bg" : "text-fg/60"}`}>
              {b === "monthly" ? "1 month" : "1 year"}
            </button>
          ))}
        </div>
        <button disabled={busy} onClick={buy} className="rounded-xl bg-[#ff5b37] px-6 py-3 text-[14px] font-semibold text-[#111] disabled:opacity-50">
          {busy ? "Opening…" : `${d.plan === "pro" ? "Add" : "Get"} Pro · ${formatPrice(price, region)}`}
        </button>
        <button onClick={() => setRegion(region === "IN" ? "GLOBAL" : "IN")} className="inline-flex min-h-[40px] items-center text-[12px] text-fg/45 underline">
          {region === "IN" ? "Pay in USD instead" : "Pay in ₹ (India) instead"}
        </button>
      </div>
      <p className="mt-3 text-[12px] text-fg/40">{region === "IN" ? "UPI, cards and netbanking via Razorpay." : "Pay securely with PayPal or your card."} One-time payment. It does not auto-renew. By paying you agree to the <Link href="/terms" className="underline">Terms</Link> and <Link href="/refund" className="underline">Refund Policy</Link> (7-day refund).</p>
      {msg && <p className="mt-4 text-[14px] text-fg">{msg}</p>}
    </div>
  );
}

function DomainTab({ d }: { d: Data }) {
  const [info, setInfo] = useState<{ domain: string | null; verified: boolean; target: string; auto?: boolean } | null>(null);
  const [input, setInput] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    const r = await fetch("/api/domain");
    if (r.ok) setInfo(await r.json());
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  if (d.plan !== "pro") return <Locked>Use your own domain, like links.yourname.com, on Pro. Upgrade on the Plan tab.</Locked>;

  async function call(body: object) {
    setBusy(true);
    setMsg("");
    const r = await fetch("/api/domain", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const o = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) setMsg(o.error ?? "Something went wrong");
    else if ("verified" in o && "verify" in body) setMsg(o.verified ? (o.certificate === "automatic" ? "Connected. The secure padlock is being set up and can take a few minutes." : "DNS is correct. Email us your domain to switch on the secure padlock.") : "We can't see it pointing here yet. DNS can take up to an hour. Try again later.");
    await load();
  }

  return (
    <div className={card}>
      <p className="text-[11px] uppercase tracking-[0.2em] text-fg/45">Your domain</p>
      {info?.domain ? (
        <>
          <p className="mt-2 font-mono text-[18px]">{info.domain} <span className={`ml-2 text-[12px] font-semibold ${info.verified ? "text-emerald-500" : "text-amber-500"}`}>{info.verified ? "Connected" : "Waiting for DNS"}</span></p>
          {!info.verified && (
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-[14px] text-fg/70">
              <li>Open the DNS settings where you bought the domain.</li>
              <li>Add a <b>CNAME</b> record: name <span className="font-mono">{info.domain.split(".").length > 2 ? info.domain.split(".")[0] : "www"}</span>, value <span className="select-all font-mono">{info.target}</span>.</li>
              <li>Come back and press <b>Check connection</b>.</li>
              <li>{info.auto ? "That is all. Once your DNS is right, we switch on the secure (https) padlock automatically. It can take a few minutes." : "Then email us your domain so we switch on its secure (https) certificate. We do this within a day."}</li>
            </ol>
          )}
          <div className="mt-5 flex flex-wrap gap-2">
            <button disabled={busy} onClick={() => call({ verify: true })} className="rounded-xl bg-fg px-5 py-2.5 text-[13px] font-semibold text-bg disabled:opacity-50">Check connection</button>
            <button disabled={busy} onClick={async () => { await fetch("/api/domain", { method: "DELETE" }); load(); }} className="rounded-xl border border-fg/20 px-5 py-2.5 text-[13px]">Remove</button>
          </div>
        </>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); call({ domain: input }); }} className="mt-3 flex flex-wrap gap-2">
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="links.yourname.com" className="min-w-0 flex-1 rounded-xl border border-fg/15 bg-bg/60 px-4 py-2.5 text-[14px] outline-none focus:border-fg/40" />
          <button disabled={busy || !input} className="rounded-xl bg-fg px-5 py-2.5 text-[13px] font-semibold text-bg disabled:opacity-50">Connect</button>
        </form>
      )}
      {msg && <p className="mt-4 text-[14px]">{msg}</p>}
    </div>
  );
}

function VerifyBanner() {
  const [sent, setSent] = useState(false);
  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#ff5b37]/40 bg-[#ff5b37]/[0.06] p-4 text-[14px]">
      <span>Please confirm your email. We sent you a link when you signed up.</span>
      <button
        disabled={sent}
        onClick={async () => {
          await fetch("/api/auth/resend-verification", { method: "POST" });
          setSent(true);
        }}
        className="rounded-lg bg-fg px-4 py-2 text-[13px] font-semibold text-bg disabled:opacity-50"
      >
        {sent ? "Sent. Check your inbox" : "Resend link"}
      </button>
    </div>
  );
}

function AccountTab({ email }: { email: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }
  async function del() {
    if (!window.confirm("Delete your account, page, emails and bookings forever? This cannot be undone.")) return;
    setBusy(true);
    setMsg("");
    const r = await fetch("/api/account", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
    const o = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setMsg(o.error ?? "Something went wrong");
    router.push("/");
    router.refresh();
  }
  return (
    <div className="space-y-4">
      <div className={card}>
        <p className="text-[11px] uppercase tracking-[0.2em] text-fg/45">Signed in as</p>
        <p className="mt-2 text-[16px] [overflow-wrap:anywhere]">{email}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={logout} className="rounded-xl border border-fg/20 px-5 py-2.5 text-[13px]">Log out</button>
          <Link href="/forgot" className="rounded-xl border border-fg/20 px-5 py-2.5 text-[13px]">Change password</Link>
        </div>
      </div>
      <BadgeCard />
      <InviteCard />
      <div className={card}>
        <p className="text-[15px] font-semibold">Your page is yours</p>
        <p className="mt-1 text-[13px] text-fg/55">Download everything at any time: your pages, links, products, email list and bookings. The backup page is a plain web page you can put on any host, so your page can never vanish, even if Showz did.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a href="/api/export?format=json" download className="rounded-xl bg-fg px-5 py-2.5 text-[13px] font-semibold text-bg">Download everything</a>
          <a href="/api/export?format=html" download className="rounded-xl border border-fg/20 px-5 py-2.5 text-[13px]">Download backup page</a>
        </div>
      </div>
      <div className={`${card} border-red-500/30`}>
        <p className="text-[15px] font-semibold">Delete account</p>
        <p className="mt-1 text-[13px] text-fg/55">Removes your page, emails, bookings and stats. Payment records are kept without your name. This cannot be undone.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" className="min-w-0 flex-1 rounded-xl border border-fg/15 bg-bg/60 px-4 py-2.5 text-[14px] outline-none focus:border-red-400" />
          <button disabled={busy || !password} onClick={del} className="rounded-xl bg-red-500 px-5 py-2.5 text-[13px] font-semibold text-white disabled:opacity-40">{busy ? "Deleting…" : "Delete forever"}</button>
        </div>
        {msg && <p className="mt-3 text-[13px] text-red-400">{msg}</p>}
      </div>
    </div>
  );
}
