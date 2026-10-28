"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center bg-bg px-6 text-center text-fg">
      <div>
        <h1 className="font-display text-[clamp(40px,8vw,72px)] italic leading-none">Something went wrong.</h1>
        <p className="mx-auto mt-4 max-w-[36ch] text-fg/60">It&apos;s on us, not you. Please try again in a moment.</p>
        <button onClick={reset} className="mt-8 rounded-xl bg-fg px-6 py-3 text-[14px] font-semibold text-bg">
          Try again
        </button>
      </div>
    </main>
  );
}
