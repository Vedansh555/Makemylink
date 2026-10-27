import Link from "next/link";
import { ModeToggle } from "./ModeToggle";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`}>
      <span className="grid h-8 w-8 place-items-center rounded-full bg-[conic-gradient(from_200deg,#8a8f99,#fff,#6f747d,#e9ebef,#8a8f99)] text-[15px] font-black text-[#111]">
        ✦
      </span>
      <span className="font-display text-[26px] italic leading-none">Linkss</span>
    </Link>
  );
}

export function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <nav className="mx-auto mt-4 flex max-w-6xl items-center justify-between rounded-full border border-fg/10 bg-bg/75 px-4 py-2.5 backdrop-blur-xl sm:px-6">
        <Logo />
        <div className="hidden items-center gap-7 text-[13px] text-fg/70 md:flex">
          <a href="#themes" className="hover:text-fg">Themes</a>
          <a href="#features" className="hover:text-fg">Features</a>
          <a href="#pricing" className="hover:text-fg">Pricing</a>
          <a href="#faq" className="hover:text-fg">FAQ</a>
        </div>
        <div className="flex items-center gap-2">
          <ModeToggle />
          <Link href="/create" className="rounded-lg bg-fg px-4 py-2 text-[13px] font-semibold text-bg transition hover:bg-[#ff5b37] hover:text-[#111]">
            Create<span className="hidden sm:inline"> your page</span>
          </Link>
        </div>
      </nav>
    </header>
  );
}
