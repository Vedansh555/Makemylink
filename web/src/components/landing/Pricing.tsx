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
          Free for 14 days, then one simple price. Keep 95% of your sales on Starter, 100% on Pro.
        </p>

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
                  <span className="mt-1 shrink-0 rounded-full bg-[#ff5b37] px-3 py-1 text-[11px] font-semibold text-[#111]">Most loved</span>
                )}
              </div>
              <p className="mt-2 text-[14px] text-fg/55">{p.tagline}</p>
              <div className="mt-8 flex items-end gap-2">
                <span className="font-display text-[72px] leading-[0.8]">{formatPrice(perMonth, region)}</span>
                <span className="pb-1 text-fg/50">/ month</span>
              </div>
              <p className="mt-2 h-5 text-[13px] text-fg/40">
                {billing === "yearly" ? `Billed ${formatPrice(amount, region)} yearly` : "Billed monthly, cancel anytime"}
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
                href="/create"
                className={`mt-9 rounded-xl py-4 text-center text-[15px] font-semibold transition ${
                  p.highlight ? "bg-[#ff5b37] text-[#111] hover:brightness-110" : "border border-fg/20 hover:border-fg/50"
                }`}
              >
                Start 14-day free trial
              </Link>
            </div>
          );
        })}
      </div>
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
