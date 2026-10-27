"use client";

import Link from "next/link";
import { AutoScrollRow } from "./AutoScrollRow";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, ArrowUpRight, Check, Minus, Plus } from "lucide-react";
import { blankProfile, demoProfiles } from "@/lib/demo";
import { families, getTheme, themeList } from "@/lib/themes";
import { LookArt } from "../bio/LookArt";
import { ThemePicker } from "../bio/ThemePicker";
import { Tilt } from "../ui/Tilt";
import { Logo } from "./Nav";
import { PhoneFrame } from "./PhoneFrame";
import { QRCodeCanvas } from "../ui/QRCodeCanvas";

function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8, delay, ease: [0.2, 0.7, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-[12px] uppercase tracking-[0.35em] text-fg/45">{children}</p>;
}

export function Marquee() {
  const words = ["Links", "Products", "Bookings", "Music", "Videos", "Email list", "Media kit", "0% fees", "Your own domain", "UPI & cards"];
  return (
    <div className="relative -rotate-2 border-y border-fg/10 bg-[#ff5b37] py-4 text-[#111]">
      <div className="marquee flex w-max gap-10 whitespace-nowrap">
        {[...words, ...words].map((w, i) => (
          <span key={i} className="flex items-center gap-10 font-display text-[34px] italic leading-none">
            {w} <span className="text-[20px] not-italic">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function HowItWorks() {
  const steps = [
    ["1", "Pick a style", "Choose one of our designs. Change the colours, fonts and photo until it feels like you."],
    ["2", "Add your things", "Links, products, videos, bookings, your email list. Moving from Linktree? Paste your link and we copy everything over."],
    ["3", "Put it in your bio", "Copy your Linkss link into Instagram, TikTok or YouTube. See who visits and what they tap."],
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 py-28 sm:px-6">
      <div className="grid gap-12 md:grid-cols-[1fr_1.4fr]">
        <Reveal>
          <Eyebrow>How it works</Eyebrow>
          <h2 className="mt-4 font-display text-[clamp(44px,6vw,84px)] leading-[0.95]">Live in two minutes.</h2>
          <p className="mt-5 max-w-[340px] text-fg/55">Don&apos;t have time? Send us your handle and we&apos;ll set up your first page for free.</p>
        </Reveal>
        <ol className="flex flex-col">
          {steps.map(([n, title, body], i) => (
            <Reveal key={n} delay={i * 0.08}>
              <li className="grid grid-cols-[56px_1fr] gap-4 border-t border-fg/10 py-7">
                <span className="font-display text-[44px] leading-none text-[#ff5b37]">{n}</span>
                <div>
                  <h3 className="text-[20px] font-semibold">{title}</h3>
                  <p className="mt-2 max-w-[48ch] text-[15px] leading-relaxed text-fg/55">{body}</p>
                </div>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function ThemeGallery() {
  return (
    <section id="themes" className="relative py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <Eyebrow>Examples</Eyebrow>
            <h2 className="mt-4 font-display text-[clamp(44px,7vw,96px)] leading-[0.9]">
              {themeList.length} styles.
              <br />
              Make one yours.
            </h2>
          </div>
          <p className="max-w-[340px] text-fg/55">
            A stylist, a DJ, a makeup artist, a photographer and a creator. These are real, working pages. Try scrolling inside the phones.
          </p>
        </Reveal>
      </div>
      <Reveal>
        <div className="relative mt-14">
          <AutoScrollRow className="flex w-full gap-8 px-4">
            {[...demoProfiles, ...demoProfiles].map((p, i) => {
              const def = getTheme(p.theme).def;
              return (
                <div key={`${p.handle}-${i}`} className="flex shrink-0 flex-col gap-5">
                  <PhoneFrame profile={p} scale={0.58} />
                  <div className="flex items-center justify-between gap-4 px-1">
                    <div>
                      <h3 className="font-display text-[26px] italic leading-none">{def.label}</h3>
                      <p className="mt-1.5 text-[13px] text-fg/50">{families[def.family].label} style</p>
                    </div>
                    <Link href={`/${p.handle}`} className="inline-flex items-center gap-1 rounded-lg border border-fg/15 px-3 py-1.5 text-[12px] text-fg/70 hover:border-fg/40 hover:text-fg">
                      Open <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </AutoScrollRow>
          {/* Edge fades so the loop point never looks like a hard cut. */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-bg to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-bg to-transparent" />
        </div>
      </Reveal>
      <StylePlayground />
    </section>
  );
}

/** Pick any style and watch a real page change instantly. */
function StylePlayground() {
  // A neutral placeholder, not any one creator's page — the point here is the style, not the person.
  const base = blankProfile;
  const [theme, setTheme] = useState("atelier");
  const def = getTheme(theme).def;
  return (
    <div className="mx-auto mt-24 max-w-6xl px-4 sm:px-6">
      <Reveal>
        <div className="grid items-start gap-10 rounded-2xl border border-fg/10 bg-fg/[0.03] p-5 sm:p-8 lg:grid-cols-[auto_1fr]">
          <div className="flex flex-col items-center gap-3">
            <PhoneFrame profile={{ ...base, theme }} scale={0.6} />
            <p className="text-[13px] text-fg/55">
              {def.label} · {families[def.family].label}
            </p>
          </div>
          <div className="min-w-0">
            <h3 className="font-display text-[clamp(32px,4vw,52px)] leading-none">Try them all.</h3>
            <p className="mt-3 max-w-[46ch] text-fg/55">Tap a style and the phone changes right away. You can switch any time, your links stay the same.</p>
            <div className="mt-7">
              <ThemePicker value={theme} onChange={setTheme} maxHeight="max-h-[520px]" />
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-[28px] border border-fg/10 bg-fg/[0.04] p-7 ${className}`}>
      {children}
    </div>
  );
}

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-28 sm:px-6">
      <Reveal>
        <Eyebrow>Features</Eyebrow>
        <h2 className="mt-4 max-w-[16ch] font-display text-[clamp(44px,7vw,96px)] leading-[0.9]">More than a list of links.</h2>
      </Reveal>

      <div className="mt-14 grid gap-5 md:grid-cols-6">
        <Reveal className="md:col-span-4">
          <Card className="h-full">
            <h3 className="text-[22px] font-semibold">Sell or recommend products</h3>
            <p className="mt-2 max-w-[44ch] text-fg/55">
              Show your merch, your shop, or things you love with affiliate links from Amazon, LTK, Myntra and more. Each one is a tap away.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-4 [perspective:1000px]">
              {(
                [
                  ["vinyl", 20, "Own store", "$25"],
                  ["dress", 340, "Amazon", "$74"],
                  ["cup", 28, "Own store", "₹450"],
                ] as const
              ).map(([art, hue, store, price], i) => (
                <Tilt key={art} max={14} className="rounded-2xl">
                  <div className="overflow-hidden rounded-2xl border border-fg/10 bg-bg/30" style={{ transform: `translateY(${i % 2 ? 16 : 0}px)` }}>
                    <div className="relative aspect-[4/5]">
                      <LookArt kind={art} hue={hue} />
                      <span className="absolute left-2 top-2 rounded-full bg-bg/60 px-2 py-1 text-[9px] uppercase tracking-[0.18em] backdrop-blur">{store}</span>
                    </div>
                    <div className="flex justify-between p-3 text-[13px]">
                      <span className="text-fg/70">Buy</span>
                      <span>{price}</span>
                    </div>
                  </div>
                </Tilt>
              ))}
            </div>
          </Card>
        </Reveal>

        <Reveal className="md:col-span-2" delay={0.08}>
          <Card className="flex h-full flex-col justify-between bg-[radial-gradient(circle_at_70%_20%,rgba(255,91,55,.18),transparent_60%)]">
            <div>
              <h3 className="text-[22px] font-semibold">We never take a cut</h3>
              <p className="mt-2 text-fg/55">Some tools keep up to 12% of every sale on their cheaper plans. With us, every rupee and dollar is yours.</p>
            </div>
            <div className="chrome-text mt-6 font-syne text-[120px] font-extrabold leading-[0.8]">0%</div>
          </Card>
        </Reveal>

        <Reveal className="md:col-span-2" delay={0.04}>
          <Card className="h-full">
            <h3 className="text-[22px] font-semibold">Media kit for brands</h3>
            <p className="mt-2 text-fg/55">Show your numbers and past work, so brands can say yes faster.</p>
            <div className="mt-6 grid grid-cols-3 gap-2 text-center">
              {[
                ["184K", "followers"],
                ["6.2%", "engage"],
                ["92K", "avg views"],
              ].map(([v, l]) => (
                <div key={l} className="rounded-2xl border border-fg/10 bg-bg/30 p-3">
                  <div className="font-display text-[26px] italic leading-none">{v}</div>
                  <div className="mt-1 text-[10px] uppercase tracking-[0.15em] text-fg/45">{l}</div>
                </div>
              ))}
            </div>
          </Card>
        </Reveal>

        <Reveal className="md:col-span-2" delay={0.08}>
          <Card className="h-full">
            <h3 className="text-[22px] font-semibold">Import from Linktree</h3>
            <p className="mt-2 text-fg/55">Paste your old link and we copy your links and socials over for you.</p>
            <div className="mt-6 flex flex-col gap-2 text-[14px]">
              <div className="rounded-full border border-fg/10 bg-bg/30 px-4 py-3 text-fg/45 line-through">linktr.ee/you</div>
              <div className="flex items-center justify-between rounded-full bg-fg px-4 py-3 font-medium text-bg">
                linkss.co/you <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </Card>
        </Reveal>

        <Reveal className="md:col-span-2" delay={0.12}>
          <Card className="h-full">
            <h3 className="text-[22px] font-semibold">Pay your way</h3>
            <p className="mt-2 text-fg/55">Get paid with UPI in India, and cards or wallets everywhere else.</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["UPI", "Cards", "Apple Pay", "Google Pay", "Netbanking", "₹ INR", "$ USD"].map((c) => (
                <span key={c} className="rounded-full border border-fg/15 px-3 py-1.5 text-[12px] text-fg/75">
                  {c}
                </span>
              ))}
            </div>
          </Card>
        </Reveal>

        <Reveal className="md:col-span-3" delay={0.04}>
          <Card className="h-full">
            <h3 className="text-[22px] font-semibold">See what works</h3>
            <p className="mt-2 text-fg/55">How many people visit, what they tap, and where they come from.</p>
            <div className="mt-8 flex h-28 items-end gap-2">
              {[30, 52, 41, 68, 57, 84, 72, 96, 88, 64, 78, 100].map((h, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  whileInView={{ height: `${h}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.9, delay: i * 0.05, ease: [0.2, 0.7, 0.2, 1] }}
                  className="flex-1 rounded-t-md bg-gradient-to-t from-[#c9b8ff]/30 to-[#c9b8ff]"
                />
              ))}
            </div>
          </Card>
        </Reveal>

        <Reveal className="md:col-span-3" delay={0.08}>
          <Card className="h-full">
            <h3 className="text-[22px] font-semibold">Use your own domain</h3>
            <p className="mt-2 text-fg/55">Free on Pro. If you ever leave, the domain stays yours.</p>
            <div className="mt-8 flex items-center gap-3 rounded-2xl border border-fg/10 bg-bg/40 p-4 font-mono text-[14px]">
              <span className="h-3 w-3 rounded-full bg-[#ff5b37]" />
              <span className="text-fg/40">https://</span>
              <span className="text-fg">aria.studio</span>
              <span className="ml-auto rounded-full bg-fg/10 px-2 py-0.5 text-[11px] text-fg/60">SSL ✓</span>
            </div>
          </Card>
        </Reveal>

        <Reveal className="md:col-span-3" delay={0.04}>
          <Card className="h-full">
            <h3 className="text-[22px] font-semibold">A QR code, built in</h3>
            <p className="mt-2 text-fg/55">Every page gets one automatically — print it on a menu, a flyer or a business card.</p>
            <div className="mt-8 flex justify-center">
              <QRCodeCanvas text="https://linkss.co/you" size={108} />
            </div>
          </Card>
        </Reveal>

        <Reveal className="md:col-span-3" delay={0.08}>
          <Card className="h-full">
            <h3 className="text-[22px] font-semibold">Group links into folders</h3>
            <p className="mt-2 text-fg/55">Long list of links? Tuck related ones under a heading that opens with a tap.</p>
            <div className="mt-8 flex flex-col gap-2">
              <div className="flex items-center justify-between rounded-xl border border-fg/10 bg-bg/40 px-4 py-3 text-[14px]">
                Shop my picks <span className="text-fg/40">▾</span>
              </div>
              <div className="ml-4 flex flex-col gap-2 text-[13px] text-fg/55">
                <div className="rounded-lg border border-fg/10 bg-bg/20 px-3 py-2">LTK shop</div>
                <div className="rounded-lg border border-fg/10 bg-bg/20 px-3 py-2">Amazon storefront</div>
              </div>
            </div>
          </Card>
        </Reveal>
      </div>
    </section>
  );
}

export function Compare() {
  const yes = <Check className="mx-auto h-5 w-5 text-[#ff5b37]" />;
  const no = <Minus className="mx-auto h-5 w-5 text-fg/25" />;
  const rows: [string, React.ReactNode, React.ReactNode, React.ReactNode, React.ReactNode][] = [
    ["Paid plans from", "$6 · ₹149", "$8", "$29", "~$10"],
    ["Fee on your sales", <b key="f" className="text-[#ff5b37]">0%, always</b>, "Up to 12%*", "0%", "Up to 9%*"],
    ["UPI & rupee pricing", yes, no, no, no],
    ["Free setup by our team", yes, no, no, no],
    ["Designer themes with 3D", yes, no, no, no],
    ["Product grid", yes, yes, yes, yes],
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 py-28 sm:px-6">
      <Reveal>
        <Eyebrow>Compare</Eyebrow>
        <h2 className="mt-4 font-display text-[clamp(44px,7vw,96px)] leading-[0.9]">How we compare.</h2>
      </Reveal>
      <Reveal delay={0.1}>
        <div className="mt-12 overflow-x-auto rounded-[28px] border border-fg/10">
          <table className="w-full min-w-[640px] text-left text-[14px]">
            <thead>
              <tr className="border-b border-fg/10 text-fg/50">
                <th className="p-5 font-normal" />
                <th className="bg-fg/[0.06] p-5 text-center font-display text-[22px] italic text-fg">Linkss</th>
                <th className="p-5 text-center font-normal">Linktree</th>
                <th className="p-5 text-center font-normal">Stan</th>
                <th className="p-5 text-center font-normal">Beacons</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([label, ...cells]) => (
                <tr key={label} className="border-b border-fg/5 last:border-0">
                  <td className="p-5 text-fg/70">{label}</td>
                  {cells.map((c, i) => (
                    <td key={i} className={`p-5 text-center ${i === 0 ? "bg-fg/[0.06] text-fg" : "text-fg/55"}`}>
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-[12px] text-fg/35">
          *On their cheaper plans. Their 0% plans cost about $30 to $35 a month. Competitor prices as published in October 2026 and may change.
        </p>
      </Reveal>
    </section>
  );
}

const faqs: [string, string][] = [
  ["Who is Linkss for?", "Anyone with a bio to fill. Creators, musicians, artists, coaches, photographers, salons, cafés and small shops all use it."],
  ["Can you set it up for me?", "Yes. Send us your handle and we'll build a first version of your page for free. You can change anything after."],
  ["Why is the price different in India?", "We set prices for each country so they're fair. In India you pay in rupees with UPI, cards or netbanking. Everywhere else you pay in US dollars."],
  ["Do you take a cut of my sales?", "No. We charge 0% on everything you sell. You only pay the normal fee of the payment company."],
  ["Can I move from Linktree?", "Yes. Paste your Linktree link and we copy your links and socials over."],
  ["What happens after the free trial?", "You choose Starter or Pro. If you don't, your page goes offline. We never charge you without asking."],
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="mx-auto max-w-4xl px-4 py-28 sm:px-6">
      <Reveal>
        <Eyebrow>FAQ</Eyebrow>
        <h2 className="mt-4 font-display text-[clamp(44px,7vw,96px)] leading-[0.9]">Questions</h2>
      </Reveal>
      <div className="mt-12 flex flex-col">
        {faqs.map(([q, a], i) => (
          <div key={q} className="border-b border-fg/10">
            <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between gap-6 py-6 text-left">
              <span className="text-[18px] sm:text-[20px]">{q}</span>
              {open === i ? <Minus className="h-5 w-5 shrink-0" /> : <Plus className="h-5 w-5 shrink-0" />}
            </button>
            <motion.div initial={false} animate={{ height: open === i ? "auto" : 0, opacity: open === i ? 1 : 0 }} className="overflow-hidden">
              <p className="max-w-[60ch] pb-6 text-[15px] leading-relaxed text-fg/60">{a}</p>
            </motion.div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function FinalCTA() {
  const router = useRouter();
  const [handle, setHandle] = useState("");
  return (
    <section className="px-4 pb-16 sm:px-6">
      <Reveal>
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-2xl bg-[#ff5b37] px-6 py-20 text-center text-[#141414] sm:px-12 sm:py-28">
          <div className="relative">
            <h2 className="mx-auto max-w-[16ch] font-display text-[clamp(44px,7vw,100px)] leading-[0.92]">Get your link in two minutes.</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                router.push(`/create${handle ? `?handle=${encodeURIComponent(handle.replace(/^@/, ""))}` : ""}`);
              }}
              className="mx-auto mt-10 flex max-w-md items-center gap-2 rounded-xl bg-fg p-2"
            >
              <span className="pl-4 text-[#141414]/40">linkss.co/</span>
              <input
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="yourname"
                aria-label="Your handle"
                className="min-w-0 flex-1 bg-transparent py-2 text-[16px] outline-none"
              />
              <button className="rounded-lg bg-[#141414] px-5 py-3 text-[14px] font-semibold text-fg">Start free</button>
            </form>
            <p className="mt-4 text-[13px] text-[#141414]/70">Free for 14 days. No card needed.</p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 border-t border-fg/10 px-4 py-10 text-[13px] text-fg/45 sm:flex-row sm:px-6">
      <Logo />
      <div className="flex gap-6">
        <a href="#themes" className="hover:text-fg">Themes</a>
        <a href="#pricing" className="hover:text-fg">Pricing</a>
        <Link href="/create" className="hover:text-fg">Create</Link>
      </div>
      <p>© {new Date().getFullYear()} Linkss. One link for everything.</p>
    </footer>
  );
}
