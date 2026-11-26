"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { AuthError, AuthField, AuthShell, PasswordInput, authButton } from "@/components/auth/AuthShell";

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
    <AuthShell
      title="Choose a new password"
      footer={<>Link expired? <Link href="/forgot" className="font-semibold text-fg underline underline-offset-4 hover:text-[#ff5b37]">Get a new one</Link></>}
    >
      {error && <AuthError>{error}</AuthError>}
      <form onSubmit={submit} className="mt-8 flex flex-col gap-5">
        <AuthField label="New password">
          <PasswordInput required minLength={8} maxLength={72} autoComplete="new-password" aria-label="New password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
        </AuthField>
        <button disabled={busy || !token} className={authButton}>
          {busy ? "Saving…" : "Save password and log in"}
        </button>
      </form>
    </AuthShell>
  );
}
