import type { MetadataRoute } from "next";

import { environment } from "@/lib/env";
import { everyPublishedArticle } from "@/lib/queries";
import { articleHref } from "@/lib/routes";

export const revalidate = 300;

/**
 * The pages a reader can reach and nothing else: the archive's filters are
 * views of the same articles, so listing them would only offer the same text
 * under a hundred addresses.
 */
const STANDING_PAGES = [
  "/",
  "/archiv",
  "/redaktion",
  "/memes",
  "/kontakt",
  "/impressum",
  "/datenschutz",
] as const;

/**
 * Built where the database is unreachable, so an absent article list yields a
 * sitemap of the standing pages rather than a failed build; the revalidate
 * window fills the articles in on the first request after deployment.
 */
const publishedArticlesOrNoneAtBuildTime = async () => {
  try {
    return await everyPublishedArticle();
  } catch {
    return [];
  }
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = environment().NEXT_PUBLIC_SITE_URL;
  // Built where the database is unreachable, so an absent article list yields a
  // sitemap of the standing pages rather than a failed build; the revalidate
  // window above fills in the articles on the first request after deployment.
  const articles = await publishedArticlesOrNoneAtBuildTime();
  const url = (path: string) => new URL(path, site).toString();

  return [
    ...STANDING_PAGES.map((path) => ({
      url: url(path),
      changeFrequency: "weekly" as const,
      priority: path === "/" ? 1 : 0.6,
    })),
    ...articles.map((article) => ({
      url: url(articleHref(article.slug)),
      lastModified: article.publishedAt,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
