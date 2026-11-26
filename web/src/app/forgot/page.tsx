"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthField, AuthShell, authButton, authInput } from "@/components/auth/AuthShell";

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
    <AuthShell
      title={sent ? "Check your email" : "Forgot your password?"}
      intro={sent ? undefined : "Enter your email and we'll send you a link to choose a new one."}
      footer={<Link href="/login" className="font-semibold text-fg underline underline-offset-4 hover:text-[#ff5b37]">Back to log in</Link>}
    >
      {sent ? (
        <p className="mt-6 text-[15px] leading-relaxed text-fg/70">If an account exists for <b>{email}</b>, we have emailed a link to choose a new password. It works for 1 hour. Check your spam folder too.</p>
      ) : (
        <form onSubmit={submit} className="mt-8 flex flex-col gap-5">
          <AuthField label="Email">
            <input type="email" required autoComplete="email" aria-label="Email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={authInput} />
          </AuthField>
          <button disabled={busy} className={authButton}>
            {busy ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
