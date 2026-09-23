/**
 * What to put on a link that leaves the newspaper.
 *
 * Every address this application writes for itself is a path — `articleHref`,
 * `archiveHref`, `imageHref` all return one — so an absolute http address is by
 * definition somewhere else, and that is the whole test. No origin to compare
 * against, nothing to configure, and the same answer on the server and in the
 * browser.
 *
 * `mailto:` and `tel:` are left alone on purpose. They hand over to another
 * program rather than to a page, and a tab opened for them stays behind empty.
 *
 * `noopener` is not decoration: without it the opened page can reach back
 * through `window.opener` and navigate the one it came from. `noreferrer`
 * keeps the reader's path off the other end's logs, which for a school
 * newspaper linking out is the polite default.
 */
const ABSOLUTE = /^https?:\/\//i;

export const leavesTheSite = (href: string) => ABSOLUTE.test(href.trim());

export const outward = (href: string) =>
  leavesTheSite(href)
    ? ({ target: "_blank", rel: "noopener noreferrer" } as const)
    : ({} as const);

/** The repository this newspaper is built from, named once. */
export const SOURCE_URL = "https://github.com/Levo-Studio/voxaudax";
