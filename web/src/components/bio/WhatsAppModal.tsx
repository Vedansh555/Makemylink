"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { BioLink } from "@/lib/types";

export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12.04 2a9.9 9.9 0 0 0-8.43 15.1L2 22l5.05-1.32A9.9 9.9 0 1 0 12.04 2Zm0 1.8a8.1 8.1 0 1 1-4.2 15.03l-.3-.18-3 .78.8-2.92-.2-.31A8.1 8.1 0 0 1 12.04 3.8Zm-3.2 4.2c-.17 0-.45.06-.69.32-.24.26-.9.88-.9 2.15 0 1.27.92 2.5 1.05 2.67.13.17 1.8 2.86 4.45 3.9 2.2.87 2.65.7 3.13.65.48-.04 1.55-.63 1.77-1.24.22-.6.22-1.13.15-1.24-.07-.1-.24-.17-.5-.3-.26-.13-1.55-.77-1.79-.85-.24-.09-.4-.13-.58.13-.17.26-.67.85-.82 1.02-.15.17-.3.2-.56.07-.26-.13-1.1-.4-2.1-1.3-.77-.69-1.3-1.55-1.45-1.8-.15-.26-.02-.4.11-.53.12-.12.26-.3.4-.46.13-.15.17-.26.26-.44.09-.17.04-.33-.02-.46-.07-.13-.58-1.4-.8-1.92-.2-.5-.42-.43-.58-.44h-.5Z" />
    </svg>
  );
}

/** Asks for a name and email first (so the creator keeps the lead), then opens WhatsApp with the message ready. */
export function WhatsAppModal({ link, handle, live, onClose }: { link: BioLink; handle: string; live: boolean; onClose: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const field = "w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-[14px] text-white outline-none placeholder:text-white/30 focus:border-white/40";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!live) {
      setErr("Demo: on a real page this opens WhatsApp and saves you as a lead.");
      return;
    }
    setBusy(true);
    setErr("");
    const res = await fetch("/api/lead", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ handle, linkId: link.id, name, email }) });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok || !d.url) return setErr(d.error ?? "Something went wrong");
    window.location.href = d.url;
    onClose();
  }

  return (
    <div role="dialog" aria-modal="true" onClick={onClose} className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-md rounded-t-3xl border border-white/15 bg-[#141518] p-6 text-white shadow-2xl sm:rounded-3xl">
        <button type="button" onClick={onClose} aria-label="Close" className="absolute right-4 top-4 rounded-full p-1 text-white/50 hover:bg-white/10 hover:text-white">
          <X className="h-4 w-4" />
        </button>
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#25d366] text-white"><WhatsAppIcon className="h-6 w-6" /></span>
        <h3 className="mt-3 pr-8 text-[20px] font-bold">{link.title}</h3>
        <p className="mt-1 text-[13px] text-white/55">Tell us who you are, then WhatsApp opens with your message ready to send.</p>
        <form onSubmit={submit} className="mt-5 space-y-3">
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" maxLength={80} className={field} />
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email" className={field} />
          {err && <p className="text-[13px] text-red-300">{err}</p>}
          <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25d366] py-3 text-[14px] font-bold text-[#06371b] disabled:opacity-50">
            <WhatsAppIcon className="h-4 w-4" />
            {busy ? "Opening…" : "Continue to WhatsApp"}
          </button>
        </form>
      </div>
    </div>
  );
}
