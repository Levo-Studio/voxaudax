import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const site = siteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Health, authentication and the backoffice answer no reader's question.
      // This only keeps crawlers away; that an address found elsewhere still
      // stays out of the index is said in app/admin/layout.tsx.
      disallow: ["/api/", "/admin"],
    },
    sitemap: new URL("/sitemap.xml", site).toString(),
  };
}
