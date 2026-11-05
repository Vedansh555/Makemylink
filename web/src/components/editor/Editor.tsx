"use client";

import { SITE_URL, SITE_HOST } from "@/lib/site";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  Eye,
  ImagePlus,
  Link as LinkIcon,
  Palette,
  Pencil,
  Plus,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { blankProfile, demoProfiles } from "@/lib/demo";
import { loadDraft, readImage, saveDraft, storeImage, uid } from "@/lib/draft";
import { getTheme, themeList } from "@/lib/themes";

const fontOptions: [string, string][] = [
  ["bodoni", "Bodoni (editorial serif)"],
  ["display", "Instrument (soft italic)"],
  ["syne", "Syne (bold geometric)"],
  ["unbounded", "Unbounded (rounded display)"],
  ["grotesk", "Space Grotesk (mono-ish)"],
  ["sans", "Inter (plain sans)"],
];
import type { ArtKind, BioLink, BlockSize, BookingConfig, Look, Profile, Store } from "@/lib/types";
import { FREE_LIMITS, isFreeTheme, type PlanId } from "@/lib/plans";
import { isBlankProfile, isGoal, starterFor } from "@/lib/templates";
import { detectRegion, formatPrice } from "@/lib/pricing";
import { LookArt } from "../bio/LookArt";
import { ThemePicker } from "../bio/ThemePicker";
import { Logo } from "../landing/Nav";
import { PhoneFrame } from "../landing/PhoneFrame";
import { QRCodeCanvas } from "../ui/QRCodeCanvas";

const stores: Store[] = ["LTK", "ShopMy", "Amazon", "Myntra", "Nykaa", "Own store"];
const arts: ArtKind[] = ["dress", "jacket", "bag", "heel", "sneaker", "shades", "lipstick", "ring", "vinyl", "cup", "camera", "book"];

const inputCls =
  "w-full rounded-xl border border-fg/10 bg-fg/[0.04] px-3.5 py-2.5 text-[14px] text-fg outline-none transition placeholder:text-fg/30 focus:border-fg/35 focus:bg-fg/[0.07]";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] uppercase tracking-[0.18em] text-fg/45">{label}</span>
      {children}
    </label>
  );
}

function Panel({ title, children, action, hint }: { title: string; children: React.ReactNode; action?: React.ReactNode; hint?: string }) {
  return (
    <section className="rounded-2xl sm:rounded-3xl border border-fg/10 bg-fg/[0.025] p-4 sm:p-6 shadow-sm">
      <div className={`${hint ? "mb-2" : "mb-4 sm:mb-5"} flex items-center justify-between`}>
        <h2 className="font-display text-[22px] sm:text-[26px] italic leading-none">{title}</h2>
        {action}
      </div>
      {hint && <p className="mb-4 text-[13px] leading-snug text-fg/50 sm:mb-5">{hint}</p>}
      <div className="flex flex-col gap-3.5 sm:gap-4">{children}</div>
    </section>
  );
}

function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" onClick={() => onChange(!on)} className="flex items-center justify-between gap-4 text-left text-[14px] text-fg/80">
      {label}
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? "bg-[#ff5b37]" : "bg-fg/15"}`}>
        <span className={`absolute top-1 h-4 w-4 rounded-full transition-all ${on ? "left-6 bg-bg" : "left-1 bg-fg"}`} />
      </span>
    </button>
  );
}

function ImagePick({ onPick, children, className = "" }: { onPick: (dataUrl: string) => void; children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <button type="button" onClick={() => ref.current?.click()} className={className}>
        {children}
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (f) onPick(await storeImage(await readImage(f)));
          e.target.value = "";
        }}
      />
    </>
  );
}

const toLocalInput = (ms?: number) => {
  if (!ms) return "";
  const d = new Date(ms - new Date(ms).getTimezoneOffset() * 60_000);
  return d.toISOString().slice(0, 16);
};
const fromLocalInput = (v: string) => (v ? new Date(v).getTime() : undefined);

const newBooking = (): BioLink => ({
  id: uid(),
  title: "Book a 1:1 call",
  url: "",
  kind: "booking",
  booking: {
    price: 999,
    currency: "INR",
    durationMin: 30,
    meetingUrl: "https://meet.google.com/",
    days: [1, 2, 3, 4, 5],
    startHour: 10,
    endHour: 18,
    timeZone: typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "Asia/Kolkata",
  },
});

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function BookingFields({ b, onChange }: { b: BookingConfig; onChange: (b: BookingConfig) => void }) {
  const up = (patch: Partial<BookingConfig>) => onChange({ ...b, ...patch });
  return (
    <div className="grid gap-2 rounded-xl border border-fg/10 bg-fg/[0.03] p-3 sm:grid-cols-2">
      <Field label="Price (0 = free)">
        <div className="flex gap-2">
          <select className={`${inputCls} !w-24`} value={b.currency} onChange={(e) => up({ currency: e.target.value as "INR" | "USD" })}>
            <option className="bg-bg" value="INR">₹ INR</option>
            <option className="bg-bg" value="USD">$ USD</option>
          </select>
          <input type="number" min={0} className={inputCls} value={b.price} onChange={(e) => up({ price: Math.max(0, Math.round(+e.target.value)) })} />
        </div>
      </Field>
      <Field label="Length (minutes)">
        <input type="number" min={10} max={240} step={5} className={inputCls} value={b.durationMin} onChange={(e) => up({ durationMin: +e.target.value })} />
      </Field>
      <Field label="Meeting link (sent after booking)">
        <input className={inputCls} value={b.meetingUrl} onChange={(e) => up({ meetingUrl: e.target.value })} placeholder="https://meet.google.com/…" />
      </Field>
      <Field label="Your UPI ID (Indian buyers pay you directly)">
        <input className={inputCls} value={b.upiId ?? ""} onChange={(e) => up({ upiId: e.target.value })} placeholder="name@okbank" />
      </Field>
      <Field label="Card / PayPal payment link (international buyers)">
        <input className={inputCls} value={b.paymentUrl ?? ""} onChange={(e) => up({ paymentUrl: e.target.value })} placeholder="https://buy.stripe.com/…" />
      </Field>
      <Field label="Days">
        <div className="flex gap-1">
          {DAY_LABELS.map((d, i) => (
            <button
              type="button"
              key={i}
              onClick={() => up({ days: b.days.includes(i) ? b.days.filter((x) => x !== i) : [...b.days, i] })}
              className={`h-9 w-9 rounded-lg text-[12px] font-semibold ${b.days.includes(i) ? "bg-fg text-bg" : "border border-fg/15 text-fg/60"}`}
            >
              {d}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Hours (24h) and time zone">
        <div className="flex gap-2">
          <input type="number" min={0} max={23} className={`${inputCls} !w-16`} value={b.startHour} onChange={(e) => up({ startHour: +e.target.value })} />
          <input type="number" min={1} max={24} className={`${inputCls} !w-16`} value={b.endHour} onChange={(e) => up({ endHour: +e.target.value })} />
          <input className={inputCls} value={b.timeZone} onChange={(e) => up({ timeZone: e.target.value })} />
        </div>
      </Field>
      <div className="sm:col-span-2">
        <Field label="Short description (optional)">
          <input className={inputCls} value={b.description ?? ""} maxLength={300} onChange={(e) => up({ description: e.target.value })} />
        </Field>
      </div>
    </div>
  );
}

export function Editor() {
  const params = useSearchParams();
  const [p, setP] = useState<Profile | null>(null);
  const [saved, setSaved] = useState<"saved" | "error" | null>(null);
  const [mobileView, setMobileView] = useState<"edit" | "preview">("edit");
  const [tab, setTab] = useState<"content" | "look">("content");
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [user, setUser] = useState<{ id: string; email: string; handle?: string; plan?: PlanId } | null>(null);
  const [notice, setNotice] = useState("");
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [openOpts, setOpenOpts] = useState<Set<string>>(new Set());
  const queryHandled = useRef(false);
  const [publishing, setPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [examplesOpen, setExamplesOpen] = useState(false);
  const examplesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (examplesRef.current && !examplesRef.current.contains(e.target as Node)) {
        setExamplesOpen(false);
      }
    }
    if (examplesOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [examplesOpen]);

  // Check auth and load profile from DB if logged in
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
          fetch("/api/page")
            .then((r) => (r.ok ? r.json() : null))
            .then((pageData) => {
              if (pageData?.profile) {
                const goal = new URLSearchParams(window.location.search).get("goal");
                const saved = pageData.profile as Profile;
                // A brand-new account holds an empty page; keep the starter the person chose instead of overwriting it with that.
                if (isGoal(goal) && !isBlankProfile(saved)) setNotice("You already have a page, so we opened it. A goal's starting page is only used for new pages.");
                setP(isGoal(goal) && isBlankProfile(saved) ? { ...starterFor(goal), handle: saved.handle, name: saved.name } : saved);
              }
            });
        }
      })
      .catch(() => {});
  }, []);

  // Load the draft once, on the client, or initialize with selected theme / handle
  useEffect(() => {
    const handle = params.get("handle");
    const themeParam = params.get("theme");
    const draft = loadDraft();

    const goal = params.get("goal");
    let initial: Profile;
    if (isGoal(goal) && (!draft || isBlankProfile(draft))) {
      const t = starterFor(goal);
      initial = handle ? { ...t, handle, name: handle.charAt(0).toUpperCase() + handle.slice(1) } : { ...t, handle: draft?.handle ?? t.handle };
    } else if (draft && !handle) {
      initial = { ...draft };
    } else {
      initial = handle
        ? { ...blankProfile, handle, name: handle.charAt(0).toUpperCase() + handle.slice(1) }
        : draft ?? { ...blankProfile };
    }

    if (themeParam) {
      initial.theme = themeParam;
    }

    setP((prev) => (themeParam ? { ...(prev ?? initial), theme: themeParam } : prev ?? initial));
  }, [params]);

  // Autosave locally.
  useEffect(() => {
    if (!p) return;
    const t = setTimeout(() => setSaved(saveDraft(p) ? "saved" : "error"), 400);
    return () => clearTimeout(t);
  }, [p]);

  const doPublish = async () => {
    if (!p) return;
    if (!user) {
      setPublishOpen(true);
      return;
    }
    setPublishing(true);
    setPublishSuccess(false);
    try {
      const res = await fetch("/api/page", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: p }),
      });
      if (res.ok) {
        setPublishSuccess(true);
        setPublishOpen(true);
      } else {
        alert("Failed to publish changes to your live page.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to publish changes.");
    } finally {
      setPublishing(false);
    }
  };

  // Deep links from the homepage: /create?focus=booking|shop|mediakit|links and /create?import=linktr.ee/name
  useEffect(() => {
    if (!p || queryHandled.current) return;
    queryHandled.current = true;
    const goal = params.get("goal");
    const focus = params.get("focus") ?? (goal === "booking" ? "booking" : goal === "products" ? "shop" : null);
    const imp = params.get("import");
    if (imp) importLinktree(imp);
    if (focus) {
      setTab("content");
      if (focus === "booking") {
        setPulse(true);
        setTimeout(() => setPulse(false), 8000);
      }
      setTimeout(() => document.getElementById(`section-${focus === "booking" ? "links" : focus}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p]);

  if (!p) return <div className="min-h-screen bg-bg" />;

  // What the visitor will actually see: Free limits applied, so the preview never promises what Free can't publish.
  const plan: PlanId = user?.plan ?? "free";
  const isPro = plan === "pro";
  const shown = p;
  // Free users can try Pro features in the preview. The publish step shows exactly what needs Pro.
  const proNote = (what: string) => setNotice(`${what} is a Pro feature. Try it now. When you publish, we will show what needs Pro.`);

  // What a Free page would lose at publish time, so the upgrade screen can list it.
  const lockedItems: string[] = [];
  const bookingCount = p.links.filter((l) => l.kind === "booking").length;
  if (bookingCount) lockedItems.push(`${bookingCount} paid booking card${bookingCount === 1 ? "" : "s"}`);
  if (p.links.some((l) => l.size)) lockedItems.push("Card sizes (half, full, tall)");
  if (!isFreeTheme(p.theme)) lockedItems.push("Your chosen theme");
  if (p.accentOverride || p.fontOverride) lockedItems.push("Custom colour or font");
  if (p.showMediaKit) lockedItems.push("Media kit");
  if (p.hideBadge) lockedItems.push("Hidden Showz badge");
  const plainLinks = p.links.filter((l) => l.kind !== "booking").length;
  if (plainLinks > FREE_LIMITS.links) lockedItems.push(`${plainLinks - FREE_LIMITS.links} links beyond the first ${FREE_LIMITS.links}`);
  if (p.looks.length > FREE_LIMITS.looks) lockedItems.push(`${p.looks.length - FREE_LIMITS.looks} products beyond the first ${FREE_LIMITS.looks}`);

  const handlePublish = () => {
    if (user && !isPro && lockedItems.length) return setUpgradeOpen(true);
    return doPublish();
  };

  async function importLinktree(from: string = importUrl) {
    setImporting(true);
    setNotice("");
    const res = await fetch("/api/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: from }) });
    const d = await res.json().catch(() => ({}));
    setImporting(false);
    if (!res.ok) return setNotice(d.error ?? "Import failed");
    setP((cur) => {
      if (!cur) return cur;
      // Starter placeholders ("Your Name", "yourname", the empty sample link) give way to the imported values.
      const isDefaultName = !cur.name || cur.name === blankProfile.name || cur.name.toLowerCase() === cur.handle.toLowerCase();
      const realSocials = Object.fromEntries(Object.entries(cur.socials).filter(([k, v]) => v && v !== (blankProfile.socials as Record<string, string | undefined>)[k]));
      const realLinks = cur.links.filter((l) => l.url.trim() && l.url.trim() !== "https://");
      return {
        ...cur,
        name: isDefaultName ? d.name : cur.name,
        bio: cur.bio && cur.bio !== blankProfile.bio ? cur.bio : d.bio || cur.bio,
        avatar: cur.avatar || d.avatar,
        socials: { ...d.socials, ...realSocials },
        links: [...realLinks, ...d.links.map((l: BioLink) => ({ ...l, id: uid() }))],
        looks: [...cur.looks, ...(d.looks ?? []).map((l: Look) => ({ ...l, id: uid() }))],
        shopTitle: cur.shopTitle || ((d.looks ?? []).length ? "Shop" : cur.shopTitle),
      };
    });
    const nLinks = d.links.length;
    const nShop = (d.looks ?? []).length;
    setNotice(
      `Copied ${d.avatar ? "your picture, " : ""}${nLinks} link${nLinks === 1 ? "" : "s"}${nShop ? `, ${nShop} shop item${nShop === 1 ? "" : "s"} with photos` : ""} and your social handles. ${d.source ? `${d.source}'s` : "That page's"} look can't be copied, so pick a style on the left.${!isPro && (nLinks > FREE_LIMITS.links || nShop > FREE_LIMITS.looks) ? ` Free pages show the first ${FREE_LIMITS.links} links and ${FREE_LIMITS.looks} products. The rest stay saved and appear on Pro.` : ""}`,
    );
    setImportUrl("");
  }

  const set = <K extends keyof Profile>(key: K, value: Profile[K]) => setP({ ...p, [key]: value });
  const setLink = (id: string, patch: Partial<BioLink>) => set("links", p.links.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  const setLook = (id: string, patch: Partial<Look>) => set("looks", p.looks.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  const move = <T,>(arr: T[], i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= arr.length) return arr;
    const next = [...arr];
    [next[i], next[j]] = [next[j]!, next[i]!];
    return next;
  };
  const kit = p.mediaKit ?? blankProfile.mediaKit!;

  return (
    <div className="min-h-screen bg-bg text-fg">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-fg/10 bg-bg/85 backdrop-blur-xl">
        <div className="mx-auto flex h-[57px] max-w-[1400px] items-center justify-between gap-3 px-4 sm:px-6">
          <Logo />
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden text-[12px] text-fg/40 sm:inline">
              {saved === "saved" ? "Saved on this device ✓" : saved === "error" ? "Couldn't save (storage full?)" : ""}
            </span>
            <Link href="/preview" target="_blank" className="hidden items-center gap-1.5 rounded-full border border-fg/15 px-4 py-2 text-[13px] text-fg/80 hover:border-fg/40 sm:flex">
              <Eye className="h-4 w-4" /> Full preview
            </Link>
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="hidden rounded-full bg-[#ff5b37] px-4 py-2 text-[13px] font-semibold text-[#111] hover:brightness-110 disabled:opacity-50 lg:block"
            >
              {publishing ? "Saving…" : "Publish"}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Sticky Bottom Floating Action Bar */}
      <div className="fixed bottom-4 inset-x-4 z-40 flex items-center justify-between gap-2.5 rounded-full border border-fg/15 bg-bg/95 p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl lg:hidden">
        <div className="flex rounded-full bg-fg/8 p-0.5 text-[13px]">
          <button
            type="button"
            onClick={() => {
              setMobileView("edit");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-medium transition ${
              mobileView === "edit" ? "bg-fg text-bg shadow-sm" : "text-fg/70 hover:text-fg"
            }`}
          >
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
          <button
            type="button"
            onClick={() => {
              setMobileView("preview");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-medium transition ${
              mobileView === "preview" ? "bg-fg text-bg shadow-sm" : "text-fg/70 hover:text-fg"
            }`}
          >
            <Eye className="h-3.5 w-3.5" /> Preview
          </button>
        </div>

        <button
          onClick={handlePublish}
          disabled={publishing}
          className="flex items-center gap-1 rounded-full bg-[#ff5b37] px-4 py-2 text-[13px] font-semibold text-[#111] shadow-md transition hover:brightness-110 disabled:opacity-50"
        >
          {publishing ? "Saving…" : "Publish"}
        </button>
      </div>

      <div className="mx-auto grid max-w-[1400px] grid-cols-[minmax(0,1fr)] gap-8 overflow-x-clip px-4 pb-28 pt-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:py-10">
        {/* Controls */}
        <div className={`flex min-w-0 flex-col gap-4 sm:gap-5 ${mobileView === "preview" ? "hidden lg:flex" : ""}`}>
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h1 className="font-display text-[34px] sm:text-[48px] italic leading-none">Your page</h1>
              <p className="mt-1.5 sm:mt-2 text-[13px] sm:text-[14px] text-fg/50">Changes show up in the phone right away.</p>
            </div>
            <div ref={examplesRef} className="relative min-w-0">
              <button
                type="button"
                onClick={() => setExamplesOpen((prev) => !prev)}
                className="flex w-full min-w-0 sm:w-72 items-center justify-between gap-3 rounded-2xl border border-fg/15 bg-fg/[0.04] px-4 py-2.5 text-[13px] font-semibold text-fg shadow-sm transition hover:border-fg/35 hover:bg-fg/[0.07] focus:outline-none"
              >
                <span className="truncate">Load a creator example</span>
                <ChevronDown className={`h-4 w-4 text-fg/40 transition-transform duration-200 ${examplesOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {examplesOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.98 }}
                    transition={{ duration: 0.16 }}
                    className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[380px] sm:left-auto sm:w-80 overflow-y-auto rounded-2xl border border-fg/12 bg-bg/95 p-2 shadow-2xl backdrop-blur-xl"
                  >
                    <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-fg/40">
                      Popular Creator Profiles
                    </div>
                    <div className="flex flex-col gap-1">
                      {demoProfiles.map((d) => {
                        const themeDef = getTheme(d.theme).def;
                        return (
                          <button
                            key={d.handle}
                            type="button"
                            onClick={() => {
                              setP(structuredClone(d));
                              setExamplesOpen(false);
                            }}
                            className="group flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-fg/5"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-[13px] font-semibold text-fg group-hover:text-[#ff5b37] transition-colors">
                                {d.name}
                              </p>
                              <p className="truncate text-[11px] text-fg/50">
                                @{d.handle} · {d.location || "Creator"}
                              </p>
                            </div>
                            <span className="shrink-0 rounded-full border border-fg/10 bg-fg/[0.03] px-2.5 py-0.5 text-[10px] font-medium text-fg/60">
                              {themeDef.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {p.links.length <= 3 && (
            <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-[#ff5b37]/40 bg-[#ff5b37]/[0.06] p-4 sm:flex-row sm:items-center">
              <div className="flex-1">
                <p className="text-[14px] font-semibold">Already have a link page?</p>
                <p className="text-[12px] text-fg/55">Paste its link (Linktree, Carrd, Solo.to, Hoo.be, Bio.site and more). We copy your picture, links, socials and shop items.</p>
              </div>
              <input className={`${inputCls} sm:!w-56`} value={importUrl} onChange={(e) => setImportUrl(e.target.value)} placeholder="Paste your page link" />
              <button disabled={!importUrl || importing} onClick={() => importLinktree()} className="rounded-xl bg-fg px-5 py-2.5 text-[13px] font-semibold text-bg disabled:opacity-40">
                {importing ? "Importing…" : "Import"}
              </button>
            </div>
          )}
          {/* Two clear places: what is on the page, and how it looks */}
          <div className="sticky top-[57px] z-30 -mx-4 bg-bg/90 px-4 py-2 backdrop-blur-xl sm:mx-0 sm:px-0">
            <div className="inline-flex w-full rounded-full border border-fg/10 bg-fg/5 p-1 sm:w-auto" role="tablist">
              {([["content", "Content", "Links, bookings, products", LinkIcon], ["look", "Look", "Themes and colours", Palette]] as const).map(([id, label, sub, Icon]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={tab === id}
                  onClick={() => {
                    setTab(id);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-full px-5 py-2 text-left transition sm:flex-none sm:px-6 ${tab === id ? "bg-fg text-bg shadow-sm" : "text-fg/65 hover:text-fg"}`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="leading-tight">
                    <span className="block text-[13px] font-semibold">{label}</span>
                    <span className="hidden text-[11px] opacity-60 sm:block">{sub}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Mobile: live preview pinned above the theme list so a style can be tapped and seen at once */}
          {tab === "look" && (
            <div className="sticky top-[107px] z-20 -mx-4 flex items-center gap-4 border-b border-fg/10 bg-bg/90 px-4 py-2 backdrop-blur-xl lg:hidden">
              <PhoneFrame profile={shown} plan={plan} scale={0.2} />
              <div className="min-w-0">
                <p className="truncate text-[14px] font-semibold">{getTheme(p.theme).def.label}</p>
                <p className="mt-0.5 text-[12px] text-fg/50">Tap a style below to try it.</p>
              </div>
            </div>
          )}

          {/* Theme Section */}
          <div className={tab === "look" ? "block" : "hidden"}>
            <Panel title="Theme" hint="Pick how your page looks. Your content stays exactly the same." action={<span className="text-[12px] text-fg/45">{themeList.length} styles</span>}>
              <ThemePicker value={p.theme} onChange={(id) => set("theme", id)} maxHeight="lg:max-h-[460px]" plan={plan} onLocked={(id) => { set("theme", id); proNote("This theme"); }} />
              {notice && <p className="text-[13px] text-[#ff5b37]">{notice}</p>}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-fg/10 pt-4">
                <div>
                  <p className="text-[13px] font-medium">Accent color</p>
                  <p className="mt-0.5 text-[12px] text-fg/50">Make this style&apos;s accent your own color.</p>
                </div>
                <div className="flex items-center gap-2">
                  {p.accentOverride && (
                    <button onClick={() => set("accentOverride", undefined)} className="text-[12px] text-fg/50 underline underline-offset-4">
                      Reset
                    </button>
                  )}
                  <input
                    type="color"
                    value={p.accentOverride ?? "#ff5b37"}
                    onChange={(e) => set("accentOverride", e.target.value)}
                    className="h-9 w-9 cursor-pointer rounded-full border border-fg/15 bg-transparent p-0.5"
                    aria-label="Accent color"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-3 border-t border-fg/10 pt-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div>
                  <p className="text-[13px] font-medium">Name font</p>
                  <p className="mt-0.5 text-[12px] text-fg/50">Swap the headline font this style uses.</p>
                </div>
                <select
                  className={`${inputCls} sm:!w-40`}
                  value={p.fontOverride ?? ""}
                  onChange={(e) => set("fontOverride", e.target.value || undefined)}
                >
                  <option value="">Theme default</option>
                  {fontOptions.map(([key, label]) => (
                    <option key={key} value={key} className="bg-bg">
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </Panel>
          </div>

          {/* Profile Section */}
          <div className={`${tab === "content" ? "block" : "hidden"} order-[4]`}>
            <Panel title="Profile" hint="Your name, photo and bio. This is the top of your page.">
              <div className="flex items-center gap-4">
                <ImagePick onPick={(v) => set("avatar", v)} className="group relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full border border-dashed border-fg/25 bg-fg/5 hover:border-fg/60">
                  {p.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.avatar} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <ImagePlus className="h-6 w-6 text-fg/50" />
                  )}
                </ImagePick>
                <div className="text-[13px] text-fg/50">
                  <p>Upload a profile photo.</p>
                  {p.avatar && (
                    <button onClick={() => set("avatar", undefined)} className="mt-1 text-fg/70 underline underline-offset-4">
                      Remove
                    </button>
                  )}
                </div>
              </div>
              <ImagePick
                onPick={(v) => set("coverImage", v)}
                className="group relative flex h-24 w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-fg/25 bg-fg/5 hover:border-fg/60"
              >
                {p.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.coverImage} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex items-center gap-2 text-[13px] text-fg/50">
                    <ImagePlus className="h-5 w-5" /> Upload a cover photo (optional)
                  </span>
                )}
              </ImagePick>
              {p.coverImage && (
                <button onClick={() => set("coverImage", undefined)} className="-mt-2 text-left text-[12px] text-fg/50 underline underline-offset-4">
                  Remove cover photo
                </button>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Name">
                  <input className={inputCls} value={p.name} onChange={(e) => set("name", e.target.value)} />
                </Field>
                <Field label="Handle">
                  <div className="flex items-center rounded-xl border border-fg/10 bg-fg/[0.04] pl-3.5 text-[14px] focus-within:border-fg/35">
                    <span className="text-fg/35">{SITE_HOST}/</span>
                    <input
                      className="min-w-0 flex-1 bg-transparent py-2.5 pr-3.5 outline-none"
                      value={p.handle}
                      onChange={(e) => set("handle", e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ""))}
                    />
                  </div>
                </Field>
              </div>
              <Field label="Bio">
                <textarea rows={2} className={`${inputCls} resize-none`} value={p.bio} onChange={(e) => set("bio", e.target.value)} maxLength={160} />
              </Field>
              <Field label="Location">
                <input className={inputCls} value={p.location ?? ""} onChange={(e) => set("location", e.target.value)} placeholder="Mumbai" />
              </Field>
            </Panel>
          </div>

          {/* Socials Section */}
          <div className={`${tab === "content" ? "block" : "hidden"} order-5`}>
            <Panel title="Socials" hint="Small icons under your bio that open your accounts.">
              <div className="grid gap-4 sm:grid-cols-2">
                {(["instagram", "tiktok", "youtube", "pinterest", "email"] as const).map((k) => (
                  <Field key={k} label={k}>
                    <input
                      className={inputCls}
                      value={p.socials[k] ?? ""}
                      placeholder={k === "email" ? "you@email.com" : "username"}
                      onChange={(e) => set("socials", { ...p.socials, [k]: e.target.value || undefined })}
                    />
                  </Field>
                ))}
              </div>
            </Panel>
          </div>

          {/* Links Section */}
          <div id="section-links" className={`${tab === "content" ? "block" : "hidden"} order-[1]`}>
            <Panel
              title="Links and bookings"
              hint="The buttons people tap. Add a booking card to get paid for calls. Open Layout and schedule on a card to make it half, full or tall."
              action={
                <div className="flex gap-2">
                  <button
                    onClick={() => { set("links", [...p.links, newBooking()]); if (!isPro) proNote("Paid bookings"); }}
                    className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-[12px] font-semibold ${pulse ? "animate-pulse border-[#ff5b37] bg-[#ff5b37]/15" : "border-fg/20"}`}
                  >
                    <Plus className="h-3.5 w-3.5" /> Booking{!isPro && " · Pro"}
                  </button>
                  <button
                    onClick={() => set("links", [...p.links, { id: uid(), title: "New link", url: "https://" }])}
                    className="flex items-center gap-1 rounded-full bg-fg px-3 py-1.5 text-[12px] font-semibold text-bg"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add link
                  </button>
                </div>
              }
            >
              <div className="flex gap-2">
                <input className={inputCls} value={importUrl} onChange={(e) => setImportUrl(e.target.value)} placeholder="Import your existing page: paste its link" />
                <button disabled={!importUrl || importing} onClick={() => importLinktree()} className="shrink-0 rounded-xl border border-fg/20 px-4 text-[13px] font-semibold disabled:opacity-40">
                  {importing ? "Importing…" : "Import"}
                </button>
              </div>
              {notice && <p className="text-[13px] text-[#ff5b37]">{notice}</p>}
              {!isPro && p.links.length > FREE_LIMITS.links && (
                <p className="text-[13px] text-fg/55">Free pages show the first {FREE_LIMITS.links} links. The rest are kept and appear when you go Pro.</p>
              )}
              {p.links.length === 0 && <p className="text-[14px] text-fg/40">No links yet.</p>}
              {p.links.map((l, i) => (
                <div key={l.id} className="flex flex-col gap-2 rounded-2xl border border-fg/10 bg-bg/20 p-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className={`grid flex-1 gap-2 ${l.kind === "booking" ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
                    <input className={inputCls} value={l.title} onChange={(e) => setLink(l.id, { title: e.target.value })} placeholder="Title" />
                    {l.kind !== "booking" && <input className={inputCls} value={l.url} onChange={(e) => setLink(l.id, { url: e.target.value })} placeholder="https://" />}
                    <input
                      className={inputCls}
                      value={l.folder ?? ""}
                      onChange={(e) => setLink(l.id, { folder: e.target.value || undefined })}
                      placeholder="Folder (optional)"
                    />
                  </div>
                  <div className="flex items-center gap-1 self-end sm:self-auto">
                    <IconBtn label="Highlight" active={l.featured} onClick={() => setLink(l.id, { featured: !l.featured })}>
                      <Star className="h-4 w-4" />
                    </IconBtn>
                    <IconBtn label="Move up" onClick={() => set("links", move(p.links, i, -1))}>
                      <ArrowUp className="h-4 w-4" />
                    </IconBtn>
                    <IconBtn label="Move down" onClick={() => set("links", move(p.links, i, 1))}>
                      <ArrowDown className="h-4 w-4" />
                    </IconBtn>
                    <IconBtn label="Delete" onClick={() => set("links", p.links.filter((x) => x.id !== l.id))}>
                      <Trash2 className="h-4 w-4" />
                    </IconBtn>
                  </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setOpenOpts((cur) => { const n = new Set(cur); if (n.has(l.id)) n.delete(l.id); else n.add(l.id); return n; })}
                    className="flex w-full items-center gap-2 text-left text-[12px] text-fg/55 transition hover:text-fg"
                    aria-expanded={openOpts.has(l.id)}
                  >
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${openOpts.has(l.id) ? "rotate-180" : ""}`} />
                    <span>Layout and schedule</span>
                    {l.size && l.size !== "2x1" && <span className="rounded-full bg-fg/10 px-2 py-0.5 text-[10px] text-fg/70">{l.size === "1x1" ? "Half width" : "Tall"}</span>}
                    {(l.startsAt || l.expiresAt) && <span className="rounded-full bg-[#ff5b37]/15 px-2 py-0.5 text-[10px] text-[#c8431f]">Scheduled</span>}
                  </button>
                  {openOpts.has(l.id) && (
                    <div className="grid gap-4 rounded-xl border border-fg/10 bg-fg/[0.03] p-3.5 sm:grid-cols-[auto_1fr] sm:items-start">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[11px] uppercase tracking-[0.18em] text-fg/45">Size{!isPro && " · Pro"}</span>
                        <div className="inline-flex rounded-lg border border-fg/10 bg-bg/40 p-0.5">
                          {([["1x1", "Half"], ["2x1", "Full"], ["2x2", "Tall"]] as [BlockSize, string][]).map(([v, label]) => (
                            <button
                              type="button"
                              key={v}
                              onClick={() => { setLink(l.id, { size: v }); if (!isPro && v !== "2x1") proNote("Card sizes"); }}
                              className={`rounded-md px-3.5 py-1.5 text-[12px] transition ${(l.size ?? "2x1") === v ? "bg-fg text-bg" : "text-fg/60 hover:text-fg"}`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Show from">
                          <input type="datetime-local" className={inputCls} value={toLocalInput(l.startsAt)} onChange={(e) => setLink(l.id, { startsAt: fromLocalInput(e.target.value) })} />
                        </Field>
                        <Field label="Hide after">
                          <input type="datetime-local" className={inputCls} value={toLocalInput(l.expiresAt)} onChange={(e) => setLink(l.id, { expiresAt: fromLocalInput(e.target.value) })} />
                        </Field>
                        <p className="text-[11px] text-fg/40 sm:col-span-2">Optional. Use it for a sale or a launch: the link appears and disappears by itself.</p>
                      </div>
                    </div>
                  )}

                  {l.kind === "booking" && l.booking && <BookingFields b={l.booking} onChange={(b) => setLink(l.id, { booking: b })} />}
                </div>
              ))}
            </Panel>
          </div>

          {/* Shop Section */}
          <div id="section-shop" className={`${tab === "content" ? "block" : "hidden"} order-[2]`}>
            <Panel
              title="Products"
              hint="A photo grid of things you sell or recommend. Each one opens its store link."
              action={
                <button
                  onClick={() =>
                    set("looks", [
                      ...p.looks,
                      { id: uid(), title: "New piece", price: "", store: "LTK", url: "https://", art: arts[p.looks.length % arts.length]!, hue: Math.floor(Math.random() * 360) },
                    ])
                  }
                  className="flex items-center gap-1 rounded-full bg-fg px-3 py-1.5 text-[12px] font-semibold text-bg"
                >
                  <Plus className="h-3.5 w-3.5" /> Add product
                </button>
              }
            >
              <Field label="Section title">
                <input className={inputCls} value={p.shopTitle ?? ""} placeholder="Shop, Merch, My faves…" onChange={(e) => set("shopTitle", e.target.value)} />
              </Field>
              {p.looks.length === 0 && <p className="text-[14px] text-fg/40">Add your own products, or affiliate links from Amazon, LTK, Myntra and more.</p>}
              {p.looks.map((look) => (
                <div key={look.id} className="flex flex-col gap-3 rounded-2xl border border-fg/10 bg-bg/20 p-3 sm:flex-row sm:gap-4">
                  <ImagePick onPick={(v) => setLook(look.id, { image: v })} className="group relative h-40 w-full shrink-0 overflow-hidden rounded-xl sm:h-28 sm:w-24">
                    {look.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={look.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <LookArt kind={look.art} hue={look.hue} />
                    )}
                    <span className="absolute inset-0 grid place-items-center bg-bg/50 opacity-0 transition group-hover:opacity-100">
                      <ImagePlus className="h-5 w-5" />
                    </span>
                  </ImagePick>
                  <div className="grid flex-1 gap-2 sm:grid-cols-2">
                    <input className={inputCls} value={look.title} onChange={(e) => setLook(look.id, { title: e.target.value })} placeholder="Product name" />
                    <input className={inputCls} value={look.price} onChange={(e) => setLook(look.id, { price: e.target.value })} placeholder="$49 or ₹999" />
                    <select className={inputCls} value={look.store} onChange={(e) => setLook(look.id, { store: e.target.value as Store })}>
                      {stores.map((s) => (
                        <option key={s} className="bg-bg">
                          {s}
                        </option>
                      ))}
                    </select>
                    <input className={inputCls} value={look.url} onChange={(e) => setLook(look.id, { url: e.target.value })} placeholder="Affiliate link" />
                    {!look.image ? (
                      <div className="flex items-center gap-2 sm:col-span-2">
                        <select className={`${inputCls} !w-32`} value={look.art} onChange={(e) => setLook(look.id, { art: e.target.value as ArtKind })}>
                          {arts.map((a) => (
                            <option key={a} className="bg-bg">
                              {a}
                            </option>
                          ))}
                        </select>
                        <div className="flex flex-1 flex-wrap items-center gap-2" role="radiogroup" aria-label="Colour">
                          {[8, 28, 48, 150, 185, 215, 262, 325].map((h) => {
                            const active = Math.abs(look.hue - h) < 14;
                            return (
                              <button
                                type="button"
                                key={h}
                                role="radio"
                                aria-checked={active}
                                aria-label={`Colour ${h}`}
                                onClick={() => setLook(look.id, { hue: h })}
                                style={{ background: `hsl(${h} 72% 62%)` }}
                                className={`h-7 w-7 rounded-full transition ${active ? "scale-110 ring-2 ring-fg ring-offset-2 ring-offset-bg" : "opacity-80 hover:opacity-100"}`}
                              />
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setLook(look.id, { image: undefined })} className="text-left text-[12px] text-fg/50 underline underline-offset-4 sm:col-span-2">
                        Remove photo
                      </button>
                    )}
                  </div>
                  <div className="self-end sm:self-start">
                    <IconBtn label="Delete" onClick={() => set("looks", p.looks.filter((x) => x.id !== look.id))}>
                      <Trash2 className="h-4 w-4" />
                    </IconBtn>
                  </div>
                </div>
              ))}
            </Panel>
          </div>

          {/* Media Kit Section */}
          <div id="section-mediakit" className={`${tab === "content" ? "block" : "hidden"} order-6`}>
            <Panel title="Media kit" hint="Your numbers for brands, with a Work with me button.">
              <Switch on={p.showMediaKit} onChange={(v) => { set("showMediaKit", v); if (v && !isPro) proNote("The media kit"); }} label={`Show media kit for brands${isPro ? "" : " (Pro)"}`} />
              {p.showMediaKit && (
                <>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field label="Followers">
                      <input className={inputCls} value={kit.followers} onChange={(e) => set("mediaKit", { ...kit, followers: e.target.value })} />
                    </Field>
                    <Field label="Engagement">
                      <input className={inputCls} value={kit.engagement} onChange={(e) => set("mediaKit", { ...kit, engagement: e.target.value })} />
                    </Field>
                    <Field label="Avg views">
                      <input className={inputCls} value={kit.avgViews} onChange={(e) => set("mediaKit", { ...kit, avgViews: e.target.value })} />
                    </Field>
                  </div>
                  <Field label="Audience">
                    <input className={inputCls} value={kit.audience} placeholder="80% women · 18–34 · IN, US" onChange={(e) => set("mediaKit", { ...kit, audience: e.target.value })} />
                  </Field>
                  <Field label="Brands you've worked with (comma separated)">
                    <input
                      className={inputCls}
                      value={kit.brands.join(", ")}
                      onChange={(e) => set("mediaKit", { ...kit, brands: e.target.value.split(",").map((b) => b.trim()).filter(Boolean) })}
                    />
                  </Field>
                </>
              )}
            </Panel>
          </div>

          {/* Audience Section */}
          <div className={`${tab === "content" ? "block" : "hidden"} order-[3]`}>
            <Panel title="Email list" hint="Shows a sign-up box so visitors can join your list. You see the emails in your dashboard.">
              <Switch on={p.showSubscribe} onChange={(v) => set("showSubscribe", v)} label="Collect emails (newsletter sign-up)" />
              <Switch on={!!p.hideBadge} onChange={(v) => { set("hideBadge", v); if (v && !isPro) proNote("Hiding the badge"); }} label={`Hide the Showz badge${isPro ? "" : " (Pro)"}`} />
              <p className="text-[12px] text-fg/40">
                Plan: <b>{isPro ? "Pro" : "Free"}</b> · <Link href="/dashboard" className="underline">Open dashboard</Link> for emails, bookings and stats
              </p>
            </Panel>
          </div>
        </div>

        {/* Live preview */}
        <div className={`${mobileView === "edit" ? "hidden lg:block" : "flex justify-center"}`}>
          <div className="sticky top-20 flex flex-col items-center gap-4">
            {/* Responsive scale: 0.62 on mobile screen so the entire phone frame fits in the viewport without cutoffs */}
            <div className="block lg:hidden">
              <PhoneFrame profile={shown} plan={plan} scale={0.62} />
            </div>
            <div className="hidden lg:block">
              <PhoneFrame profile={shown} plan={plan} scale={0.78} />
            </div>
            <p className="text-[12px] text-fg/40 font-medium">
              {SITE_HOST}/{p.handle}
            </p>
          </div>
        </div>
      </div>

      {upgradeOpen && (
        <div role="dialog" aria-modal="true" onClick={() => setUpgradeOpen(false)} className="fixed inset-0 z-[70] grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl border border-fg/10 bg-bg p-7 shadow-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#c8431f]">Pro features</p>
            <h3 className="mt-2 font-display text-[34px] italic leading-none">Your page uses Pro</h3>
            <p className="mt-3 text-[14px] text-fg/60">These are only live on Pro. On the free plan they are hidden, but they stay saved in your editor.</p>
            <ul className="mt-4 space-y-2 text-[14px]">
              {lockedItems.map((t) => (
                <li key={t} className="flex gap-2.5">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ff5b37]" />
                  {t}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-col gap-2.5">
              <Link href="/dashboard?tab=billing" className="rounded-xl bg-[#ff5b37] py-3.5 text-center text-[14px] font-semibold text-[#111] transition hover:brightness-110">
                Upgrade to Pro · {formatPrice(detectRegion() === "IN" ? 299 : 8, detectRegion())}/month, 0% commission
              </Link>
              <button
                onClick={() => {
                  setUpgradeOpen(false);
                  doPublish();
                }}
                className="rounded-xl border border-fg/20 py-3 text-[14px] font-medium transition hover:border-fg/50"
              >
                Publish the free version
              </button>
              <button onClick={() => setUpgradeOpen(false)} className="py-1 text-[13px] text-fg/55 underline underline-offset-4">
                Keep editing
              </button>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {publishOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-bg/70 p-4 backdrop-blur"
            onClick={() => setPublishOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md rounded-[32px] border border-fg/15 bg-bg p-8 text-center"
            >
              <button onClick={() => setPublishOpen(false)} className="absolute right-5 top-5 text-fg/50 hover:text-fg" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
              {user && publishSuccess ? (
                <>
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#ff5b37] text-3xl text-[#111]">✓</div>
                  <h3 className="mt-6 font-display text-[40px] italic leading-none">Published!</h3>
                  <p className="mt-3 text-fg/60">Your page is live at</p>
                  <p className="mt-1 text-[18px] font-medium">{SITE_HOST}/{p.handle}</p>
                  <QRCodeCanvas text={`${SITE_URL}/${p.handle}`} size={140} className="mx-auto mt-5" />
                  <p className="mt-2 text-[12px] text-fg/45">Scan to open your page — handy for prints, menus and business cards.</p>
                  <p className="mt-5 text-[13px] text-fg/45">
                    Saved directly to database for account {user.email}.
                  </p>
                  <div className="mt-7 flex flex-col gap-2">
                    <Link href={`/${p.handle}`} target="_blank" className="rounded-full bg-[#ff5b37] py-3.5 font-semibold text-[#111] hover:brightness-110">
                      View live page
                    </Link>
                    <Link href="/preview" target="_blank" className="rounded-full border border-fg/15 py-3.5 text-fg/80 hover:border-fg/40">
                      Open full preview
                    </Link>
                  </div>
                </>
              ) : !user ? (
                <>
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#ff5b37] text-3xl text-[#111]">✓</div>
                  <h3 className="mt-6 font-display text-[38px] italic leading-none">Ready to publish?</h3>
                  <p className="mt-3 text-fg/60">Create a free account to claim your handle and publish your live page.</p>
                  <p className="mt-1 text-[18px] font-medium">{SITE_HOST}/{p.handle}</p>
                  <p className="mt-5 text-[13px] text-fg/45">
                    Your current edits are temporarily saved in this browser. Sign up or log in to make your page permanent.
                  </p>
                  <div className="mt-7 flex flex-col gap-2">
                    <Link href="/signup" className="rounded-full bg-[#ff5b37] py-3.5 font-semibold text-[#111] hover:brightness-110">
                      Create free account
                    </Link>
                    <Link href="/login" className="rounded-full border border-fg/15 py-3.5 text-fg/80 hover:border-fg/40">
                      Log in to existing account
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#ff5b37] text-3xl text-[#111]">✓</div>
                  <h3 className="mt-6 font-display text-[40px] italic leading-none">Looking good.</h3>
                  <p className="mt-3 text-fg/60">Your page is live at</p>
                  <p className="mt-1 text-[18px] font-medium">{SITE_HOST}/{p.handle}</p>
                  <QRCodeCanvas text={`${SITE_URL}/${p.handle}`} size={140} className="mx-auto mt-5" />
                  <div className="mt-7 flex flex-col gap-2">
                    <Link href={`/${p.handle}`} target="_blank" className="rounded-full bg-[#ff5b37] py-3.5 font-semibold text-[#111] hover:brightness-110">
                      View live page
                    </Link>
                    <Link href="/preview" target="_blank" className="rounded-full border border-fg/15 py-3.5 text-fg/80 hover:border-fg/40">
                      Open full preview
                    </Link>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function IconBtn({ children, label, onClick, active }: { children: React.ReactNode; label: string; onClick: () => void; active?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full transition ${active ? "bg-[#ff5b37] text-[#111]" : "text-fg/55 hover:bg-fg/10 hover:text-fg"}`}
    >
      {children}
    </button>
  );
}
