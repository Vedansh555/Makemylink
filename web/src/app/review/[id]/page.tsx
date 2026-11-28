import type { Metadata } from "next";
import { one } from "@/lib/db";
import { actionOk } from "@/lib/bookingActions";
import { pageByHandle } from "@/lib/account";
import { Logo } from "@/components/landing/Nav";
import { ReviewForm } from "@/components/bio/ReviewForm";

export const metadata: Metadata = { title: "Review your session · Showz", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function ReviewPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ k?: string }> }) {
  const { id } = await params;
  const { k } = await searchParams;
  const ok = !!k && actionOk(id, "review", k);
  const bk = ok ? await one<{ buyer_name: string; link_id: string; handle: string; status: string; reviewed: string | null }>("SELECT b.buyer_name, b.link_id, b.status, p.handle, r.id AS reviewed FROM bookings b JOIN pages p ON p.id = b.page_id LEFT JOIN buyer_reviews r ON r.booking_id = b.id WHERE b.id = $1", [id]) : null;
  const page = bk ? await pageByHandle(bk.handle) : null;
  const title = page?.profile.links.find((l) => l.id === bk?.link_id)?.title;

  return (
    <main className="relative grid min-h-screen grid-cols-[minmax(0,1fr)] place-items-center overflow-x-clip bg-bg px-4 py-16 text-fg">
      <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-[420px] max-w-[900px] bg-[radial-gradient(closest-side,var(--hero-glow),transparent)] opacity-80" />
      <div className="relative w-full min-w-0 max-w-md">
        <div className="mb-8 flex justify-center"><Logo /></div>
        <div className="rounded-[28px] border border-fg/10 bg-fg/[0.03] p-6 sm:p-8">
          {!bk || bk.status !== "confirmed" || !page ? (
            <>
              <h1 className="font-display text-[clamp(30px,8.5vw,38px)] italic leading-[1.05] [overflow-wrap:anywhere]">This link isn&apos;t valid</h1>
              <p className="mt-3 text-[14px] text-fg/60">It may be incomplete. Open the link from your email again.</p>
            </>
          ) : bk.reviewed ? (
            <>
              <h1 className="font-display text-[clamp(30px,8.5vw,38px)] italic leading-[1.05] [overflow-wrap:anywhere]">Thank you!</h1>
              <p className="mt-3 text-[14px] text-fg/60">You already reviewed this session.</p>
            </>
          ) : (
            <>
              <h1 className="font-display text-[clamp(34px,8vw,42px)] italic leading-[1]">How was your session?</h1>
              <p className="mt-3 text-[14px] text-fg/60">
                <b className="text-fg">{title ?? "Your session"}</b> with {page.profile.name}. A few honest words help others decide.
              </p>
              <ReviewForm id={id} k={k!} defaultName={bk.buyer_name} host={page.profile.name} />
            </>
          )}
        </div>
      </div>
    </main>
  );
}
