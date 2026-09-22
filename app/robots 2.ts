import type { MetadataRoute } from "next";

import { environment } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const site = environment().NEXT_PUBLIC_SITE_URL;

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Health and authentication answer no reader's question.
      disallow: ["/api/"],
    },
    sitemap: new URL("/sitemap.xml", site).toString(),
  };
}
