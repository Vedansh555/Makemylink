import type { Metadata, Viewport } from "next";
import {
  Bodoni_Moda,
  Bricolage_Grotesque,
  Fredoka,
  Inter,
  Instrument_Serif,
  Space_Grotesk,
  Syne,
  Unbounded,
} from "next/font/google";
import "./globals.css";
import { SITE_URL } from "@/lib/site";
import { CookieNotice } from "@/components/CookieNotice";

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
const bricolage = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"], weight: ["500", "700", "800"] });
const fredoka = Fredoka({ variable: "--font-fredoka", subsets: ["latin"], weight: ["400", "500", "600"] });
const unbounded = Unbounded({ variable: "--font-unbounded", subsets: ["latin"] });
const grotesk = Space_Grotesk({ variable: "--font-grotesk", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Showz: your whole business in one link",
  description:
    "Take paid bookings, show off your products and grow your email list from one beautiful page. 0% Showz commission, UPI and cards, free to start.",
  openGraph: {
    title: "Showz: your whole business in one link",
    description: "Paid bookings, products and an email list on one beautiful page. 0% Showz commission.",
    type: "website",
    siteName: "Showz",
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
        className={`${inter.variable} ${instrument.variable} ${syne.variable} ${bodoni.variable} ${unbounded.variable} ${grotesk.variable} ${bricolage.variable} ${fredoka.variable} antialiased`}
      >
        {children}
        <CookieNotice />
      </body>
    </html>
  );
}
