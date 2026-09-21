/**
 * `%` and `_` are wildcards to `ilike`, so a search field handed straight to it
 * answers every article for `%` and every article with at least one character
 * for `_` — and answers "50%" or "AG_Sport" with rows that contain neither.
 * The three characters that mean something to the pattern language are escaped,
 * and the query names the escape character rather than trusting the server's
 * default for it.
 */
export const LIKE_ESCAPE = "\\";

const META = /[\\%_]/g;

export const likeContains = (query: string) =>
  `%${query.replace(META, (character) => `${LIKE_ESCAPE}${character}`)}%`;
