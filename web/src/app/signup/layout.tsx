import type { Metadata } from "next";

export const metadata: Metadata = { title: "Create your free page · Showz", description: "Sign up for Showz and get your page live in two minutes." };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
