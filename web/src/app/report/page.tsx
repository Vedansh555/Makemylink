import type { Metadata } from "next";
import { LegalPage } from "@/components/landing/LegalPage";
import { LEGAL_UPDATED } from "@/lib/legal";
import { ReportForm } from "./ReportForm";

export const metadata: Metadata = { title: "Report a page · Showz", robots: { index: false } };

export default async function Report({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page } = await searchParams;
  return (
    <LegalPage title="Report a page" updated={LEGAL_UPDATED}>
      <p className="!mt-0 !mb-6">Tell us about a page that scams people, pretends to be someone, or breaks our rules. A person checks every report.</p>
      <ReportForm initial={String(page ?? "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 30)} />
    </LegalPage>
  );
}
