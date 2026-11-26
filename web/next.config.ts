import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

// 'unsafe-inline' is needed by Next's inline bootstrap scripts and Tailwind/motion styles.
// Tighten with nonces later (see PRODUCTION.md).
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://checkout.razorpay.com${isProd ? "" : " 'unsafe-eval'"}`,
  "frame-src https://api.razorpay.com https://checkout.razorpay.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://lumberjack.razorpay.com https://*.r2.cloudflarestorage.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const nextConfig: NextConfig = {
  // Lets a test build run in its own folder while the dev server keeps using .next.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  poweredByHeader: false,
  serverExternalPackages: ["pg", "@electric-sql/pglite"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: 'camera=(), microphone=(), geolocation=(), payment=(self "https://api.razorpay.com" "https://checkout.razorpay.com")' },
        ],
      },
    ];
  },
};

export default nextConfig;
