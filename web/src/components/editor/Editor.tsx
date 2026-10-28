"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowDown, ArrowUp, ChevronDown, Eye, ImagePlus, Pencil, Plus, Sparkles, Star, Trash2, X } from "lucide-react";
import { blankProfile, demoProfiles } from "@/lib/demo";
import { loadDraft, readImage, saveDraft, uid } from "@/lib/draft";
import { getTheme, themeList } from "@/lib/themes";

const fontOptions: [string, string][] = [
  ["bodoni", "Bodoni (editorial serif)"],
  ["display", "Instrument (soft italic)"],
  ["syne", "Syne (bold geometric)"],
  ["unbounded", "Unbounded (rounded display)"],
  ["grotesk", "Space Grotesk (mono-ish)"],
  ["sans", "Inter (plain sans)"],
];
import type { ArtKind, BioLink, Look, Profile, Store } from "@/lib/types";
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

function Panel({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="rounded-2xl sm:rounded-3xl border border-fg/10 bg-fg/[0.025] p-4 sm:p-6 shadow-sm">
      <div className="mb-4 sm:mb-5 flex items-center justify-between">
        <h2 className="font-display text-[22px] sm:text-[26px] italic leading-none">{title}</h2>
        {action}
      </div>
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
          if (f) onPick(await readImage(f));
          e.target.value = "";
        }}
      />
    </>
  );
}

export function Editor() {
  const params = useSearchParams();
  const [p, setP] = useState<Profile | null>(null);
  const [saved, setSaved] = useState<"saved" | "error" | null>(null);
  const [mobileView, setMobileView] = useState<"edit" | "preview">("edit");
  const [publishOpen, setPublishOpen] = useState(false);
  const [user, setUser] = useState<{ id: string; email: string; handle?: string } | null>(null);
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
                setP(pageData.profile);
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

    let initial: Profile;
    if (draft && !handle) {
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

  const handlePublish = async () => {
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

  if (!p) return <div className="min-h-screen bg-bg" />;

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
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
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
              className="rounded-full bg-[#ff5b37] px-4 py-2 text-[13px] font-semibold text-[#111] hover:brightness-110 disabled:opacity-50"
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

      <div className="mx-auto grid max-w-[1400px] gap-8 px-4 pb-28 pt-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:py-10">
        {/* Controls */}
        <div className={`flex flex-col gap-5 ${mobileView === "preview" ? "hidden lg:flex" : ""}`}>
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h1 className="font-display text-[34px] sm:text-[48px] italic leading-none">Your page</h1>
              <p className="mt-1.5 sm:mt-2 text-[13px] sm:text-[14px] text-fg/50">Changes show up in the phone right away.</p>
            </div>
            <div ref={examplesRef} className="relative">
              <button
                type="button"
                onClick={() => setExamplesOpen((prev) => !prev)}
                className="flex w-full sm:w-72 items-center justify-between gap-3 rounded-2xl border border-fg/15 bg-fg/[0.04] px-4 py-2.5 text-[13px] font-semibold text-fg shadow-sm transition hover:border-fg/35 hover:bg-fg/[0.07] focus:outline-none"
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
                    className="absolute right-0 top-full z-50 mt-2 w-80 max-h-[380px] overflow-y-auto rounded-2xl border border-fg/12 bg-bg/95 p-2 shadow-2xl backdrop-blur-xl"
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

          <Panel title="Theme" action={<span className="text-[12px] text-fg/45">{themeList.length} styles</span>}>
            <ThemePicker value={p.theme} onChange={(id) => set("theme", id)} />
            <div className="flex items-center justify-between gap-4 border-t border-fg/10 pt-4">
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
            <div className="flex items-center justify-between gap-4 border-t border-fg/10 pt-4">
              <div>
                <p className="text-[13px] font-medium">Name font</p>
                <p className="mt-0.5 text-[12px] text-fg/50">Swap the headline font this style uses.</p>
              </div>
              <select
                className={`${inputCls} !w-40`}
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

          <Panel title="Profile">
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
                  <span className="text-fg/35">makemylink.co/</span>
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

          <Panel title="Socials">
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

          <Panel
            title="Links"
            action={
              <button
                onClick={() => set("links", [...p.links, { id: uid(), title: "New link", url: "https://" }])}
                className="flex items-center gap-1 rounded-full bg-fg px-3 py-1.5 text-[12px] font-semibold text-bg"
              >
                <Plus className="h-3.5 w-3.5" /> Add link
              </button>
            }
          >
            {p.links.length === 0 && <p className="text-[14px] text-fg/40">No links yet.</p>}
            {p.links.map((l, i) => (
              <div key={l.id} className="flex flex-col gap-2 rounded-2xl border border-fg/10 bg-bg/20 p-3 sm:flex-row sm:items-center">
                <div className="grid flex-1 gap-2 sm:grid-cols-3">
                  <input className={inputCls} value={l.title} onChange={(e) => setLink(l.id, { title: e.target.value })} placeholder="Title" />
                  <input className={inputCls} value={l.url} onChange={(e) => setLink(l.id, { url: e.target.value })} placeholder="https://" />
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
            ))}
          </Panel>

          <Panel
            title="Products"
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
              <div key={look.id} className="flex gap-4 rounded-2xl border border-fg/10 bg-bg/20 p-3">
                <ImagePick onPick={(v) => setLook(look.id, { image: v })} className="group relative h-28 w-24 shrink-0 overflow-hidden rounded-xl">
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
                      <input
                        type="range"
                        min={0}
                        max={359}
                        value={look.hue}
                        onChange={(e) => setLook(look.id, { hue: +e.target.value })}
                        className="h-2 flex-1 cursor-pointer appearance-none rounded-full [background:linear-gradient(90deg,red,yellow,lime,cyan,blue,magenta,red)]"
                        aria-label="Colour"
                      />
                    </div>
                  ) : (
                    <button onClick={() => setLook(look.id, { image: undefined })} className="text-left text-[12px] text-fg/50 underline underline-offset-4 sm:col-span-2">
                      Remove photo
                    </button>
                  )}
                </div>
                <IconBtn label="Delete" onClick={() => set("looks", p.looks.filter((x) => x.id !== look.id))}>
                  <Trash2 className="h-4 w-4" />
                </IconBtn>
              </div>
            ))}
          </Panel>

          <Panel title="Media kit">
            <Switch on={p.showMediaKit} onChange={(v) => set("showMediaKit", v)} label="Show media kit for brands" />
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

          <Panel title="Audience">
            <Switch on={p.showSubscribe} onChange={(v) => set("showSubscribe", v)} label="Collect emails (newsletter sign-up)" />
          </Panel>
        </div>

        {/* Live preview */}
        <div className={`${mobileView === "edit" ? "hidden lg:block" : "flex justify-center"}`}>
          <div className="sticky top-20 flex flex-col items-center gap-4">
            {/* Responsive scale: 0.62 on mobile screen so the entire phone frame fits in the viewport without cutoffs */}
            <div className="block lg:hidden">
              <PhoneFrame profile={p} scale={0.62} />
            </div>
            <div className="hidden lg:block">
              <PhoneFrame profile={p} scale={0.78} />
            </div>
            <p className="text-[12px] text-fg/40 font-medium">
              makemylink.co/{p.handle}
            </p>
          </div>
        </div>
      </div>

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
                  <p className="mt-1 text-[18px] font-medium">makemylink.co/{p.handle}</p>
                  <QRCodeCanvas text={`https://makemylink.co/${p.handle}`} size={140} className="mx-auto mt-5" />
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
                  <p className="mt-1 text-[18px] font-medium">makemylink.co/{p.handle}</p>
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
                  <p className="mt-1 text-[18px] font-medium">makemylink.co/{p.handle}</p>
                  <QRCodeCanvas text={`https://makemylink.co/${p.handle}`} size={140} className="mx-auto mt-5" />
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
