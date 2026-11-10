"use client";

import Link from "next/link";

/** Unticked box a visitor must tick before sharing their details (DPDP consent). Inherits the text colour of whatever it sits in. */
export function ConsentCheck({ checked, onChange, className = "" }: { checked: boolean; onChange: (v: boolean) => void; className?: string }) {
  return (
    <label className={`flex cursor-pointer items-start gap-2.5 text-left text-[12px] leading-snug opacity-80 ${className}`}>
      <input type="checkbox" required checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-[2px] h-4 w-4 shrink-0 cursor-pointer accent-current" />
      <span>
        I agree to share these details with this creator, who may contact me. See the{" "}
        <Link href="/privacy" target="_blank" className="underline underline-offset-2">
          Privacy Policy
        </Link>
        .
      </span>
    </label>
  );
}
