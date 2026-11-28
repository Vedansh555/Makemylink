import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BioPage } from "@/components/bio/BioPage";
import { getDemoProfile } from "@/lib/demo";
import { hasContent, pageByHandle } from "@/lib/account";
import { applyPlan, publicProfile, type PlanId } from "@/lib/plans";
import { run } from "@/lib/db";
import { SITE_URL } from "@/lib/site";
import type { Profile } from "@/lib/types";
import { latestVideo } from "@/lib/youtube";

export const dynamic = "force-dynamic";

async function load(handle: string): Promise<{ profile: Profile; plan: PlanId; pageId?: string; indexable: boolean; verifiedLabel?: string | null } | null> {
  try {
    const page = await pageByHandle(handle);
    if (page) return { profile: publicProfile(applyPlan(page.profile, page.plan)), plan: page.plan, pageId: page.id, verifiedLabel: page.verifiedLabel, indexable: page.emailVerified && hasContent(JSON.stringify(page.profile)) };
  } catch (err) {
    console.error("Error looking up handle in DB:", err);
  }
  const demo = getDemoProfile(handle.toLowerCase());
  return demo ? { profile: demo, plan: "pro", indexable: true } : null;
}

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await params;
  const found = await load(handle);
  if (!found) return {};
  const { profile } = found;
  const title = `${profile.name} (@${profile.handle})`;
  const description = profile.bio || `${profile.name}'s links, shop and bookings on Showz.`;
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/${profile.handle}` },
    // New pages stay out of search until the owner confirms their email and adds content.
    robots: found.indexable ? undefined : { index: false, follow: false },
    openGraph: { title, description, url: `${SITE_URL}/${profile.handle}`, type: "profile", images: profile.avatar?.startsWith("https://") ? [profile.avatar] : undefined },
    twitter: { card: "summary", title, description },
  };
}

const BOT = /bot|crawl|spider|slurp|facebookexternalhit|preview|headless|monitor|uptime/i;

export default async function CreatorPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const found = await load(handle);
  if (!found) notFound();

  if (found.pageId) {
    const h = await headers();
    if (!BOT.test(h.get("user-agent") ?? "")) {
      const country = h.get("cf-ipcountry") ?? h.get("x-vercel-ip-country") ?? null;
      run("INSERT INTO events (page_id, kind, target, country, created_at) VALUES ($1, 'view', NULL, $2, $3)", [found.pageId, country, Date.now()]).catch(() => {});
    }
  }

  const { plan } = found;
  // "Latest video" cards: look up the newest upload so the page updates itself.
  const profile: Profile = {
    ...found.profile,
    links: await Promise.all(found.profile.links.map(async (l) => (l.kind === "youtube" && l.url ? { ...l, video: (await latestVideo(l.url)) ?? undefined } : l))),
  };
  const sameAs = Object.entries(profile.socials)
    .filter(([k, v]) => v && k !== "email")
    .map(([k, v]) => {
      const u = String(v).replace(/^@/, "");
      return /^https?:/.test(u) ? u : `https://${k === "instagram" ? "instagram.com" : k === "tiktok" ? "tiktok.com/@" : k === "youtube" ? "youtube.com/@" : "pinterest.com"}${k === "instagram" ? "/" : ""}${u}`;
    });
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: {
      "@type": "Person",
      name: profile.name,
      alternateName: `@${profile.handle}`,
      description: profile.bio,
      url: `${SITE_URL}/${profile.handle}`,
      sameAs,
      ...(profile.location ? { homeLocation: { "@type": "Place", name: profile.location } } : {}),
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      {!found.pageId && (
        <Link href="/start" className="fixed left-1/2 top-3 z-[60] -translate-x-1/2 whitespace-nowrap rounded-full border border-black/10 bg-white/90 px-3.5 py-1.5 text-[12px] font-medium text-[#111] shadow-sm backdrop-blur">
          Example page, not a real person · Make yours
        </Link>
      )}
      <BioPage profile={profile} plan={plan} live={!!found.pageId} verified={found.verifiedLabel} />
    </>
  );
}
