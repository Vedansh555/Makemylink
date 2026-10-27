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
  title: "Linkss: one link for everything you do",
  description:
    "Put your links, products, videos and contact on one beautiful page. 0% fees on sales. Pay in rupees or dollars.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0c" },
    { media: "(prefers-color-scheme: light)", color: "#f5f4f1" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Apply the saved light/dark choice before the first paint, so the page never flashes. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var m=localStorage.getItem("linkss:mode");if(m==="light"||m==="dark")document.documentElement.dataset.theme=m}catch(e){}`,
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${instrument.variable} ${syne.variable} ${bodoni.variable} ${unbounded.variable} ${grotesk.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
