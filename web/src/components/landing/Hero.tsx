"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Link2 } from "lucide-react";
import { getDemoProfile } from "@/lib/demo";
import { PhoneFrame } from "./PhoneFrame";

const ChromeScene = dynamic(() => import("../three/ChromeScene"), { ssr: false });

const ease = [0.2, 0.7, 0.2, 1] as const;

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
  const left = getDemoProfile("kai")!;
  const center = getDemoProfile("bubbles")!;
  const right = { ...getDemoProfile("aria")!, theme: "violet-mist" };

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

          <div className="rise mx-auto mt-10 w-full max-w-[560px] text-left [animation-delay:.3s] [text-shadow:none]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                router.push(pasted.trim() ? `/create?import=${encodeURIComponent(pasted.trim())}` : "/start");
              }}
              className="group flex items-center gap-2 rounded-full border border-fg/10 bg-bg/85 p-2 pl-5 shadow-[0_26px_60px_-26px_rgba(0,0,0,0.35),0_1px_0_rgba(255,255,255,0.9)_inset] backdrop-blur-xl transition focus-within:border-[#ff5b37]/60 focus-within:shadow-[0_26px_60px_-22px_rgba(255,91,55,0.5)]"
            >
              <Link2 className="h-[18px] w-[18px] shrink-0 text-fg/40 transition group-focus-within:text-[#ff5b37]" aria-hidden />
              <input
                id="hero-import"
                type="text"
                inputMode="url"
                aria-label="Link to your existing link-in-bio page"
                value={pasted}
                onChange={(e) => setPasted(e.target.value)}
                placeholder="Switching? Paste your Linktree or Carrd link"
                className="min-w-0 flex-1 bg-transparent py-2.5 text-[15px] text-fg outline-none placeholder:text-fg/45"
              />
              <button type="submit" className="shrink-0 rounded-full bg-[#ff5b37] px-5 py-3 text-[14px] font-semibold text-[#111] shadow-[0_14px_26px_-10px_#ff5b37] transition hover:-translate-y-0.5 active:translate-y-0 sm:px-6">
                <span className="hidden sm:inline">Import my page</span>
                <span className="sm:hidden">Import</span>
              </button>
            </form>
            <p className="mt-3 text-center text-[12.5px] leading-relaxed text-fg/55">We copy your photo, links and shop items in seconds. Works with Linktree, Carrd, Solo.to, Bio.site, Taplink and more.</p>
          </div>

          <p className="rise mt-8 text-[13px] text-fg/55 [animation-delay:.36s]">
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

      {/* Phones with real pages, on a lit stage */}
      <div className="relative mx-auto mt-14 max-w-6xl px-4 sm:mt-20">
        {/* Light behind the trio and a soft floor under it, so the phones sit in a space instead of floating on white */}
        <div className="pointer-events-none absolute inset-x-0 -top-10 bottom-0 -z-10 bg-[radial-gradient(ellipse_55%_60%_at_50%_45%,rgba(255,120,170,0.20),rgba(154,160,173,0.14)_45%,transparent_72%)]" />
        <div className="pointer-events-none absolute inset-x-[10%] bottom-2 h-24 rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.30),transparent_68%)] blur-xl sm:bottom-0" />

        <div className="relative flex items-end justify-center sm:gap-4 [perspective:1800px]">
          <motion.div
            initial={{ opacity: 0, y: 80, rotateY: 30 }}
            animate={{ opacity: 1, y: 0, rotateY: 14 }}
            transition={{ duration: 1.2, delay: 0.3, ease }}
            className="-mr-10 translate-y-4 sm:mr-0 sm:translate-y-8"
            style={{ transformStyle: "preserve-3d" }}
          >
            <div className="relative [animation:float_7s_ease-in-out_infinite]">
              <PhoneFrame interactive={false} profile={left} scale={wide ? 0.64 : 0.36} />
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, delay: 0.2, ease }} className="relative z-10">
            <div className="relative [animation:float_6s_ease-in-out_-2s_infinite]">
              <PhoneFrame interactive={false} profile={center} scale={wide ? 0.82 : 0.56} />
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 80, rotateY: -30 }}
            animate={{ opacity: 1, y: 0, rotateY: -14 }}
            transition={{ duration: 1.2, delay: 0.4, ease }}
            className="-ml-10 translate-y-4 sm:ml-0 sm:translate-y-8"
            style={{ transformStyle: "preserve-3d" }}
          >
            <div className="relative [animation:float_7s_ease-in-out_-3.5s_infinite]">
              <PhoneFrame interactive={false} profile={right} scale={wide ? 0.64 : 0.36} />
            </div>
          </motion.div>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-40 bg-gradient-to-t sm:block from-bg to-transparent" />
    </section>
  );
}
