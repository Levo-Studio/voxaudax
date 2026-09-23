import Link from "next/link";

import { FormerTag } from "@/components/former-tag";
import type { ArticleTeaser } from "@/lib/queries";
import { longDate, machineDate, shortDate } from "@/lib/format";
import { articleHref } from "@/lib/routes";

/**
 * One line of the archive. Its own component because two places draw it now:
 * the page renders the first twenty on the server, and "mehr laden" appends
 * the rest from the browser — and a second copy of this markup would drift
 * from the first on the next change to it.
 *
 * The rule is on the top edge, so a list of rows needs no separator between
 * them and the last one closes itself.
 */
export function ArchiveRow({
  article,
  last = false,
}: {
  article: ArticleTeaser;
  last?: boolean;
}) {
  return (
    <Link
      href={articleHref(article.slug)}
      className={`group block border-t border-bd py-[17px] md:py-5 ${last ? "border-b" : ""}`}
    >
      <span className="block text-[11.5px] font-semibold text-tm md:text-xs">
        {article.categoryName} ·{" "}
        <time dateTime={machineDate(article.publishedAt)}>
          <span className="md:hidden">{shortDate(article.publishedAt)}</span>
          <span className="hidden md:inline">{longDate(article.publishedAt)}</span>
        </time>
        <span className="hidden md:inline">
          {" "}
          · {article.authorName}
          {article.authorFormer ? <FormerTag /> : null}
        </span>
      </span>
      {/* A measure of its own now that the column is the whole page: a headline
          set across 1900px is one long line to track. */}
      <span className="mt-1.5 block text-[18px] leading-[1.24] font-bold tracking-[-0.02em] transition-colors group-hover:text-ac md:mt-[7px] md:max-w-[62ch] md:text-[23px] md:leading-[1.2] md:tracking-[-0.028em]">
        {article.title}
      </span>
    </Link>
  );
}
