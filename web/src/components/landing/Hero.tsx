"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { getDemoProfile } from "@/lib/demo";
import type { BioLink, Profile } from "@/lib/types";
import { PhoneFrame } from "./PhoneFrame";

const ChromeScene = dynamic(() => import("../three/ChromeScene"), { ssr: false });

const ease = [0.2, 0.7, 0.2, 1] as const;

/**
 * Dresses a demo profile for the hero: one wide highlight, a bento booking tile that shows real free times,
 * then photo cards side by side, so each phone shows what the product does and not just a list of links.
 */
function showcase(p: Profile, booking: { title: string; price: number; currency: "INR" | "USD"; min: number; text: string }): Profile {
  const rest = p.links.filter((l) => l.kind !== "booking");
  const [first, ...others] = rest;
  const tile: BioLink = {
    id: "hero-book",
    title: booking.title,
    url: "",
    kind: "booking",
    size: "2x1",
    booking: { price: booking.price, currency: booking.currency, durationMin: booking.min, description: booking.text, meetingUrl: "", days: [1, 2, 3, 4, 5, 6], startHour: 10, endHour: 19, timeZone: "Asia/Kolkata" },
  };
  const halves: BioLink[] = others.slice(0, 2).map((l, i) => ({ ...l, size: "1x1" as const, featured: false, image: l.image ?? p.looks[i]?.image }));
  return { ...p, links: [{ ...first!, size: "2x1" as const }, tile, ...halves], looks: p.looks.slice(0, 2) };
}

const uses = ["creators", "mentors", "coaches", "photographers", "stylists", "small shops"];

export function Hero() {
  // Desktop gets the big scene behind the headline; phones get a small one below the text.
  const [wide, setWide] = useState(false);
  const router = useRouter();
  const [pasted, setPasted] = useState("");
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const update = () => setWide(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  const left = showcase(getDemoProfile("kai")!, { title: "Book me for your event", price: 25000, currency: "INR", min: 30, text: "Private sets, launches and club nights." });
  const center = showcase(getDemoProfile("bubbles")!, { title: "Style call with Mia", price: 499, currency: "INR", min: 20, text: "Thrift finds picked just for you." });
  const right = showcase({ ...getDemoProfile("aria")!, theme: "violet-mist" }, { title: "1:1 styling session", price: 1499, currency: "INR", min: 45, text: "A wardrobe plan built around you." });

  return (
    <section className="relative isolate pt-32 [clip-path:inset(-300px_-300px_0_-300px)] sm:pt-36">
      {/* 3D scene, responsive scaling & positioning so it never crowds text on mobile */}
      {wide && (
        <div className="pointer-events-none absolute inset-x-0 top-[70px] z-0 h-[850px] w-full overflow-hidden">
          <ChromeScene variant="hero" />
        </div>
      )}
      {/* Soft glow behind the words so they stay readable over the chrome. No box. */}
      <div className="pointer-events-none absolute inset-x-0 top-24 -z-10 mx-auto h-[500px] sm:h-[620px] max-w-[900px] bg-[radial-gradient(closest-side,var(--hero-glow),transparent)] opacity-90 sm:opacity-100" />

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center px-4 text-center sm:px-6">
        <div>
          <h1 className="rise font-display text-[clamp(56px,10vw,150px)] leading-[0.88] tracking-[-0.02em] text-fg [text-shadow:var(--hero-shadow)]">
            Your whole business,
            <br />
            in one <span className="chrome-text [text-shadow:none]">link.</span>
          </h1>

          <p className="rise mx-auto mt-7 max-w-[480px] text-[18px] leading-relaxed text-fg/85 [animation-delay:.12s]">
            Get paid for calls, sell your products, collect leads on WhatsApp and email, and share any single card on its own. One beautiful page, 0% commission on Pro, free to start.
          </p>

          <div className="rise mt-9 flex flex-wrap items-center justify-center gap-5 [animation-delay:.24s] [text-shadow:none]">
            <Link href="/start" className="rounded-xl bg-fg px-6 py-3.5 text-[15px] font-semibold text-bg transition hover:bg-[#ff5b37] hover:text-[#111]">
              Create your free page
            </Link>
            <a href="#themes" className="inline-block py-2.5 text-[15px] text-fg/80 underline decoration-fg/30 underline-offset-[6px] transition hover:text-fg hover:decoration-fg">
              See examples
            </a>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              router.push(pasted.trim() ? `/create?import=${encodeURIComponent(pasted.trim())}` : "/start");
            }}
            className="rise mx-auto mt-8 flex w-full max-w-[460px] flex-col gap-2 text-left [animation-delay:.3s] [text-shadow:none]"
          >
            <label htmlFor="hero-import" className="px-1 text-[13px] text-fg/70">
              Already on Linktree, Carrd or another link page? Paste it and we copy everything over in seconds.
            </label>
            <div className="flex gap-2 rounded-full border border-fg/15 bg-bg/70 p-1.5 backdrop-blur focus-within:border-[#ff5b37]">
              <input
                id="hero-import"
                type="text"
                inputMode="url"
                value={pasted}
                onChange={(e) => setPasted(e.target.value)}
                placeholder="Paste your page link"
                className="min-w-0 flex-1 bg-transparent px-4 text-[14px] text-fg outline-none placeholder:text-fg/40"
              />
              <button type="submit" className="shrink-0 rounded-full bg-fg px-5 py-2.5 text-[14px] font-semibold text-bg transition hover:bg-[#ff5b37] hover:text-[#111]">
                Import
              </button>
            </div>
          </form>

          <p className="rise mt-10 text-[13px] text-fg/55 [animation-delay:.36s]">
            Made for {uses.join(", ")}.
          </p>
        </div>
      </div>

      {/* Mobile: a chain-link shape in its own clear space, never behind the text */}
      {!wide && (
        <div className="pointer-events-none mx-auto mt-4 h-[150px] w-full max-w-[280px]">
          <ChromeScene variant="chain" />
        </div>
      )}

      {/* Phones with real pages */}
      <div className="relative mx-auto mt-14 flex max-w-6xl items-end justify-center px-4 sm:gap-6 [perspective:1600px] sm:mt-20">
        <motion.div
          initial={{ opacity: 0, y: 80, rotateY: 30 }}
          animate={{ opacity: 1, y: 0, rotateY: 16 }}
          transition={{ duration: 1.2, delay: 0.3, ease }}
          className="-mr-12 translate-y-6 sm:mr-0 sm:translate-y-10"
          style={{ transformStyle: "preserve-3d" }}
        >
          <div className="relative [animation:float_7s_ease-in-out_infinite]">
            <div className="pointer-events-none absolute -inset-x-6 inset-y-10 -z-10 rounded-full opacity-50 blur-3xl" style={{ background: "#9aa0ad" }} />
            <PhoneFrame interactive={false} profile={left} scale={wide ? 0.56 : 0.34} />
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, delay: 0.2, ease }} className="relative z-10 translate-y-6 sm:translate-y-0">
          <div className="relative [animation:float_6s_ease-in-out_-2s_infinite]">
            <div className="pointer-events-none absolute -inset-x-6 inset-y-10 -z-10 rounded-full opacity-50 blur-3xl" style={{ background: "#ff5fb0" }} />
            <PhoneFrame interactive={false} profile={center} scale={wide ? 0.66 : 0.5} />
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 80, rotateY: -30 }}
          animate={{ opacity: 1, y: 0, rotateY: -16 }}
          transition={{ duration: 1.2, delay: 0.4, ease }}
          className="-ml-12 translate-y-6 sm:ml-0 sm:translate-y-10"
          style={{ transformStyle: "preserve-3d" }}
        >
          <div className="relative [animation:float_7s_ease-in-out_-3.5s_infinite]">
            <div className="pointer-events-none absolute -inset-x-6 inset-y-10 -z-10 rounded-full opacity-50 blur-3xl" style={{ background: "#b38aff" }} />
            <PhoneFrame interactive={false} profile={right} scale={wide ? 0.56 : 0.34} />
          </div>
        </motion.div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-40 bg-gradient-to-t sm:block from-bg to-transparent" />
    </section>
  );
}
