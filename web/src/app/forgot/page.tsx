"use client";

import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/components/landing/Nav";

export default function ForgotPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await fetch("/api/auth/forgot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) }).catch(() => {});
    setBusy(false);
    setSent(true);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-4 py-12 text-fg">
      <div className="mb-8"><Logo /></div>
      <div className="w-full max-w-md rounded-3xl border border-fg/10 bg-fg/[0.025] p-8 sm:p-10">
        <h1 className="text-center font-display text-[36px] italic leading-tight">Forgot your password?</h1>
        {sent ? (
          <p className="mt-5 text-center text-[14px] text-fg/70">If an account exists for <b>{email}</b>, we have emailed a link to choose a new password. It works for 1 hour. Check your spam folder too.</p>
        ) : (
          <>
            <p className="mt-2 text-center text-[14px] text-fg/50">Enter your email and we&apos;ll send you a reset link.</p>
            <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-fg/10 bg-fg/[0.04] px-3.5 py-2.5 text-[14px] text-fg outline-none transition placeholder:text-fg/30 focus:border-fg/35 focus:bg-fg/[0.07]"
              />
              <button disabled={busy} className="w-full rounded-full bg-[#ff5b37] py-3 text-[14px] font-semibold text-[#111] transition hover:brightness-110 disabled:opacity-50">
                {busy ? "Sending…" : "Send reset link"}
              </button>
            </form>
          </>
        )}
        <p className="mt-6 text-center text-[13px] text-fg/45">
          <Link href="/login" className="text-fg underline hover:text-[#ff5b37]">Back to log in</Link>
        </p>
      </div>
    </div>
  );
}
