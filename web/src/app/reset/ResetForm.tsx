"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/landing/Nav";

export function ResetForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password }) });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(d.error ?? "Something went wrong");
    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-4 py-12 text-fg">
      <div className="mb-8"><Logo /></div>
      <div className="w-full max-w-md rounded-3xl border border-fg/10 bg-fg/[0.025] p-6 sm:p-10">
        <h1 className="text-center font-display text-[36px] italic leading-tight">Choose a new password</h1>
        {error && <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-[13px] text-red-500">{error}</div>}
        <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
          <input
            type="password"
            required
            minLength={8}
            maxLength={72}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            className="w-full rounded-xl border border-fg/10 bg-fg/[0.04] px-3.5 py-2.5 text-[14px] text-fg outline-none transition placeholder:text-fg/30 focus:border-fg/35 focus:bg-fg/[0.07]"
          />
          <button disabled={busy || !token} className="w-full rounded-full bg-[#ff5b37] py-3 text-[14px] font-semibold text-[#111] transition hover:brightness-110 disabled:opacity-50">
            {busy ? "Saving…" : "Save password and log in"}
          </button>
        </form>
        <p className="mt-6 text-center text-[13px] text-fg/45">
          Link expired? <Link href="/forgot" className="text-fg underline hover:text-[#ff5b37]">Get a new one</Link>
        </p>
      </div>
    </div>
  );
}
