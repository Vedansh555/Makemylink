"use client";

import { SITE_URL, SITE_HOST } from "@/lib/site";
import { OPERATOR } from "@/lib/legal";
import Link from "next/link";
import { AutoScrollRow } from "./AutoScrollRow";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, ArrowUpRight, Check, ChevronDown, Minus, Plus } from "lucide-react";
import { blankProfile, demoProfiles } from "@/lib/demo";
import { families, getTheme, themeList } from "@/lib/themes";
import { LookArt } from "../bio/LookArt";
import { ThemePicker } from "../bio/ThemePicker";
import dynamic from "next/dynamic";
import { Tilt } from "../ui/Tilt";
import { Logo } from "./Nav";
import { PhoneFrame } from "./PhoneFrame";
import { QRCodeCanvas } from "../ui/QRCodeCanvas";

const ChromeScene = dynamic(() => import("../three/ChromeScene"), { ssr: false });

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
  const words = ["Paid bookings", "Links", "Products", "Email list", "Analytics", "0% commission on Pro", "UPI & cards", "Bento grid", "Media kit", "135 themes"];
  return (
    <div className="relative z-20 -mt-16">
      {/* Solid page-colour block under the tilted band, so no phone shows below it */}
      <div className="absolute inset-x-0 bottom-0 top-1/2 bg-bg" />
      <div className="relative -rotate-2 border-y border-fg/10 bg-[#ff5b37] py-4 text-[#111]">
      <div className="marquee flex w-max gap-10 whitespace-nowrap">
        {[...words, ...words].map((w, i) => (
          <span key={i} className="flex items-center gap-10 font-display text-[34px] italic leading-none">
            {w} <span className="text-[20px] not-italic">•</span>
          </span>
        ))}
      </div>
      </div>
    </div>
  );
}

export function HowItWorks() {
  const steps = [
    ["1", "Pick a style", "Choose one of our designs. Change the colours, fonts and photo until it feels like you."],
    ["2", "Add what earns", "A bookable 1:1 call, your products and links, an email sign-up. Moving from Linktree? Paste your link and we copy your links over."],
    ["3", "Share one link", "Put it in your Instagram, LinkedIn or YouTube bio. Followers book, buy and subscribe. You see what works."],
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 pb-14 pt-28 sm:px-6">
      <div className="grid gap-12 md:grid-cols-[1fr_1.4fr]">
        <Reveal>
          <Eyebrow>How it works</Eyebrow>
          <h2 className="mt-4 font-display text-[clamp(44px,6vw,84px)] leading-[0.95]">Live in two minutes.</h2>
          <p className="mt-5 max-w-[340px] text-fg/55">Free to start, no card needed. Upgrade to Pro when your page starts earning.</p>
          <div className="pointer-events-none mt-6 hidden h-[170px] w-full max-w-[320px] md:block">
            <ChromeScene variant="chain" />
          </div>
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
    <section id="themes" className="relative pb-28 pt-10">
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
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/create?theme=${p.theme}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-fg px-3 py-1.5 text-[12px] font-medium text-bg hover:bg-[#ff5b37] hover:text-[#111] transition"
                      >
                        Customize
                      </Link>
                      <Link
                        href={`/${p.handle}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-fg/15 px-3 py-1.5 text-[12px] text-fg/70 hover:border-fg/40 hover:text-fg transition"
                      >
                        Open <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
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
        <div className="rounded-2xl border border-fg/10 bg-fg/[0.03] p-5 sm:p-8 lg:grid lg:grid-cols-[auto_1fr] lg:items-start lg:gap-10">
            {/* Phone preview: pinned under the nav on mobile so styles can be tapped and seen together */}
            <div className="sticky top-[76px] z-20 -mx-2 mb-3 flex items-center gap-4 rounded-2xl bg-bg/90 p-2 backdrop-blur-xl lg:static lg:mx-0 lg:mb-0 lg:flex-col lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
              <div className="lg:hidden">
                <PhoneFrame profile={{ ...base, theme }} scale={0.28} />
              </div>
              <div className="hidden lg:block">
                <PhoneFrame profile={{ ...base, theme }} scale={0.56} />
              </div>
              <div className="flex min-w-0 flex-1 flex-col items-start gap-2.5 lg:mt-4 lg:flex-none lg:flex-row lg:flex-wrap lg:items-center lg:justify-center lg:gap-3">
                <span className="rounded-full border border-fg/10 bg-fg/5 px-3 py-1 text-[12px] font-medium text-fg/75 sm:text-[13px]">
                  {def.label} · {families[def.family].label}
                </span>
                <Link
                  href={`/create?theme=${theme}`}
                  className="inline-flex items-center gap-1 rounded-full bg-fg px-4 py-2 text-[13px] font-semibold text-bg transition hover:bg-[#ff5b37] hover:text-[#111]"
                >
                  Use this style <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          <div className="min-w-0">
            <h3 className="font-display text-[26px] leading-none sm:text-[clamp(28px,4vw,52px)]">Try them all.</h3>
            <p className="mt-2.5 hidden max-w-[46ch] text-[15px] text-fg/55 sm:block">Tap any style below and watch the preview update immediately.</p>
            <div className="mt-4 sm:mt-6">
              <ThemePicker value={theme} onChange={setTheme} maxHeight="lg:max-h-[520px]" />
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
  const router = useRouter();
  const [importInput, setImportInput] = useState("");
  const [importing, setImporting] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState("₹ INR");
  const [copiedLink, setCopiedLink] = useState(false);
  const [folderOpen, setFolderOpen] = useState(true);
  const [activeBar, setActiveBar] = useState<number | null>(7);
  const [boughtProduct, setBoughtProduct] = useState<string | null>(null);

  const statsData = [
    { label: "Mon", visitors: 340 },
    { label: "Tue", visitors: 580 },
    { label: "Wed", visitors: 460 },
    { label: "Thu", visitors: 780 },
    { label: "Fri", visitors: 650 },
    { label: "Sat", visitors: 940 },
    { label: "Sun", visitors: 820 },
    { label: "Mon", visitors: 1120 },
    { label: "Tue", visitors: 990 },
    { label: "Wed", visitors: 730 },
    { label: "Thu", visitors: 890 },
    { label: "Today", visitors: 1250 },
  ];

  const handleImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importInput.trim()) {
      router.push("/create");
      return;
    }
    setImporting(true);
    setTimeout(() => {
      const cleanHandle = importInput.trim().replace(/^.*linktr\.ee\//, "").replace(/[^a-zA-Z0-9._]/g, "");
      router.push(`/create?handle=${cleanHandle || "creator"}`);
    }, 400);
  };

  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-28 sm:px-6">
      <Reveal>
        <Eyebrow>Features</Eyebrow>
        <h2 className="mt-4 max-w-[16ch] font-display text-[clamp(44px,7vw,96px)] leading-[0.9]">Built to earn, not just to list.</h2>
      </Reveal>

      <div className="mt-14 grid gap-5 md:grid-cols-6">
        {/* Sell or recommend products */}
        <Reveal className="md:col-span-4">
          <Card className="h-full">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-[22px] font-semibold">Sell or recommend products</h3>
                <p className="mt-2 max-w-[44ch] text-fg/55">
                  Show your merch, your shop, or things you love with affiliate links from Amazon, LTK, Myntra and more. Each one is a tap away.
                </p>
              </div>
              <Link
                href="/create"
                className="hidden shrink-0 items-center gap-1.5 rounded-full border border-fg/15 bg-fg/[0.03] px-3.5 py-1.5 text-[12px] font-medium text-fg/70 transition hover:border-fg/40 hover:text-fg sm:inline-flex"
              >
                Try in editor <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-4 [perspective:1000px]">
              {(
                [
                  ["vinyl", 20, "Own store", "$25", "Special Edition Vinyl EP", "https://shopmy.us"],
                  ["dress", 340, "Amazon", "$74", "Satin Midi Slip Dress", "https://amazon.com"],
                  ["cup", 28, "Own store", "₹450", "Ceramic Artisan Coffee Mug", "https://myntra.com"],
                ] as const
              ).map(([art, hue, store, price, title, url], i) => (
                <Tilt key={art} max={14} className="rounded-2xl">
                  <div className="group overflow-hidden rounded-2xl border border-fg/10 bg-bg/30 transition hover:border-fg/30 hover:shadow-lg" style={{ transform: `translateY(${i % 2 ? 16 : 0}px)` }}>
                    <div className="relative aspect-[4/5] overflow-hidden">
                      <LookArt kind={art} hue={hue} />
                      <span className="absolute left-2 top-2 rounded-full bg-bg/70 px-2 py-1 text-[9px] uppercase tracking-[0.18em] backdrop-blur font-medium">{store}</span>
                    </div>
                    <div className="p-3">
                      <p className="truncate text-[12px] font-medium text-fg/75">{title}</p>
                      <div className="mt-2 flex items-center justify-between text-[13px]">
                        <button
                          type="button"
                          onClick={() => {
                            setBoughtProduct(title);
                            setTimeout(() => setBoughtProduct(null), 2500);
                          }}
                          className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                            boughtProduct === title
                              ? "bg-emerald-500 text-white"
                              : "bg-fg text-bg hover:bg-[#ff5b37] hover:text-[#111]"
                          }`}
                        >
                          {boughtProduct === title ? "Added ✓" : "Buy"}
                        </button>
                        <span className="font-semibold text-fg">{price}</span>
                      </div>
                    </div>
                  </div>
                </Tilt>
              ))}
            </div>
          </Card>
        </Reveal>

        {/* Keep more of every sale */}
        <Reveal className="md:col-span-2" delay={0.08}>
          <Card className="flex h-full flex-col justify-between bg-[radial-gradient(circle_at_70%_20%,rgba(255,91,55,.18),transparent_60%)]">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-[22px] font-semibold">Keep more of every sale</h3>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600">0% on Pro</span>
              </div>
              <p className="mt-2 text-fg/55">Many tools keep up to 12% of every sale on their cheaper plans. We keep nothing. Pro is a flat ₹299 or $8 a month.</p>
            </div>
            <div className="flex items-end justify-between mt-6">
              <div className="chrome-text font-syne text-[100px] sm:text-[120px] font-extrabold leading-[0.8]">0%</div>
              <Link
                href="/create"
                className="mb-2 inline-flex items-center gap-1 text-[13px] font-semibold text-fg/80 underline decoration-fg/30 underline-offset-4 hover:text-[#ff5b37] hover:decoration-[#ff5b37] transition"
              >
                Start free <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </Card>
        </Reveal>

        {/* Media kit for brands */}
        <Reveal className="md:col-span-2" delay={0.04}>
          <Card className="h-full">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-[22px] font-semibold">Media kit for brands</h3>
                <p className="mt-2 text-fg/55">Show your numbers and past work, so brands can say yes faster.</p>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-2 text-center">
              {[
                ["184K", "followers"],
                ["6.2%", "engage"],
                ["92K", "avg views"],
              ].map(([v, l]) => (
                <div key={l} className="group rounded-2xl border border-fg/10 bg-bg/30 p-3 transition hover:border-[#ff5b37]/40 hover:bg-fg/[0.03]">
                  <div className="font-display text-[26px] italic leading-none group-hover:text-[#ff5b37] transition-colors">{v}</div>
                  <div className="mt-1 text-[10px] uppercase tracking-[0.15em] text-fg/45">{l}</div>
                </div>
              ))}
            </div>
            <Link
              href="/create"
              className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-fg/12 bg-fg/[0.03] py-2 text-[12px] font-medium text-fg/70 hover:border-fg/30 hover:text-fg transition"
            >
              Add media kit to your bio <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Card>
        </Reveal>

        {/* Import from Linktree */}
        <Reveal className="md:col-span-2" delay={0.08}>
          <Card className="h-full">
            <h3 className="text-[22px] font-semibold">Import from Linktree</h3>
            <p className="mt-2 text-fg/55">Paste your old link and we copy your links and socials over for you.</p>
            <form onSubmit={handleImport} className="mt-6 flex flex-col gap-2.5 text-[14px]">
              <div className="relative">
                <input
                  type="text"
                  placeholder="linktr.ee/yourname"
                  value={importInput}
                  onChange={(e) => setImportInput(e.target.value)}
                  className="w-full rounded-full border border-fg/15 bg-bg/60 px-4 py-3 text-[13px] text-fg placeholder:text-fg/40 outline-none focus:border-[#ff5b37] transition"
                />
              </div>
              <button
                type="submit"
                disabled={importing}
                className="flex items-center justify-between rounded-full bg-fg px-5 py-3 font-semibold text-bg transition hover:bg-[#ff5b37] hover:text-[#111]"
              >
                <span>{importing ? "Importing…" : "Convert to Makemylink"}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </Card>
        </Reveal>

        {/* Pay your way */}
        <Reveal className="md:col-span-2" delay={0.12}>
          <Card className="h-full">
            <h3 className="text-[22px] font-semibold">Pay your way</h3>
            <p className="mt-2 text-fg/55">Get paid with UPI in India, and cards or wallets everywhere else.</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["UPI", "Cards", "Apple Pay", "Google Pay", "Netbanking", "₹ INR", "$ USD"].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedCurrency(c)}
                  className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition cursor-pointer ${
                    selectedCurrency === c
                      ? "border border-[#ff5b37] bg-[#ff5b37]/10 text-fg font-semibold"
                      : "border border-fg/15 text-fg/75 hover:border-fg/40"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <p className="mt-4 text-[12px] text-fg/45">
              {selectedCurrency}: no platform commission on Pro. The payment company charges its own small fee.
            </p>
          </Card>
        </Reveal>

        {/* See what works */}
        <Reveal className="md:col-span-3" delay={0.04}>
          <Card className="h-full">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-[22px] font-semibold">See what works</h3>
                <p className="mt-2 text-fg/55">How many people visit, what they tap, and where they come from.</p>
              </div>
              {activeBar !== null && (
                <div className="rounded-xl border border-fg/10 bg-fg/[0.04] px-3 py-1 text-right">
                  <p className="text-[14px] font-bold text-fg">{statsData[activeBar].visitors} views</p>
                  <p className="text-[10px] text-fg/50">{statsData[activeBar].label}</p>
                </div>
              )}
            </div>
            <div className="mt-8 flex h-28 items-end gap-2">
              {[30, 52, 41, 68, 57, 84, 72, 96, 88, 64, 78, 100].map((h, i) => (
                <motion.button
                  key={i}
                  type="button"
                  onMouseEnter={() => setActiveBar(i)}
                  onClick={() => setActiveBar(i)}
                  initial={{ height: 0 }}
                  whileInView={{ height: `${h}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.9, delay: i * 0.05, ease: [0.2, 0.7, 0.2, 1] }}
                  className={`flex-1 rounded-t-md transition-all cursor-pointer ${
                    activeBar === i
                      ? "bg-[#ff5b37] shadow-[0_0_12px_rgba(255,91,55,0.4)]"
                      : "bg-gradient-to-t from-[#c9b8ff]/30 to-[#c9b8ff] hover:brightness-110"
                  }`}
                />
              ))}
            </div>
          </Card>
        </Reveal>

        {/* Paid 1:1 bookings */}
        <Reveal className="md:col-span-3" delay={0.08}>
          <Card className="h-full">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-[22px] font-semibold">Paid 1:1 bookings</h3>
                <p className="mt-2 text-fg/55">Followers pick a time and pay you directly. You keep 100%, with no commission.</p>
              </div>
              <Link href="/create" className="hidden shrink-0 items-center gap-1 text-[12px] font-semibold text-fg/70 hover:text-fg sm:inline-flex">
                Add a booking card <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="mt-6 rounded-2xl border border-fg/10 bg-bg/40 p-4">
              <div className="flex items-center justify-between text-[14px] font-semibold">
                <span>Career call · 30 min</span>
                <span>₹999</span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-[12px]">
                {["10:00", "10:30", "11:00", "14:00", "14:30", "16:00"].map((t, i) => (
                  <span key={t} className={`rounded-lg border py-1.5 text-center ${i === 1 ? "border-[#ff5b37] bg-[#ff5b37]/10 font-semibold" : "border-fg/15 text-fg/65"}`}>{t}</span>
                ))}
              </div>
              <p className="mt-3 text-[11px] text-fg/45">Paid by UPI. The meeting link is emailed after you confirm.</p>
            </div>
          </Card>
        </Reveal>

        {/* A QR code, built in */}
        <Reveal className="md:col-span-3" delay={0.04}>
          <Card className="h-full">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-[22px] font-semibold">A QR code, built in</h3>
                <p className="mt-2 text-fg/55">Every page gets one automatically — print it on a menu, a flyer or a business card.</p>
              </div>
            </div>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-6">
              <div className="rounded-2xl border border-fg/10 bg-white p-3 shadow-md">
                <QRCodeCanvas text={`${SITE_URL}/aria`} size={100} />
              </div>
              <div className="flex flex-col gap-2 text-center sm:text-left">
                <p className="text-[13px] font-semibold text-fg">{SITE_HOST}/aria</p>
                <p className="text-[11px] text-fg/50">Point phone camera to test instant bio scan</p>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(`${SITE_URL}/aria`);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className="mt-1 inline-flex items-center justify-center gap-1.5 rounded-full border border-fg/15 bg-fg/[0.04] px-4 py-1.5 text-[12px] font-medium text-fg hover:border-fg/35 transition cursor-pointer"
                >
                  {copiedLink ? "Copied to clipboard ✓" : "Copy link"}
                </button>
              </div>
            </div>
          </Card>
        </Reveal>

        {/* Group links into folders */}
        <Reveal className="md:col-span-3" delay={0.08}>
          <Card className="h-full">
            <h3 className="text-[22px] font-semibold">Group links into folders</h3>
            <p className="mt-2 text-fg/55">Long list of links? Tuck related ones under a heading that opens with a tap.</p>
            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setFolderOpen((prev) => !prev)}
                className="flex items-center justify-between rounded-xl border border-fg/15 bg-bg/60 px-4 py-3 text-[14px] font-medium text-fg hover:border-fg/30 transition text-left cursor-pointer"
              >
                <span>Shop my picks</span>
                <ChevronDown className={`h-4 w-4 text-fg/50 transition-transform duration-200 ${folderOpen ? "rotate-180" : ""}`} />
              </button>
              {folderOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="ml-4 flex flex-col gap-2 text-[13px]"
                >
                  <a
                    href="https://ltk.com"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-lg border border-fg/10 bg-bg/30 px-3.5 py-2 text-fg/75 hover:border-fg/30 hover:text-fg transition"
                  >
                    <span>LTK shop</span>
                    <ArrowUpRight className="h-3.5 w-3.5 opacity-50" />
                  </a>
                  <a
                    href="https://amazon.com"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-lg border border-fg/10 bg-bg/30 px-3.5 py-2 text-fg/75 hover:border-fg/30 hover:text-fg transition"
                  >
                    <span>Amazon storefront</span>
                    <ArrowUpRight className="h-3.5 w-3.5 opacity-50" />
                  </a>
                </motion.div>
              )}
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
    ["Paid plan from", "$8 · ₹299", "$8", "$29", "~$10"],
    ["Fee on your sales", <b key="f" className="text-[#ff5b37]">0% on Pro</b>, "Up to 12%*", "0%", "Up to 9%*"],
    ["UPI & rupee pricing", yes, no, no, no],
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
                <th className="bg-fg/[0.06] p-5 text-center font-display text-[22px] italic text-fg">Makemylink</th>
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
  ["Who is Makemylink for?", "People who earn from their audience: creators, mentors, coaches, consultants, photographers, stylists and small shops. If you want followers to book, buy or subscribe, it is for you."],
  ["How do paid bookings work?", "On Pro you add a booking card with your days, hours and price. A follower picks a time and pays your UPI ID (or your own payment link for dollars). You confirm payment and they get your meeting link by email. We take no cut."],
  ["Why is the price different in India?", "We set prices for each country so they're fair. In India you pay in rupees with UPI, cards or netbanking. Everywhere else you pay in US dollars."],
  ["Do you take a cut of my sales?", "No. Zero commission on bookings and sales. If a payment company is involved it charges its own normal fee."],
  ["Can I move from Linktree?", "Yes. Paste your Linktree link and we copy your links and socials over."],
  ["Is the free plan really free?", "Yes, forever, with no card. Free includes 10 themes, 8 links and a Makemylink badge. Pro is a prepaid month or year with no auto-renewal. If it ends, your page stays online with Free limits."],
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
            <h2 className="mx-auto max-w-[16ch] font-display text-[clamp(44px,7vw,100px)] leading-[0.92]">Turn your bio into a business.</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                router.push(`/create${handle ? `?handle=${encodeURIComponent(handle.replace(/^@/, ""))}` : ""}`);
              }}
              className="mx-auto mt-10 flex max-w-md items-center gap-2 rounded-xl bg-white p-2 shadow-[0_8px_24px_-8px_rgba(0,0,0,.3)]"
            >
              <span className="pl-4 text-[#141414]/40">{SITE_HOST}/</span>
              <input
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="yourname"
                aria-label="Your handle"
                className="min-w-0 flex-1 bg-transparent py-2 text-[16px] text-[#141414] outline-none placeholder:text-[#141414]/35"
              />
              <button className="rounded-lg bg-[#141414] px-5 py-3 text-[14px] font-semibold text-white">Start free</button>
            </form>
            <p className="mt-4 text-[13px] text-[#141414]/70">Free forever. No card needed.</p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

export function Footer() {
  const link = "hover:text-fg";
  return (
    <footer className="mx-auto max-w-6xl border-t border-fg/10 px-4 py-10 text-[13px] text-fg/45 sm:px-6">
      <div className="flex flex-col items-center justify-between gap-6 sm:flex-row sm:items-start">
        <Logo />
        <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-center sm:grid-cols-3 sm:text-left">
          <a href="#themes" className={link}>Themes</a>
          <a href="#pricing" className={link}>Pricing</a>
          <Link href="/blog" className={link}>Blog</Link>
          <Link href="/create" className={link}>Create</Link>
          <Link href="/contact" className={link}>Contact</Link>
          <Link href="/terms" className={link}>Terms</Link>
          <Link href="/privacy" className={link}>Privacy</Link>
          <Link href="/refund" className={link}>Refunds</Link>
          <Link href="/cookies" className={link}>Cookies</Link>
        </div>
      </div>
      <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-fg/10 pt-6 text-[12px] sm:flex-row">
        <p>© {new Date().getFullYear()} Makemylink. The link in bio built to earn.</p>
        <p>Made by {OPERATOR.names} · {OPERATOR.place}</p>
      </div>
    </footer>
  );
}
