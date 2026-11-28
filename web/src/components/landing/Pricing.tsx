"use client";

import { FREE_LIMITS } from "@/lib/plans";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { detectRegion, formatPrice, plans, type Billing, type Region } from "@/lib/pricing";

export function Pricing() {
  const [region, setRegion] = useState<Region>("GLOBAL");
  const [billing, setBilling] = useState<Billing>("yearly");

  useEffect(() => setRegion(detectRegion()), []);

  return (
    <section id="pricing" className="relative mx-auto max-w-6xl px-4 py-28 sm:px-6">
      <div className="flex flex-col items-center text-center">
        <p className="text-[12px] uppercase tracking-[0.35em] text-fg/45">Pricing</p>
        <h2 className="mt-4 font-display text-[clamp(44px,7vw,96px)] leading-[0.9]">Simple pricing.</h2>
        <p className="mt-5 max-w-[520px] text-fg/60">
          Start free. Upgrade to Pro when your page starts earning. No commission on bookings or sales, ever.
        </p>
        <p className="mt-2 max-w-[560px] text-[13px] text-fg/45">We never train AI on your content. Download your whole page any time, so it can never vanish.</p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Toggle
            options={[
              ["monthly", "Monthly"],
              ["yearly", `Yearly · save ${yearlySaving(region)}%`],
            ]}
            value={billing}
            onChange={(v) => setBilling(v as Billing)}
          />
        </div>
      </div>

      <div className="mx-auto mt-12 grid max-w-4xl gap-5 md:grid-cols-2">
        {plans.map((p) => {
          const amount = p.price[region][billing];
          const perMonth = billing === "yearly" ? Math.round(amount / 12) : amount;
          return (
            <div
              key={p.id}
              className={`relative flex flex-col rounded-[32px] p-8 ${
                p.highlight
                  ? "bg-fg/[0.05] ring-2 ring-[#ff5b37]/70"
                  : "border border-fg/10 bg-fg/[0.03]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-display text-[40px] italic leading-none">{p.name}</h3>
                {p.highlight && (
                  <span className="mt-1 shrink-0 rounded-full bg-[#ff5b37] px-3 py-1 text-[11px] font-semibold text-[#111]">For people who earn</span>
                )}
              </div>
              <p className="mt-2 text-[14px] text-fg/55">{p.tagline}</p>
              <div className="mt-8 flex items-end gap-2">
                <span className="font-display text-[72px] leading-[0.8]">{formatPrice(perMonth, region)}</span>
                <span className="pb-1 text-fg/50">/ month</span>
              </div>
              <p className="mt-2 h-5 text-[13px] text-fg/40">
                {p.id === "free" ? "No card needed" : billing === "yearly" ? `Pay ${formatPrice(amount, region)} once for a year` : "Pay for one month at a time, no auto-renewal"}
              </p>
              <ul className="mt-8 flex flex-1 flex-col gap-3 text-[14px] text-fg/80">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-3">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#ff5b37]" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={p.id === "free" ? "/create" : "/dashboard?tab=billing"}
                className={`mt-9 rounded-xl py-4 text-center text-[15px] font-semibold transition ${
                  p.highlight ? "bg-[#ff5b37] text-[#111] hover:brightness-110" : "border border-fg/20 hover:border-fg/50"
                }`}
              >
                {p.id === "free" ? "Create your free page" : "Get Pro"}
              </Link>
            </div>
          );
        })}
      </div>

      <SavingsCalculator region={region} billing={billing} />

      <p className="mt-8 text-center text-[12px] text-fg/40">
        {region === "IN"
          ? "Prices for India. Pay with UPI, cards or netbanking."
          : "Prices in US dollars. Pay with PayPal or card."}
      </p>
    </section>
  );
}

/** How much a year costs less than twelve single months, rounded down so it is never overstated. */
function yearlySaving(region: Region) {
  const p = plans.find((x) => x.id === "pro")!.price[region];
  return Math.floor((1 - p.yearly / (p.monthly * 12)) * 100);
}

function Toggle({ options, value, onChange }: { options: [string, string][]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex rounded-full border border-fg/10 bg-fg/5 p-1">
      {options.map(([v, label]) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={`rounded-full px-4 py-2 text-[13px] transition ${value === v ? "bg-fg text-bg" : "text-fg/60 hover:text-fg"}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/** Sample monthly sales per region: where the slider starts, its range and the one-tap choices. */
const SALES = {
  IN: { min: 5000, max: 150000, step: 1000, start: 35000, picks: [10000, 35000, 75000, 150000] },
  GLOBAL: { min: 100, max: 5000, step: 50, start: 800, picks: [250, 800, 2000, 5000] },
} satisfies Record<Region, { min: number; max: number; step: number; start: number; picks: number[] }>;

/** What a 10% platform cut costs compared with Showz Pro's flat price, for the sales figure the visitor picks. */
function SavingsCalculator({ region, billing }: { region: Region; billing: Billing }) {
  const r = SALES[region];
  const [monthly, setMonthly] = useState<number>(r.start);
  useEffect(() => setMonthly(SALES[region].start), [region]);

  const price = plans.find((p) => p.id === "pro")!.price[region][billing];
  const showzYear = billing === "yearly" ? price : price * 12;
  // India: a 10% commission plus 18% GST on it. Elsewhere: a plain 10% cut.
  const cutYear = Math.round(monthly * (region === "IN" ? 0.118 : 0.1)) * 12;
  const keptYear = Math.max(0, cutYear - showzYear);
  const money = (v: number) => formatPrice(Math.round(v), region);
  const fill = ((monthly - r.min) / (r.max - r.min)) * 100;
  const widest = Math.max(cutYear, showzYear);

  return (
    <div className="mx-auto mt-5 grid max-w-4xl overflow-hidden rounded-[32px] border border-fg/10 bg-fg/[0.03] text-left md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
      <div className="p-7 sm:p-10">
        <h3 className="font-display text-[clamp(34px,4vw,46px)] leading-[1]">See what you keep.</h3>
        <p className="mt-3 text-[14px] leading-relaxed text-fg/60">Drag to the amount you sell in a month: sessions, projects or products.</p>

        <p className="mt-8 flex items-baseline gap-2">
          <output className="font-display text-[clamp(52px,6vw,68px)] leading-none tabular-nums">{money(monthly)}</output>
          <span className="text-[14px] text-fg/50">a month</span>
        </p>
        <input
          type="range"
          min={r.min}
          max={r.max}
          step={r.step}
          value={monthly}
          onChange={(e) => setMonthly(Number(e.target.value))}
          aria-label="Your monthly sales"
          aria-valuetext={`${money(monthly)} a month`}
          className="showz-range mt-3"
          style={{ "--fill": `${fill}%` } as React.CSSProperties}
        />
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {r.picks.map((v) => (
            <button key={v} type="button" onClick={() => setMonthly(v)} aria-pressed={monthly === v} className={`min-h-[40px] rounded-xl border px-1 text-[13px] font-semibold tabular-nums transition ${monthly === v ? "border-fg bg-fg text-bg" : "border-fg/15 text-fg/70 hover:border-fg/40"}`}>
              {money(v)}
            </button>
          ))}
        </div>

        <dl className="mt-9 space-y-5">
          {[
            { label: region === "IN" ? "A platform taking 10% + GST" : "A platform that takes 10%", value: cutYear, bar: "bg-fg/25" },
            { label: "Showz Pro, flat price", value: showzYear, bar: "bg-[#ff5b37]" },
          ].map((row) => (
            <div key={row.label}>
              <div className="flex items-baseline justify-between gap-3 text-[14px]">
                <dt className="text-fg/65">{row.label}</dt>
                <dd className="shrink-0 font-semibold tabular-nums">
                  {money(row.value)} <span className="font-normal text-fg/45">a year</span>
                </dd>
              </div>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-fg/[0.06]">
                <div className={`h-full rounded-full transition-[width] duration-300 ${row.bar}`} style={{ width: `${Math.max(2.5, (row.value / widest) * 100)}%` }} />
              </div>
            </div>
          ))}
        </dl>
      </div>

      <div className="flex flex-col items-center justify-center bg-[#ff5b37] px-7 py-12 text-center text-[#141414] sm:px-10">
        <p className="text-[15px] font-semibold">Extra in your pocket every year</p>
        <p className="mt-3 max-w-full font-display text-[clamp(60px,7vw,92px)] leading-[0.95] tabular-nums [overflow-wrap:anywhere]">{money(keptYear)}</p>
        <p className="mt-4 text-[15px]">
          That is about <b className="tabular-nums">{money(keptYear / 12)}</b> a month.
        </p>
        <Link href="/start" className="mt-8 inline-flex min-h-[52px] w-full max-w-[260px] items-center justify-center rounded-xl bg-[#141414] px-6 text-[15px] font-semibold text-white transition hover:bg-black">
          Create your free page
        </Link>
        <p className="mt-6 max-w-[300px] text-[12px] leading-relaxed text-[#141414]/70">
          {region === "IN" ? "Compared with a 10% commission plus 18% GST on it" : "Compared with a 10% cut on every sale"}, with Pro billed {billing}. Payment fees (about 2%) apply on every platform and are left out of both. Free includes {FREE_LIMITS.bookings} paid bookings a month.
        </p>
      </div>
    </div>
  );
}
