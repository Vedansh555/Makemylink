import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BioPage } from "@/components/bio/BioPage";
import { getDemoProfile } from "@/lib/demo";
import { getDb } from "@/lib/db";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

function getProfile(handle: string): Profile | null {
  const cleanHandle = handle.toLowerCase();
  try {
    const db = getDb();
    const page = db.prepare("SELECT profile_json FROM pages WHERE handle = ?").get(cleanHandle) as
      | { profile_json: string }
      | undefined;

    if (page?.profile_json) {
      return JSON.parse(page.profile_json) as Profile;
    }
  } catch (err) {
    console.error("Error looking up handle in DB:", err);
  }

  // Fallback to demo profile
  return getDemoProfile(cleanHandle) ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await params;
  const profile = getProfile(handle);
  return profile ? { title: `${profile.name} (@${profile.handle}) · Linkss`, description: profile.bio } : {};
}

export default async function CreatorPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const profile = getProfile(handle);
  if (!profile) notFound();
  return <BioPage profile={profile} />;
}
