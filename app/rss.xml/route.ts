import { environment } from "@/lib/env";
import { everyPublishedArticle } from "@/lib/queries";
import { articleHref } from "@/lib/routes";

export const revalidate = 300;

/** The twenty most recent, which is what a reader's feed reader needs. */
const FEED_LENGTH = 20;

const escape = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * Built where the database is unreachable: an empty feed beats a failed build,
 * and the revalidate window fills it on the first request after deployment.
 */
const recentArticlesOrNoneAtBuildTime = async () => {
  try {
    return await everyPublishedArticle();
  } catch {
    return [];
  }
};

export const GET = async () => {
  const site = environment().NEXT_PUBLIC_SITE_URL;
  const articles = (await recentArticlesOrNoneAtBuildTime()).slice(
    0,
    FEED_LENGTH,
  );
  const url = (path: string) => new URL(path, site).toString();

  const items = articles
    .map((article) =>
      [
        "    <item>",
        `      <title>${escape(article.title)}</title>`,
        `      <link>${escape(url(articleHref(article.slug)))}</link>`,
        `      <guid isPermaLink="true">${escape(url(articleHref(article.slug)))}</guid>`,
        `      <description>${escape(article.teaser)}</description>`,
        `      <category>${escape(article.categoryName)}</category>`,
        // dc:creator rather than author, which RSS defines as an address and
        // the editorial team does not publish one per person.
        `      <dc:creator>${escape(article.authorName)}</dc:creator>`,
        `      <pubDate>${article.publishedAt.toUTCString()}</pubDate>`,
        "    </item>",
      ].join("\n"),
    )
    .join("\n");

  const feed = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">',
    "  <channel>",
    "    <title>Vox Audax</title>",
    `    <link>${escape(site)}</link>`,
    "    <description>Schülerzeitung des Uhland-Gymnasiums</description>",
    "    <language>de-DE</language>",
    `    <atom:link href="${escape(url("/rss.xml"))}" rel="self" type="application/rss+xml"/>`,
    items,
    "  </channel>",
    "</rss>",
  ].join("\n");

  return new Response(feed, {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "public, max-age=300",
    },
  });
};
