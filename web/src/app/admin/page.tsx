import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { adminUserId } from "@/lib/admin";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };
export const dynamic = "force-dynamic";

// Anyone who is not an admin sees an ordinary 404, so the page's existence isn't advertised.
export default async function AdminPage() {
  if (!(await adminUserId())) notFound();
  return <AdminPanel />;
}
