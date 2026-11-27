import type { Metadata } from "next";
import Link from "next/link";
import { CalendarCheck, Download, Link2, Mail } from "lucide-react";
import { Nav } from "@/components/landing/Nav";
import { Footer } from "@/components/landing/Footer";
import { OPERATOR } from "@/lib/legal";

export const metadata: Metadata = {
  title: "About Us · Showz",
  description: "Who builds Showz, what it does and how it earns.",
};

const DOES = [
  { icon: Link2, title: "One page for everything", text: "Links, products, a WhatsApp chat card and your latest YouTube video, in a design that already looks finished." },
  { icon: CalendarCheck, title: "Paid 1:1 bookings", text: "On Pro, people pick a time and pay you directly. We take no commission." },
  { icon: Mail, title: "Your audience", text: "Collect emails from visitors who agree to share them, and see what they tap." },
  { icon: Download, title: "Yours to keep", text: "Download your page and your data whenever you like, plus a backup web page that works anywhere." },
];

const card = "relative overflow-hidden rounded-[28px] border border-fg/10 bg-fg/[0.04] p-7 sm:p-8";
const h2 = "font-display text-[clamp(34px,4.5vw,56px)] leading-[1] tracking-[-0.01em]";

export default function About() {
  const founders = OPERATOR.names.split(" and ");
  return (
    <>
      <Nav />
      <main className="relative overflow-x-clip bg-bg text-fg">
        <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-[480px] max-w-[900px] bg-[radial-gradient(closest-side,var(--hero-glow),transparent)] opacity-90" />
        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-36 sm:px-6">
          <h1 className="mx-auto max-w-[15ch] text-balance text-center font-display text-[clamp(48px,8.4vw,112px)] leading-[0.92] tracking-[-0.01em]">Your whole business in one link.</h1>
          <p className="mx-auto mt-6 max-w-[560px] text-balance text-center text-[17px] leading-relaxed text-fg/65">Showz is for creators, coaches, freelancers and small shops. One page to show your work, take bookings, list products and hear from the people who follow you.</p>

          <section className="mt-20">
            <h2 className={h2}>What it does</h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {DOES.map(({ icon: Icon, title, text }) => (
                <div key={title} className={card}>
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#ff5b37] text-[#111]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-5 font-display text-[clamp(26px,3vw,32px)] leading-[1.05]">{title}</h3>
                  <p className="mt-2.5 max-w-[46ch] text-[14px] leading-relaxed text-fg/60">{text}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-5 grid gap-5 lg:grid-cols-2">
            <div className="rounded-[28px] bg-fg p-7 text-bg sm:p-10">
              <h2 className={h2}>How we earn</h2>
              <p className="mt-5 max-w-[48ch] text-[15px] leading-relaxed opacity-75">There is a Free plan. If you need more, Pro is a prepaid month or year that never renews on its own. We take no commission on your bookings or sales; payment companies charge their own fees.</p>
              <Link href="/#pricing" className="mt-7 inline-flex min-h-[44px] items-center rounded-xl bg-bg px-5 text-[14px] font-semibold text-fg">See pricing</Link>
            </div>
            <div className={`${card} sm:!p-10`}>
              <h2 className={h2}>What we promise</h2>
              <p className="mt-5 max-w-[48ch] text-[15px] leading-relaxed text-fg/65">We never use your content to train AI models. We never sell your data or your visitors&apos; data. And your page can never vanish without warning: you can download it at any time.</p>
              <Link href="/terms" className="mt-7 inline-flex min-h-[44px] items-center rounded-xl border border-fg/20 px-5 text-[14px] font-semibold">Read the terms</Link>
            </div>
          </section>

          <section className="mt-20">
            <h2 className={h2}>Who builds it</h2>
            <p className="mt-4 max-w-[520px] text-[15px] leading-relaxed text-fg/60">Two students based in {OPERATOR.place}.</p>
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {founders.map((name) => (
                <div key={name} className={`${card} flex items-center gap-5`}>
                  <span aria-hidden className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-[conic-gradient(from_200deg,#8a8f99,#fff,#6f747d,#e9ebef,#8a8f99)] font-display text-[26px] italic text-[#111]">
                    {name.charAt(0)}
                  </span>
                  <p className="font-display text-[clamp(24px,3vw,32px)] leading-[1.05]">{name}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-20 rounded-[28px] bg-[#ff5b37] px-6 py-14 text-center text-[#141414] sm:px-12 sm:py-20">
            <h2 className="mx-auto max-w-[16ch] font-display text-[clamp(38px,6vw,76px)] leading-[0.95]">A real person reads every message.</h2>
            <p className="mx-auto mt-4 max-w-[460px] text-[15px] opacity-75">We reply within 2 working days.</p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a href={`mailto:${OPERATOR.supportEmail}`} className="inline-flex min-h-[48px] items-center rounded-xl bg-[#141414] px-6 text-[14px] font-semibold text-white">Email us</a>
              <Link href="/start" className="inline-flex min-h-[48px] items-center rounded-xl bg-white px-6 text-[14px] font-semibold text-[#141414]">Create your free page</Link>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
