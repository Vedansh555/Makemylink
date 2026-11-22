import type { Metadata } from "next";

export const metadata: Metadata = { title: "Log in · Showz", description: "Log in to edit your Showz page." };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
