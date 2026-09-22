/**
 * How much of the newspaper each surface shows.
 *
 * In one file because the back office explains these numbers to the people who
 * write against them — see `components/admin/placement-note`. Typed twice they
 * drift, and an explanation that drifts is worse than none: somebody counts on
 * it and is wrong.
 *
 * No `server-only` here: these are plain numbers, and the note that prints them
 * is rendered on the client.
 */

/** The front page: one lead, three cards, six lines under them. */
export const HOMEPAGE_ARTICLES = 10;

/** Names shown as pills on the front page before the rest become "+ N weitere". */
export const HOMEPAGE_MEMBERS = 8;

/**
 * A ceiling rather than a page: the archive is one list by design, and a school
 * paper will not reach this. It is here so that an unfiltered archive cannot
 * become an unbounded read years from now.
 */
export const ARCHIVE_CEILING = 500;

/** What a feed reader is given, rather than the whole archive cut down to it. */
export const FEED_LENGTH = 20;

/** "Weiterlesen" under an article: same category first, then the newest. */
export const RELATED_COUNT = 3;

/** One screen of the meme wall, before "ältere". */
export const MEME_PAGE_SIZE = 48;
