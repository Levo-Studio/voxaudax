import type { Route } from "next";

/**
 * Every public address in one place. Category and author are filters on the
 * archive and have no page of their own, so the only way to link to "everything
 * by Lina Brenner" is a filtered archive URL — which is also the only way for a
 * reader to send one to somebody else.
 */

export const ARCHIVE_PARAMS = {
  query: "q",
  category: "kategorie",
  year: "jahr",
  author: "autor",
} as const;

/**
 * Generic so the literal type survives: with typed routes on, a redirect only
 * accepts an address the router knows, and a plain `string` is not one.
 */
export const articleHref = <Slug extends string>(slug: Slug) =>
  `/artikel/${slug}` as const;

export type ArchiveLink = {
  query?: string;
  category?: string;
  year?: number;
  author?: string;
};

export const archiveHref = (link: ArchiveLink = {}) => {
  const parameters = new URLSearchParams();

  if (link.query !== undefined && link.query.length > 0) {
    parameters.set(ARCHIVE_PARAMS.query, link.query);
  }
  if (link.category !== undefined) {
    parameters.set(ARCHIVE_PARAMS.category, link.category);
  }
  if (link.year !== undefined) {
    parameters.set(ARCHIVE_PARAMS.year, String(link.year));
  }
  if (link.author !== undefined) {
    parameters.set(ARCHIVE_PARAMS.author, link.author);
  }

  const query = parameters.toString();

  // Typed routes cannot see that a hand-built query string still addresses
  // /archiv, and the filters are exactly that: one page read four ways.
  return (query.length === 0 ? "/archiv" : `/archiv?${query}`) as Route;
};

export const imageHref = (imageId: string) => `/bild/${imageId}`;
