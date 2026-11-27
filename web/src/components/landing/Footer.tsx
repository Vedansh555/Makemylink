import Link from "next/link";
import { OPERATOR } from "@/lib/legal";
import { Logo } from "./Nav";

// Kept in its own file so text pages (blog, legal, about) don't download the whole home page just to show the footer.
export function Footer() {
  const link = "block py-2 hover:text-fg";
  return (
    <footer className="mx-auto max-w-6xl border-t border-fg/10 px-4 py-10 text-[13px] text-fg/45 sm:px-6">
      <div className="flex flex-col items-center justify-between gap-6 sm:flex-row sm:items-start">
        <Logo />
        <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-center sm:grid-cols-3 sm:text-left">
          <Link href="/#themes" className={link}>Themes</Link>
          <Link href="/#pricing" className={link}>Pricing</Link>
          <Link href="/blog" className={link}>Blog</Link>
          <Link href="/start" className={link}>Create</Link>
          <Link href="/contact" rel="nofollow" className={link}>Contact</Link>
          <Link href="/terms" rel="nofollow" className={link}>Terms</Link>
          <Link href="/privacy" rel="nofollow" className={link}>Privacy</Link>
          <Link href="/refund" rel="nofollow" className={link}>Refunds</Link>
          <Link href="/cookies" rel="nofollow" className={link}>Cookies</Link>
        </div>
      </div>
      <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-fg/10 pt-6 text-[12px] sm:flex-row">
        <p>© {new Date().getFullYear()} Showz. Your whole business in one link.</p>
        <p>Made by {OPERATOR.names} · {OPERATOR.place}</p>
      </div>
    </footer>
  );
}
