import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets a test build run in its own folder while the dev server keeps using .next.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
