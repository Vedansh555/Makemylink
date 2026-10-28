import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-bg px-6 text-center text-fg">
      <div>
        <p className="text-[12px] uppercase tracking-[0.35em] text-fg/45">404</p>
        <h1 className="mt-4 font-display text-[clamp(48px,10vw,96px)] italic leading-none">Nothing here.</h1>
        <p className="mx-auto mt-4 max-w-[36ch] text-fg/60">This page doesn&apos;t exist, or the handle hasn&apos;t been claimed yet.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="rounded-xl bg-fg px-6 py-3 text-[14px] font-semibold text-bg">Go home</Link>
          <Link href="/create" className="rounded-xl border border-fg/15 px-6 py-3 text-[14px] font-semibold">Create your page</Link>
        </div>
      </div>
    </main>
  );
}
