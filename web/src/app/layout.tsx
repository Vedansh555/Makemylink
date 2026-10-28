import type { Metadata, Viewport } from "next";
import {
  Bodoni_Moda,
  Inter,
  Instrument_Serif,
  Space_Grotesk,
  Syne,
  Unbounded,
} from "next/font/google";
import "./globals.css";
import { SITE_URL } from "@/lib/site";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});
const syne = Syne({ variable: "--font-syne", subsets: ["latin"], weight: ["500", "700", "800"] });
const bodoni = Bodoni_Moda({
  variable: "--font-bodoni",
  subsets: ["latin"],
  style: ["normal", "italic"],
});
const unbounded = Unbounded({ variable: "--font-unbounded", subsets: ["latin"] });
const grotesk = Space_Grotesk({ variable: "--font-grotesk", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Makemylink: one link for everything you do",
  description:
    "Put your links, products, videos and contact on one beautiful page. Low fees on sales, and 0% on Pro. Pay in rupees or dollars.",
  openGraph: {
    title: "Makemylink: one link for everything you do",
    description: "One beautiful page for your links, products, videos and contact.",
    type: "website",
    siteName: "Makemylink",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${instrument.variable} ${syne.variable} ${bodoni.variable} ${unbounded.variable} ${grotesk.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
