"use client";

import { useState } from "react";
import { Check, Eye, EyeOff } from "lucide-react";
import { Logo } from "@/components/landing/Nav";
import { PhoneFrame } from "@/components/landing/PhoneFrame";
import { getDemoProfile } from "@/lib/demo";
import { portrait } from "@/lib/avatar";

export const authInput =
  "h-[52px] w-full rounded-xl border border-fg/15 bg-bg px-4 text-[15px] text-fg outline-none transition placeholder:text-fg/35 focus:border-[#ff5b37] focus:ring-4 focus:ring-[#ff5b37]/15";
export const authButton =
  "h-[54px] w-full rounded-xl bg-[#ff5b37] text-[15px] font-semibold text-[#111] shadow-[0_16px_30px_-16px_#ff5b37] transition hover:bg-[#ff6f4f] disabled:bg-fg/[0.07] disabled:text-fg/40 disabled:shadow-none";

export function AuthField({ label, aside, children }: { label: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3 text-[13px]">
        <span className="font-semibold">{label}</span>
        {aside}
      </div>
      {children}
    </div>
  );
}

export function PasswordInput(props: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "className">) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input {...props} type={show ? "text" : "password"} className={`${authInput} pr-14`} />
      <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "Hide password" : "Show password"} aria-pressed={show} className="absolute right-1.5 top-1.5 grid h-10 w-10 place-items-center rounded-lg text-fg/45 transition hover:bg-fg/5 hover:text-fg">
        {show ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
      </button>
    </div>
  );
}

export function AuthError({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="mt-6 rounded-xl border border-red-500/25 bg-red-500/[0.08] px-4 py-3 text-[13px] text-red-600">
      {children}
    </p>
  );
}

const POINTS = ["Free to start, no card needed", "Paid bookings with 0% Showz commission", "Download your page whenever you like"];

/** Shared shell for sign up, log in and password pages: the form on one side, the product on the other. */
export function AuthShell({ title, intro, children, footer }: { title: string; intro?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  const demo = { ...getDemoProfile("bubbles")!, avatar: portrait("mia", "f", 10) };
  return (
    <div className="relative min-h-screen overflow-x-clip bg-bg text-fg lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-[420px] max-w-[760px] bg-[radial-gradient(closest-side,var(--hero-glow),transparent)] lg:right-1/2" />
      <main className="relative flex min-h-screen flex-col px-5 py-6 sm:px-10">
        <Logo />
        <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center py-10">
          <h1 className="text-balance font-display text-[clamp(44px,6vw,64px)] leading-[0.98] tracking-[-0.01em]">{title}</h1>
          {intro && <p className="mt-4 text-[15px] leading-relaxed text-fg/60">{intro}</p>}
          {children}
          {footer && <p className="mt-8 border-t border-fg/10 pt-6 text-[14px] text-fg/55">{footer}</p>}
        </div>
      </main>

      <aside className="hidden p-4 pl-0 lg:block">
        <div className="sticky top-4 flex h-[calc(100vh-2rem)] min-h-[640px] flex-col items-center overflow-hidden rounded-[32px] bg-[#ff5b37] px-10 pt-14 text-[#141414]">
          <p className="max-w-[16ch] text-balance text-center font-display text-[clamp(40px,4.2vw,68px)] leading-[0.95]">Your whole business in one link.</p>
          <ul className="mt-6 space-y-2">
            {POINTS.map((p) => (
              <li key={p} className="flex items-center gap-2.5 text-[14px] font-medium">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#141414] text-white">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                {p}
              </li>
            ))}
          </ul>
          {/* The phone runs off the bottom edge on purpose; its shadow is tight so the edge stays clean. */}
          <div className="mt-10">
            <PhoneFrame interactive={false} tightShadow profile={demo} scale={0.66} />
          </div>
        </div>
      </aside>
    </div>
  );
}
