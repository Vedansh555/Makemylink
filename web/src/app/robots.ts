import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Search and AI crawlers are welcome on public pages and the blog; private app screens and the API are not.
const PRIVATE = ["/api/", "/create", "/preview", "/login", "/signup", "/dashboard", "/admin", "/forgot", "/reset"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE },
      { userAgent: ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-SearchBot", "PerplexityBot", "Google-Extended"], allow: ["/", "/llms.txt"], disallow: PRIVATE },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
