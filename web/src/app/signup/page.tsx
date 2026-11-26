"use client";

import { SITE_HOST } from "@/lib/site";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthError, AuthField, AuthShell, PasswordInput, authButton, authInput } from "@/components/auth/AuthShell";

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
    <AuthShell
      title="Claim your link"
      intro="Pick your page address and publish in two minutes."
      footer={<>Already have an account? <Link href="/login" className="font-semibold text-fg underline underline-offset-4 hover:text-[#ff5b37]">Log in</Link></>}
    >
      {error && <AuthError>{error}</AuthError>}
      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
        <AuthField label="Your page address">
          <label className="flex h-[52px] items-center rounded-xl border border-fg/15 bg-bg pl-4 transition focus-within:border-[#ff5b37] focus-within:ring-4 focus-within:ring-[#ff5b37]/15">
            <span className="max-w-[55%] shrink-0 select-none truncate text-[15px] text-fg/45">{SITE_HOST}/</span>
            <input
              type="text"
              required
              value={handle}
              onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
              placeholder="yourname"
              aria-label="Your page address"
              autoCapitalize="none"
              spellCheck={false}
              className="h-full min-w-0 flex-1 bg-transparent pr-4 text-[15px] font-semibold text-fg outline-none placeholder:font-normal placeholder:text-fg/35"
            />
          </label>
        </AuthField>

        <AuthField label="Email">
          <input type="email" required autoComplete="email" aria-label="Email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={authInput} />
        </AuthField>

        <AuthField label="Password">
          <PasswordInput required minLength={8} autoComplete="new-password" aria-label="Password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
        </AuthField>

        <label className="flex cursor-pointer items-start gap-3 text-[13px] leading-relaxed text-fg/60">
          <input type="checkbox" required checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 h-[18px] w-[18px] shrink-0 cursor-pointer accent-[#ff5b37]" />
          <span>
            I agree to the <Link href="/terms" target="_blank" className="text-fg underline">Terms of Service</Link>, the{" "}
            <Link href="/privacy" target="_blank" className="text-fg underline">Privacy Policy</Link> and the{" "}
            <Link href="/refund" target="_blank" className="text-fg underline">Refund Policy</Link>.
          </span>
        </label>

        <button type="submit" disabled={loading || !agreed} className={authButton}>
          {loading ? "Creating account…" : "Create free account"}
        </button>
      </form>
    </AuthShell>
  );
}
