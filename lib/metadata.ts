import type { Metadata } from "next";

/**
 * Next replaces a nested metadata object wholesale where a page sets one; it
 * does not merge it into the layout's. A page that names its own canonical
 * would therefore drop the feed link along with it, so both are built here and
 * no page can name the one without the other.
 */
export const alternates = (canonical: string): Metadata["alternates"] => ({
  canonical,
  types: { "application/rss+xml": "/rss.xml" },
});
