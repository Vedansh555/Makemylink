"use client";

import Link from "next/link";
import Script from "next/script";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { detectRegion, formatPrice, plans, type Billing, type Region } from "@/lib/pricing";
import { Logo } from "../landing/Nav";

type Tab = "overview" | "leads" | "bookings" | "links" | "domain" | "billing" | "account";
interface Data {
  plan: "free" | "pro";
  handle: string;
  days: number;
  daily: { day: string; kind: string; n: number }[];
  perLink: { target: string; title: string; n: number }[];
  countries: { country: string; n: number }[];
  subscribers: { total: number; recent: { email: string; created_at: number }[]; limit: number | null };
  bookings: { id: string; title: string; buyer_name: string; buyer_email: string; slot_start: number; note: string; amount: number; currency: string; status: string }[];
  health: { link_id: string; url: string; status: number | null; ok: boolean; checked_at: number }[];
  checklist: { key: string; label: string; done: boolean; href?: string }[];
}
declare global {
  interface Window {
    Razorpay?: new (o: Record<string, unknown>) => { open(): void };
  }
}

const card = "rounded-2xl border border-fg/10 bg-fg/[0.03] p-5";

export function Dashboard() {
  const router = useRouter();
  const params = useSearchParams();
  const [tab, setTab] = useState<Tab>((params.get("tab") as Tab) || "overview");
  const [data, setData] = useState<Data | null>(null);
  const [email, setEmail] = useState("");
  const [verified, setVerified] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const me = await fetch("/api/auth/me");
    if (!me.ok) return router.replace("/login");
    const u = (await me.json()).user;
    setEmail(u.email);
    setVerified(u.emailVerified !== false);
    const r = await fetch("/api/dashboard");
    if (r.ok) setData(await r.json());
    else setError("Could not load your dashboard.");
  }, [router]);
  useEffect(() => {
    load();
  }, [load]);

  const tabs: [Tab, string][] = [["overview", "Overview"], ["leads", "Emails"], ["bookings", "Bookings"], ["links", "Link health"], ["domain", "Domain"], ["billing", "Plan"], ["account", "Account"]];

  return (
    <main className="min-h-screen bg-bg text-fg">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-6 sm:px-6">
        <Logo />
        <div className="flex items-center gap-3 text-[13px]">
          <Link href="/create" className="rounded-lg border border-fg/15 px-3.5 py-2 hover:border-fg/40">Edit page</Link>
          {data && <Link href={`/${data.handle}`} className="hidden text-fg/55 hover:text-fg sm:block">/{data.handle}</Link>}
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-4 pb-24 sm:px-6">
        <h1 className="font-display text-[40px] italic leading-none sm:text-[56px]">Dashboard</h1>
        <p className="mt-2 text-[13px] text-fg/45">{email}</p>
        <nav className="no-scrollbar mt-6 flex gap-1 overflow-x-auto rounded-full border border-fg/10 bg-fg/5 p-1">
          {tabs.map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} className={`shrink-0 rounded-full px-4 py-2 text-[13px] ${tab === id ? "bg-fg text-bg" : "text-fg/60 hover:text-fg"}`}>
              {label}
            </button>
          ))}
        </nav>
        {!verified && <VerifyBanner />}
        {error && <p className="mt-6 text-[14px] text-red-400">{error}</p>}
        {!data && !error && <p className="mt-8 text-fg/50">Loading…</p>}
        {data && (
          <div className="mt-6">
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
          <a href="/api/subscribers/export" download className="rounded-lg bg-fg px-4 py-2 text-[13px] font-semibold text-bg">Download CSV</a>
        ) : (
          <span className="text-[12px] text-fg/50">CSV export is on Pro</span>
        )}
      </div>
      <ul className="mt-4 divide-y divide-fg/10 text-[14px]">
        {d.subscribers.recent.map((s) => (
          <li key={s.email} className="flex justify-between gap-3 py-2"><span className="truncate">{s.email}</span><span className="shrink-0 text-fg/45">{new Date(s.created_at).toLocaleDateString()}</span></li>
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
  if (d.plan !== "pro") return <Locked>Paid 1:1 bookings are a Pro feature. Upgrade on the Plan tab.</Locked>;
  return (
    <div className={card}>
      {!d.bookings.length && <p className="text-[14px] text-fg/50">No bookings yet. Add a booking card in the editor.</p>}
      <ul className="divide-y divide-fg/10">
        {d.bookings.map((b) => (
          <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-[14px]">
            <div>
              <p className="font-semibold">{b.title} · {b.buyer_name}</p>
              <p className="text-fg/55">{new Date(b.slot_start).toLocaleString()} · {b.buyer_email}</p>
              {b.note && <p className="text-fg/45">“{b.note}”</p>}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] uppercase tracking-wider text-fg/50">{b.amount ? `${b.currency === "INR" ? "₹" : "$"}${b.amount}` : "Free"} · {b.status.replace("_", " ")}</span>
              {b.status === "awaiting_payment" && <button onClick={() => setStatus(b.id, "confirmed")} className="rounded-lg bg-fg px-3 py-1.5 text-[12px] font-semibold text-bg">Mark paid</button>}
              {b.status !== "cancelled" && <button onClick={() => setStatus(b.id, "cancelled")} className="rounded-lg border border-fg/20 px-3 py-1.5 text-[12px]">Cancel</button>}
            </div>
          </li>
        ))}
      </ul>
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
    if (o.provider === "stripe") {
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
          body: JSON.stringify({ orderId: r.razorpay_order_id, paymentId: r.razorpay_payment_id, signature: r.razorpay_signature, period }),
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
        <p className="mt-3 text-[14px] text-fg/60">Bookings, card sizes, all themes, CSV export, 30-day analytics and link checks are on Pro.</p>
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
        <button onClick={() => setRegion(region === "IN" ? "GLOBAL" : "IN")} className="text-[12px] text-fg/45 underline">
          {region === "IN" ? "Pay in USD instead" : "Pay in ₹ (India) instead"}
        </button>
      </div>
      <p className="mt-3 text-[12px] text-fg/40">{region === "IN" ? "UPI, cards and netbanking via Razorpay." : "Cards, Apple Pay and Google Pay via Stripe."} One-time payment. It does not auto-renew. By paying you agree to the <Link href="/terms" className="underline">Terms</Link> and <Link href="/refund" className="underline">Refund Policy</Link> (7-day refund).</p>
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
        <p className="mt-2 text-[16px]">{email}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={logout} className="rounded-xl border border-fg/20 px-5 py-2.5 text-[13px]">Log out</button>
          <Link href="/forgot" className="rounded-xl border border-fg/20 px-5 py-2.5 text-[13px]">Change password</Link>
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
