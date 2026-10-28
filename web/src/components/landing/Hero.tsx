"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { getDemoProfile } from "@/lib/demo";
import { PhoneFrame } from "./PhoneFrame";

const ChromeScene = dynamic(() => import("../three/ChromeScene"), { ssr: false });

const ease = [0.2, 0.7, 0.2, 1] as const;

const uses = ["Creators", "Musicians", "Artists", "Coaches", "Shops", "Salons", "Photographers"];

export function Hero() {
  // Desktop gets the big scene behind the headline; phones get a small one below the text.
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const update = () => setWide(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  const left = getDemoProfile("kai")!;
  const center = getDemoProfile("bubbles")!;
  const right = { ...getDemoProfile("aria")!, theme: "mint-glass" };

  return (
    <section className="relative isolate pt-32 sm:pt-36">
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
            One link for
            <br />
            everything <span className="chrome-text [text-shadow:none]">you do.</span>
          </h1>

          <p className="rise mx-auto mt-7 max-w-[480px] text-[18px] leading-relaxed text-fg/85 [animation-delay:.12s]">
            Put your links, products, videos and contact on one page. Add it to your Instagram or TikTok bio in two minutes.
          </p>

          <div className="rise mt-9 flex flex-wrap items-center justify-center gap-5 [animation-delay:.24s] [text-shadow:none]">
            <Link href="/create" className="rounded-xl bg-fg px-6 py-3.5 text-[15px] font-semibold text-bg transition hover:bg-[#ff5b37] hover:text-[#111]">
              Create your page
            </Link>
            <a href="#themes" className="text-[15px] text-fg/80 underline decoration-fg/30 underline-offset-[6px] transition hover:text-fg hover:decoration-fg">
              See examples
            </a>
          </div>

          <p className="rise mt-10 text-[13px] text-fg/55 [animation-delay:.36s]">
            Used by {uses.join(", ").toLowerCase()} and more.
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
      <div className="relative mx-auto mt-14 flex max-w-6xl items-end justify-center px-4 pb-14 sm:pb-0 sm:gap-6 [perspective:1600px] sm:mt-20">
        <motion.div
          initial={{ opacity: 0, y: 80, rotateY: 30 }}
          animate={{ opacity: 1, y: 0, rotateY: 16 }}
          transition={{ duration: 1.2, delay: 0.3, ease }}
          className="-mr-12 translate-y-6 sm:mr-0 sm:translate-y-10"
          style={{ transformStyle: "preserve-3d" }}
        >
          <div className="[animation:float_7s_ease-in-out_infinite]">
            <PhoneFrame profile={left} scale={wide ? 0.56 : 0.34} />
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, delay: 0.2, ease }} className="relative z-10">
          <div className="[animation:float_6s_ease-in-out_-2s_infinite]">
            <PhoneFrame profile={center} scale={wide ? 0.66 : 0.5} />
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 80, rotateY: -30 }}
          animate={{ opacity: 1, y: 0, rotateY: -16 }}
          transition={{ duration: 1.2, delay: 0.4, ease }}
          className="-ml-12 translate-y-6 sm:ml-0 sm:translate-y-10"
          style={{ transformStyle: "preserve-3d" }}
        >
          <div className="[animation:float_7s_ease-in-out_-3.5s_infinite]">
            <PhoneFrame profile={right} scale={wide ? 0.56 : 0.34} />
          </div>
        </motion.div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 sm:h-40 bg-gradient-to-t from-bg to-transparent" />
    </section>
  );
}
