"use client";

import { SITE_HOST } from "@/lib/site";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/landing/Nav";

export default function SignupPage() {
  const router = useRouter();
  const [handle, setHandle] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, handle, agreed }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to sign up");
      }

      // Successfully signed up and cookie set, direct user to creator editor
      router.push("/create");
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-4 py-12 text-fg">
      <div className="mb-8">
        <Logo />
      </div>

      <div className="w-full max-w-md rounded-3xl border border-fg/10 bg-fg/[0.025] p-6 backdrop-blur-sm sm:p-10">
        <h1 className="font-display text-[36px] italic leading-tight text-center">
          Claim your link
        </h1>
        <p className="mt-2 text-center text-[14px] text-fg/50">
          Sign up to save, customize, and publish your live page.
        </p>

        {error && (
          <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-[13px] text-red-500">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] uppercase tracking-[0.18em] text-fg/45">Handle</span>
            <div className="flex items-center rounded-xl border border-fg/10 bg-fg/[0.04] pl-3.5 transition focus-within:border-fg/35 focus-within:bg-fg/[0.07]">
              <span className="max-w-[60%] shrink-0 truncate select-none text-[14px] text-fg/40">{SITE_HOST}/</span>
              <input
                type="text"
                required
                value={handle}
                onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                placeholder="yourname"
                className="min-w-0 flex-1 bg-transparent py-2.5 pr-3.5 text-[14px] text-fg outline-none placeholder:text-fg/30"
              />
            </div>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] uppercase tracking-[0.18em] text-fg/45">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-fg/10 bg-fg/[0.04] px-3.5 py-2.5 text-[14px] text-fg outline-none transition placeholder:text-fg/30 focus:border-fg/35 focus:bg-fg/[0.07]"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] uppercase tracking-[0.18em] text-fg/45">Password</span>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="w-full rounded-xl border border-fg/10 bg-fg/[0.04] px-3.5 py-2.5 text-[14px] text-fg outline-none transition placeholder:text-fg/30 focus:border-fg/35 focus:bg-fg/[0.07]"
            />
          </label>

          <label className="flex items-start gap-2.5 text-[13px] leading-snug text-fg/60">
            <input type="checkbox" required checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[#ff5b37]" />
            <span>
              I agree to the <Link href="/terms" target="_blank" className="text-fg underline">Terms of Service</Link>, the{" "}
              <Link href="/privacy" target="_blank" className="text-fg underline">Privacy Policy</Link> and the{" "}
              <Link href="/refund" target="_blank" className="text-fg underline">Refund Policy</Link>.
            </span>
          </label>

          <button
            type="submit"
            disabled={loading || !agreed}
            className="mt-3 w-full rounded-full bg-[#ff5b37] py-3 text-[14px] font-semibold text-[#111] transition hover:brightness-110 disabled:opacity-50"
          >
            {loading ? "Creating account…" : "Create free account"}
          </button>
        </form>

        <p className="mt-6 text-center text-[13px] text-fg/45">
          Already have an account?{" "}
          <Link href="/login" className="text-fg underline hover:text-[#ff5b37]">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
