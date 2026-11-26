"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthError, AuthField, AuthShell, PasswordInput, authButton, authInput } from "@/components/auth/AuthShell";

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
    <AuthShell
      title="Welcome back"
      intro="Log in to edit your page and see your bookings."
      footer={<>New to Showz? <Link href="/signup" className="font-semibold text-fg underline underline-offset-4 hover:text-[#ff5b37]">Create your free page</Link></>}
    >
      {error && <AuthError>{error}</AuthError>}
      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
        <AuthField label="Email">
          <input type="email" required autoComplete="email" aria-label="Email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={authInput} />
        </AuthField>

        <AuthField label="Password" aside={<Link href="/forgot" className="text-fg/60 underline underline-offset-4 hover:text-[#ff5b37]">Forgot password?</Link>}>
          <PasswordInput required autoComplete="current-password" aria-label="Password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" />
        </AuthField>

        <button type="submit" disabled={loading} className={`mt-1 ${authButton}`}>
          {loading ? "Logging in…" : "Log in"}
        </button>
      </form>
    </AuthShell>
  );
}
