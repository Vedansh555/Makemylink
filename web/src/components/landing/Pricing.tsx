"use client";

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
              ["yearly", "Yearly · save 33%"],
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

      <SavingsCalculator region={region} />

      <p className="mt-8 text-center text-[12px] text-fg/40">
        {region === "IN"
          ? "Prices for India. Pay with UPI, cards or netbanking."
          : "Prices in USD. Pay by card, Apple Pay or Google Pay."}
      </p>
    </section>
  );
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

function SavingsCalculator({ region }: { region: Region }) {
  const isIndia = region === "IN";
  const min = isIndia ? 5000 : 100;
  const max = isIndia ? 150000 : 3000;
  const step = isIndia ? 5000 : 50;
  const [monthly, setMonthly] = useState(isIndia ? 35000 : 600);

  useEffect(() => {
    setMonthly(isIndia ? 35000 : 600);
  }, [isIndia]);

  // Typical platforms take ~12% (10% platform fee + ~2% gateway fee or 14% on Topmate / 10% on Gumroad)
  const otherFee = Math.round(monthly * 0.12);
  const showzFee = isIndia ? 299 : 8;
  const savedMonthly = Math.max(0, otherFee - showzFee);
  const savedYearly = savedMonthly * 12;

  const fmt = (val: number) => (isIndia ? `₹${val.toLocaleString("en-IN")}` : `$${val.toLocaleString("en-US")}`);

  return (
    <div className="mx-auto mt-14 max-w-3xl rounded-[28px] border border-fg/10 bg-fg/[0.03] p-6 sm:p-8 text-left">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <h3 className="text-[20px] font-semibold text-fg">Calculate your savings with 0% commission</h3>
          <p className="mt-1 text-[13px] text-fg/55">
            Whether you offer 1:1 sessions, freelance project bookings, or digital downloads.
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-[#ff5b37]/15 px-3 py-1 text-[11px] font-bold text-[#ff5b37]">
          0% cut on Showz
        </span>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between text-[14px]">
          <span className="text-fg/60">Your estimated monthly sales / bookings</span>
          <span className="font-display text-[22px] font-bold text-fg">{fmt(monthly)}</span>
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={monthly}
          onChange={(e) => setMonthly(Number(e.target.value))}
          aria-label="Estimated monthly earnings"
          className="mt-3 w-full accent-[#ff5b37] cursor-pointer"
        />
        <div className="mt-1 flex justify-between text-[11px] text-fg/40 font-mono">
          <span>{fmt(min)}/mo</span>
          <span>{fmt(max)}/mo</span>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-fg/10 bg-bg/50 p-4">
          <p className="text-[11px] uppercase tracking-wider text-fg/45">Platforms with a 12% cut</p>
          <p className="mt-2 text-[20px] font-bold text-red-400">-{fmt(otherFee)}<span className="text-[12px] font-normal text-fg/50">/mo</span></p>
          <p className="mt-1 text-[11px] text-fg/40">Topmate, Gumroad, Beacons</p>
        </div>
        <div className="rounded-2xl border border-fg/10 bg-bg/50 p-4">
          <p className="text-[11px] uppercase tracking-wider text-fg/45">Showz Pro flat fee</p>
          <p className="mt-2 text-[20px] font-bold text-fg">{fmt(showzFee)}<span className="text-[12px] font-normal text-fg/50">/mo</span></p>
          <p className="mt-1 text-[11px] text-fg/40">Zero percentage, ever</p>
        </div>
        <div className="rounded-2xl border border-[#ff5b37]/30 bg-[#ff5b37]/[0.08] p-4">
          <p className="text-[11px] uppercase tracking-wider text-[#ff5b37]">You keep extra</p>
          <p className="mt-2 text-[22px] font-bold text-emerald-400">+{fmt(savedMonthly)}<span className="text-[12px] font-normal text-fg/50">/mo</span></p>
          <p className="mt-1 text-[11px] text-emerald-400/70 font-semibold">{fmt(savedYearly)} saved per year</p>
        </div>
      </div>
    </div>
  );
}
