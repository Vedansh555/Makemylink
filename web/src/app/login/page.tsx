"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/landing/Nav";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to log in");
      }

      // Successfully logged in
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

      <div className="w-full max-w-md rounded-3xl border border-fg/10 bg-fg/[0.025] p-8 backdrop-blur-sm sm:p-10">
        <h1 className="font-display text-[36px] italic leading-tight text-center">
          Welcome back
        </h1>
        <p className="mt-2 text-center text-[14px] text-fg/50">
          Log in to manage and edit your Showz profile.
        </p>

        {error && (
          <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-[13px] text-red-500">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
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
            <span className="flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-fg/45">
              Password
              <Link href="/forgot" className="normal-case tracking-normal text-fg/60 underline hover:text-[#ff5b37]">Forgot password?</Link>
            </span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              className="w-full rounded-xl border border-fg/10 bg-fg/[0.04] px-3.5 py-2.5 text-[14px] text-fg outline-none transition placeholder:text-fg/30 focus:border-fg/35 focus:bg-fg/[0.07]"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="mt-3 w-full rounded-full bg-[#ff5b37] py-3 text-[14px] font-semibold text-[#111] transition hover:brightness-110 disabled:opacity-50"
          >
            {loading ? "Logging in…" : "Log in"}
          </button>
        </form>

        <p className="mt-6 text-center text-[13px] text-fg/45">
          Don&apos;t have an account yet?{" "}
          <Link href="/signup" className="text-fg underline hover:text-[#ff5b37]">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
