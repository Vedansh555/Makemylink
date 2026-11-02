"use client";

import { SITE_URL, SITE_HOST } from "@/lib/site";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { motion } from "motion/react";
import { ArrowUpRight, ChevronDown, MapPin, QrCode, X } from "lucide-react";
import type { BioLink, Profile } from "@/lib/types";
import { linkIsLive, type PlanId } from "@/lib/plans";
import { BookingModal, bookingPrice } from "./BookingModal";
import { fontClass, getTheme, type ResolvedTheme, type ThemeTokens } from "@/lib/themes";
import { LookArt } from "./LookArt";
import { safeHref } from "@/lib/security";
import { SocialIcon, socialUrl, type SocialKey } from "./SocialIcon";
import { Tilt } from "../ui/Tilt";
import { QRCodeCanvas } from "../ui/QRCodeCanvas";

const ChromeScene = dynamic(() => import("../three/ChromeScene"), { ssr: false });

const rise = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: 0.06 * i, duration: 0.6, ease: [0.2, 0.7, 0.2, 1] as const } }),
};

function Background({ theme }: { theme: ResolvedTheme }) {
  const { def } = theme;
  switch (def.family) {
    case "chrome":
      return (
        <>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,color-mix(in_srgb,var(--c2)_30%,transparent),transparent_60%)]" />
          <div className="pointer-events-none absolute inset-x-0 top-2 h-[210px]">
            <ChromeScene color={def.blob} />
          </div>
        </>
      );
    case "glass":
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="mesh-blob absolute -left-24 -top-24 h-80 w-80 rounded-full bg-t-accent opacity-60 blur-3xl" />
          <div className="mesh-blob absolute -right-20 top-40 h-96 w-96 rounded-full bg-t-accent2 opacity-60 blur-3xl [animation-delay:-5s]" />
          <div className="mesh-blob absolute -bottom-24 left-10 h-96 w-96 rounded-full bg-t-accent opacity-40 blur-3xl [animation-delay:-10s]" />
        </div>
      );
    case "mono":
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-6 top-24 select-none font-grotesk text-[150px] font-bold uppercase leading-none tracking-tighter text-transparent [-webkit-text-stroke:1px_color-mix(in_srgb,var(--t-fg)_14%,transparent)] [writing-mode:vertical-rl]">
            {def.label.split(" ")[0]}
          </div>
        </div>
      );
    case "pop":
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(var(--t-accent)_1.2px,transparent_1.2px)] opacity-30 [background-size:18px_18px]" />
          {[
            "left-6 top-10 text-t-accent2 text-4xl rotate-12",
            "right-8 top-28 text-t-accent text-3xl -rotate-12",
            "left-10 top-[46%] text-t-accent2 text-2xl",
            "right-6 bottom-40 text-t-accent text-5xl rotate-6",
          ].map((c, i) => (
            <span key={i} className={`absolute [animation:float_5s_ease-in-out_infinite] [-webkit-text-stroke:2px_var(--t-fg)] ${c}`} style={{ animationDelay: `${i * -1.3}s` }}>
              •
            </span>
          ))}
        </div>
      );
    case "gradient":
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="mesh-blob absolute -left-32 -top-32 h-[520px] w-[520px] rounded-full bg-t-accent blur-[90px]" />
          <div className="mesh-blob absolute -right-40 top-60 h-[560px] w-[560px] rounded-full bg-t-accent2 blur-[90px] [animation-delay:-6s]" />
          <div className="mesh-blob absolute -bottom-40 left-0 h-[480px] w-[480px] rounded-full bg-t-accent opacity-70 blur-[90px] [animation-delay:-11s]" />
          <div className="absolute inset-0 bg-t-bg/25" />
        </div>
      );
    case "neon":
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(color-mix(in_srgb,var(--t-accent)_10%,transparent)_1px,transparent_1px),linear-gradient(90deg,color-mix(in_srgb,var(--t-accent)_10%,transparent)_1px,transparent_1px)] [background-size:32px_32px] [mask-image:linear-gradient(to_bottom,black,transparent_70%)]" />
          <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-t-accent opacity-25 blur-[80px]" />
          <div className="absolute -right-20 bottom-20 h-72 w-72 rounded-full bg-t-accent2 opacity-20 blur-[80px]" />
        </div>
      );
    case "minimal":
      return null;
    case "brutalist":
    case "duotone":
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.07]">
          <div className="absolute inset-0 bg-[linear-gradient(var(--t-fg)_2px,transparent_2px),linear-gradient(90deg,var(--t-fg)_2px,transparent_2px)] [background-size:28px_28px]" />
        </div>
      );
    case "luxury":
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-t-accent/10 to-transparent" />
          <div className="absolute -right-20 top-32 h-64 w-64 rounded-full bg-t-accent/5 blur-3xl" />
        </div>
      );
    case "ticket":
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(var(--t-fg)_1.4px,transparent_1.4px)] [background-size:16px_16px]" />
        </div>
      );
    case "terminal":
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,color-mix(in_srgb,var(--t-accent)_6%,transparent)_0px,transparent_1px,transparent_3px)]" />
        </div>
      );
    case "deco":
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-t-accent/10 blur-3xl" />
          <div className="absolute -right-20 bottom-20 h-72 w-72 rounded-full bg-t-accent/10 blur-3xl" />
        </div>
      );
    case "organic":
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="mesh-blob absolute -left-16 -top-16 h-72 w-72 rounded-[40%_60%_60%_40%/60%_40%_60%_40%] bg-t-accent opacity-25 blur-2xl" />
          <div className="mesh-blob absolute -right-16 top-52 h-80 w-80 rounded-[60%_40%_40%_60%/40%_60%_40%_60%] bg-t-accent2 opacity-20 blur-2xl [animation-delay:-6s]" />
        </div>
      );
    case "handwritten":
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.06]">
          <div className="absolute inset-0 bg-[linear-gradient(var(--t-fg)_1px,transparent_1px)] [background-size:100%_32px]" />
        </div>
      );
    case "arch":
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 -top-20 h-96 w-96 -translate-x-1/2 rounded-full border border-t-accent/20 bg-t-accent/5 opacity-60 blur-sm" />
          <div className="absolute -bottom-16 left-1/2 h-72 w-[480px] -translate-x-1/2 rounded-t-full border-t border-t-accent/15 bg-t-accent/5" />
        </div>
      );
    case "bakes":
      return (
        <>
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/50 via-transparent to-transparent" />
          </div>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[380px]">
            <ChromeScene variant="bakes" color="#fef8ea" accentColor={def.accent} />
          </div>
        </>
      );
    case "clay":
      return (
        <>
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-t-accent opacity-15 blur-3xl" />
            <div className="absolute -left-20 bottom-32 h-80 w-80 rounded-full bg-t-accent2 opacity-20 blur-3xl" />
          </div>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[360px]">
            <ChromeScene variant="clay" color={def.bg} accentColor={def.accent} />
          </div>
        </>
      );
    case "lavender":
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-t-accent/10 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_color-mix(in_srgb,var(--t-accent)_8%,transparent)_0%,_transparent_60%)]" />
        </div>
      );
    default:
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_color-mix(in_srgb,var(--t-accent)_8%,transparent),transparent_70%)]" />
        </div>
      );
  }
}

function Avatar({ profile, t, font }: { profile: Profile; t: ThemeTokens; font: string }) {
  const initials = profile.name
    .replace(/[^\p{L}\s]/gu, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
  if (profile.avatar) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={profile.avatar} alt={profile.name} className={`${t.avatar} object-cover`} />;
  }
  return <div className={`${t.avatar} ${t.monogram} ${font} grid place-items-center text-[28px]`}>{initials || "•"}</div>;
}

function Subscribe({ t, handle, live }: { t: ThemeTokens; handle: string; live: boolean }) {
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  if (done) return <p className={t.bio}>You&apos;re on the list ✓</p>;
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        const email = new FormData(e.currentTarget).get("email") as string;
        if (!live) return setDone(true); // editor preview: nothing is stored
        const res = await fetch("/api/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ handle, email }) });
        if (res.ok) setDone(true);
        else setErr((await res.json().catch(() => ({}))).error ?? "Something went wrong");
      }}
    >
      <div className="flex items-center gap-2">
        <input name="email" type="email" required placeholder="your@email.com" className={t.input} aria-label="Email address" />
        <button className={`${t.button} shrink-0`}>Join</button>
      </div>
      {err && <p className={t.bio}>{err}</p>}
    </form>
  );
}

function safeUrl(input?: string): string {
  return safeHref(input);
}

export function BioPage({ profile, embedded = false, plan = "pro", live = false }: { profile: Profile; embedded?: boolean; plan?: PlanId; live?: boolean }) {
  const [qrOpen, setQrOpen] = useState(false);
  const [booking, setBooking] = useState<BioLink | null>(null);
  const showBadge = plan !== "pro" || !profile.hideBadge;
  const visibleLinks = profile.links.filter((l) => linkIsLive(l));
  const track = (id: string) => {
    if (!live) return;
    try {
      navigator.sendBeacon("/api/track", new Blob([JSON.stringify({ handle: profile.handle, target: id })], { type: "application/json" }));
    } catch {}
  };
  const theme = getTheme(profile.theme);
  const t = theme.tokens;
  const family = theme.def.family;
  const nameFont = profile.fontOverride ? fontClass[profile.fontOverride as keyof typeof fontClass] ?? theme.nameFont : theme.nameFont;
  const socials = (Object.entries(profile.socials) as [SocialKey, string | undefined][]).filter(([, v]) => v);
  const { centered, numbered } = theme.family;
  let i = 0;

  return (
    <div
      // Phone mockups are for looking at: scroll and hover work, but links, buttons and forms do nothing.
      onClickCapture={embedded ? (e) => { if ((e.target as HTMLElement).closest("a, button, input, textarea")) e.preventDefault(); } : undefined}
      onSubmitCapture={embedded ? (e) => e.preventDefault() : undefined}
      style={profile.accentOverride ? { ...theme.style, "--t-accent": profile.accentOverride } as React.CSSProperties : theme.style}
      className={`relative isolate overflow-hidden ${family === "mono" ? "grain" : ""} ${t.root} ${embedded ? "min-h-full" : "min-h-screen"}`}
    >
      <Background theme={theme} />

      <motion.main
        initial="hidden"
        animate="show"
        className={`relative z-10 mx-auto flex w-full max-w-[480px] flex-col gap-9 px-5 pb-10 ${family === "chrome" ? "pt-24" : "pt-12"}`}
      >
        {/* Cover photo — a real photo behind the header, the one thing every real creator page has that a generated theme can't fake. */}
        {profile.coverImage && (
          <div className="-mx-5 -mt-12 h-44 w-[calc(100%+2.5rem)] overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={profile.coverImage} alt="" className="h-full w-full object-cover" />
          </div>
        )}

        {/* Header */}
        <motion.header variants={rise} custom={i++} className={`flex flex-col gap-4 ${centered ? "items-center text-center" : ""}`}>
          {family === "editorial" && (
            <div className={`flex w-full items-center justify-between border-b border-t-fg/80 pb-2 ${t.meta}`}>
              <span>Nº 01</span>
              <span>The {profile.handle} edit</span>
              <span>{new Date().getFullYear()}</span>
            </div>
          )}
          <div className={`flex gap-5 ${centered ? "flex-col items-center" : "items-end"}`}>
            <Avatar profile={profile} t={t} font={nameFont} />
            {!centered && profile.location && (
              <span className={`${t.meta} mb-1 flex items-center gap-1`}>
                <MapPin className="h-3 w-3" /> {profile.location}
              </span>
            )}
          </div>
          <h1 className={`${t.name} ${nameFont}`}>{profile.name}</h1>
          <div className={`${t.meta} flex items-center gap-2`}>
            <span>@{profile.handle}</span>
            {centered && profile.location && (
              <>
                <span>·</span>
                <span>{profile.location}</span>
              </>
            )}
          </div>
          {profile.bio && <p className={`${t.bio} max-w-[36ch]`}>{profile.bio}</p>}
          {socials.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {socials.map(([k, v]) => (
                <a key={k} href={socialUrl[k](v!)} target="_blank" rel="noreferrer" className={t.social} aria-label={k}>
                  <SocialIcon name={k} className="h-[18px] w-[18px]" />
                </a>
              ))}
            </div>
          )}
        </motion.header>

        {/* Links — plain ones in order, folder links grouped under a collapsible heading. */}
        {visibleLinks.length > 0 && (
          <motion.section variants={rise} custom={i++} className={`grid grid-cols-2 ${family === "editorial" ? "" : "gap-3"}`}>
            {(() => {
              let idx = 0;
              const renderLink = (l: BioLink) => {
                const n = idx++;
                const inner = (
                  <>
                    {numbered && <span className="font-sans text-[10px] tracking-[0.2em] opacity-50">{String(n + 1).padStart(2, "0")}</span>}
                    <span className="flex-1 text-left">{l.title}</span>
                    <ArrowUpRight className="h-4 w-4 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </>
                );
                const href = safeUrl(l.url);
                // Bento sizes (Pro): 1x1 is half width, 2x1 / unset is a full row, 2x2 is a tall tile.
                const span = l.size === "1x1" ? "col-span-1" : "col-span-2";
                const tall = l.size === "2x2" ? "[&>a]:min-h-[170px] [&>a]:items-end" : l.size === "1x1" ? "[&>a]:min-h-[84px]" : "";
                if (l.kind === "booking" && l.booking) {
                  return (
                    <div key={l.id} className={`${span} ${tall}`}>
                      <button type="button" onClick={() => setBooking(l)} className={`${t.featured} w-full cursor-pointer`}>
                        <span className="flex-1 text-left">
                          {l.title}
                          <span className="mt-0.5 block text-[11px] font-normal uppercase tracking-[0.16em] opacity-60">
                            {l.booking.durationMin} min · {bookingPrice(l)}
                          </span>
                        </span>
                        <ArrowUpRight className="h-4 w-4 shrink-0" />
                      </button>
                    </div>
                  );
                }
                return l.featured ? (
                  <div key={l.id} className={`${span} ${tall}`}>
                    <Tilt max={6} className="rounded-2xl">
                      <a href={href} onClick={() => track(l.id)} target="_blank" rel="noreferrer" className={t.featured}>
                        {inner}
                      </a>
                    </Tilt>
                  </div>
                ) : (
                  <div key={l.id} className={`${span} ${tall} flex flex-col`}>
                    <a href={href} onClick={() => track(l.id)} target="_blank" rel="noreferrer" className={t.link}>
                      {inner}
                    </a>
                  </div>
                );
              };

              type Item = { kind: "link"; link: BioLink } | { kind: "folder"; name: string; links: BioLink[] };
              const items: Item[] = [];
              const byFolder = new Map<string, BioLink[]>();
              for (const l of visibleLinks) {
                if (l.folder) {
                  let group = byFolder.get(l.folder);
                  if (!group) {
                    group = [];
                    byFolder.set(l.folder, group);
                    items.push({ kind: "folder", name: l.folder, links: group });
                  }
                  group.push(l);
                } else {
                  items.push({ kind: "link", link: l });
                }
              }

              return items.map((item) =>
                item.kind === "link" ? (
                  renderLink(item.link)
                ) : (
                  <details key={item.name} className="group/folder col-span-2">
                    <summary className={`${t.link} cursor-pointer list-none`}>
                      <span className="flex-1 text-left">{item.name}</span>
                      <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open/folder:rotate-180" />
                    </summary>
                    <div className="mt-3 flex flex-col gap-3 pl-3">{item.links.map(renderLink)}</div>
                  </details>
                ),
              );
            })()}
          </motion.section>
        )}

        {/* Shop my looks */}
        {profile.looks.length > 0 && (
          <motion.section variants={rise} custom={i++} className="flex flex-col gap-4">
            <div className="flex items-baseline justify-between">
              <h2 className={t.section + " flex-1"}>{profile.shopTitle || "Shop"}</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {profile.looks.map((look) => (
                <Tilt key={look.id} max={9} className="h-full">
                  <a href={safeUrl(look.url)} target="_blank" rel="noreferrer" className={`group block h-full ${t.lookCard}`}>
                    <div className="relative aspect-[4/5] overflow-hidden">
                      {look.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={look.image} alt={look.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      ) : (
                        <div className="h-full w-full transition-transform duration-700 group-hover:scale-105">
                          <LookArt kind={look.art} hue={look.hue} mono={theme.def.mono} />
                        </div>
                      )}
                      <span className={`absolute left-2 top-2 ${t.tag}`}>{look.store}</span>
                    </div>
                    <div className="flex items-end justify-between gap-2 p-3">
                      <div className="min-w-0">
                        <p className={`${t.lookTitle} truncate`}>{look.title}</p>
                        <p className={t.lookMeta}>{look.price}</p>
                      </div>
                      <ArrowUpRight className="h-4 w-4 shrink-0 opacity-60" />
                    </div>
                  </a>
                </Tilt>
              ))}
            </div>
          </motion.section>
        )}

        {/* Media kit */}
        {profile.showMediaKit && profile.mediaKit && (
          <motion.section variants={rise} custom={i++} className="flex flex-col gap-4">
            <h2 className={t.section}>Media kit</h2>
            <div className="grid grid-cols-3 gap-2">
              {[
                ["Followers", profile.mediaKit.followers],
                ["Engagement", profile.mediaKit.engagement],
                ["Avg views", profile.mediaKit.avgViews],
              ].map(([label, value]) => (
                <div key={label} className={t.stat}>
                  <div className={t.statValue}>{value}</div>
                  <div className={`${t.meta} mt-2 !tracking-[0.15em]`}>{label}</div>
                </div>
              ))}
            </div>
            {profile.mediaKit.audience && <p className={`${t.bio} !text-[14px]`}>Audience: {profile.mediaKit.audience}</p>}
            {profile.mediaKit.brands.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className={`${t.meta} self-center`}>Worked with</span>
                {profile.mediaKit.brands.map((b) => (
                  <span key={b} className={t.chip}>
                    {b}
                  </span>
                ))}
              </div>
            )}
            {profile.socials.email && (
              <a href={`mailto:${profile.socials.email}`} className={`${t.button} text-center`}>
                Work with me
              </a>
            )}
          </motion.section>
        )}

        {/* Subscribe */}
        {profile.showSubscribe && (
          <motion.section variants={rise} custom={i++} className="flex flex-col gap-3">
            <h2 className={t.section}>Join my list</h2>
            <Subscribe t={t} handle={profile.handle} live={live} />
          </motion.section>
        )}

        <motion.footer variants={rise} custom={i++} className="pt-4 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => setQrOpen(true)}
            className={`${t.badge} inline-flex items-center gap-2 rounded-full border border-t-fg/15 bg-t-fg/[0.04] px-4 py-1.5 text-[11px] uppercase tracking-[0.2em] transition hover:border-t-fg/40 hover:bg-t-fg/10 cursor-pointer`}
          >
            <QrCode className="h-3.5 w-3.5" />
            <span>Show QR code</span>
          </button>
          {showBadge && (
            <Link href={`/?ref=${encodeURIComponent(profile.handle)}`} className={`${t.badge} inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.25em] hover:opacity-100`}>
              ✦ Made with <span className="font-display text-[15px] normal-case italic tracking-normal">Makemylink</span> · Get yours →
            </Link>
          )}
        </motion.footer>
      </motion.main>

      {booking && <BookingModal link={booking} handle={profile.handle} live={live} onClose={() => setBooking(null)} />}

      {/* Interactive QR Code Modal */}
      {qrOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setQrOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-xs rounded-3xl border border-white/15 bg-[#141518] p-6 text-center text-white shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setQrOpen(false)}
              className="absolute right-4 top-4 rounded-full p-1 text-white/50 hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="mx-auto rounded-2xl bg-white p-3.5 shadow-inner inline-block">
              <QRCodeCanvas text={`${SITE_URL}/${profile.handle}`} size={160} />
            </div>
            <p className="mt-4 text-[16px] font-bold">@{profile.handle}</p>
            <p className="mt-1 text-[12px] text-white/50">{SITE_HOST}/{profile.handle}</p>
            <p className="mt-3 text-[11px] text-white/40">Point your phone camera to scan</p>
          </div>
        </div>
      )}
    </div>
  );
}
