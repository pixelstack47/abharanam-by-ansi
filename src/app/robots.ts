import type { MetadataRoute } from "next";
import { SITE_URL } from "@/data/site";

// Baked at build time for the static export.
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Personal, session-specific pages carry no crawlable value.
      disallow: ["/account", "/wishlist"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
