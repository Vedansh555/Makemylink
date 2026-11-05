import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BioPage } from "@/components/bio/BioPage";
import { BookingPage } from "@/components/bio/BookingPage";
import { getDemoProfile } from "@/lib/demo";
import { pageByHandle } from "@/lib/account";
import { applyPlan, linkIsLive, publicProfile, type PlanId } from "@/lib/plans";
import { linkForSlug } from "@/lib/share";
import { latestVideo } from "@/lib/youtube";
import { SITE_URL } from "@/lib/site";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

async function load(handle: string): Promise<{ profile: Profile; plan: PlanId; live: boolean } | null> {
  try {
    const page = await pageByHandle(handle);
    if (page) return { profile: publicProfile(applyPlan(page.profile, page.plan)), plan: page.plan, live: true };
  } catch (err) {
    console.error("share page lookup failed", err);
  }
  const demo = getDemoProfile(handle.toLowerCase());
  return demo ? { profile: demo, plan: "pro", live: false } : null;
}

/** The page for one card or product only, in the creator's own theme. */
async function focus(handle: string, item: string) {
  const found = await load(handle);
  if (!found) return null;
  const { profile } = found;
  const link = linkForSlug(item, profile.links.filter((l) => linkIsLive(l)));
  const look = link ? undefined : profile.looks.find((l) => l.id === item);
  if (!link && !look) return null;
  let only: Profile = { ...profile, bio: "", location: undefined, socials: {}, showSubscribe: false, showMediaKit: false, looks: [], links: [] };
  if (link) {
    const video = link.kind === "youtube" && link.url ? ((await latestVideo(link.url)) ?? undefined) : undefined;
    only = { ...only, links: [{ ...link, video, size: "2x1", featured: true }] };
  } else if (look) {
    only = { ...only, looks: [look], shopTitle: "" };
  }
  return { only, booking: link?.kind === "booking" && link.booking ? link : null, plan: found.plan, live: found.live, title: link?.title ?? look!.title, name: profile.name, handle: profile.handle };
}

export async function generateMetadata({ params }: { params: Promise<{ handle: string; item: string }> }): Promise<Metadata> {
  const { handle, item } = await params;
  const f = await focus(handle, item);
  if (!f) return {};
  const title = `${f.title} · ${f.name}`;
  return {
    title,
    robots: { index: false, follow: true },
    alternates: { canonical: `${SITE_URL}/${f.handle}` },
    openGraph: { title, url: `${SITE_URL}/${f.handle}/${item}`, type: "website", images: f.only.avatar?.startsWith("https://") ? [f.only.avatar] : undefined },
    twitter: { card: "summary", title },
  };
}

export default async function SharedItemPage({ params }: { params: Promise<{ handle: string; item: string }> }) {
  const { handle, item } = await params;
  const f = await focus(handle, item);
  if (!f) notFound();
  if (f.booking) return <BookingPage profile={f.only} link={f.booking} live={f.live} />;
  return <BioPage profile={f.only} plan={f.plan} live={f.live} seeAll={`/${f.handle}`} />;
}
