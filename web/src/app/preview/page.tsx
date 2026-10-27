"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BioPage } from "@/components/bio/BioPage";
import { loadDraft } from "@/lib/draft";
import type { Profile } from "@/lib/types";

export default function PreviewPage() {
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  useEffect(() => setProfile(loadDraft()), []);

  if (profile === undefined) return <div className="min-h-screen bg-bg" />;
  if (!profile)
    return (
      <div className="grid min-h-screen place-items-center bg-bg p-6 text-center">
        <div>
          <p className="font-display text-4xl italic">No page yet.</p>
          <Link href="/create" className="mt-6 inline-block rounded-full bg-[#ff5b37] px-6 py-3 font-semibold text-[#111]">
            Create your page
          </Link>
        </div>
      </div>
    );

  return (
    <>
      <BioPage profile={profile} />
      <Link
        href="/create"
        className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full bg-bg/80 px-5 py-2.5 text-[13px] text-fg backdrop-blur ring-1 ring-fg/20"
      >
        ← Back to editor
      </Link>
    </>
  );
}
