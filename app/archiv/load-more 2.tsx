"use client";

import { useState, useTransition } from "react";

import { ArchiveRow } from "@/components/archive-row";
import { moreArchiveAction } from "@/app/archiv/actions";
import type { ArticleTeaser } from "@/lib/queries";
import type { ArchiveFilters } from "@/lib/queries";

/**
 * "Mehr laden" under the archive.
 *
 * A button and not an endless scroll: the footer of this page carries the
 * imprint and the privacy statement, and a list that grows as you approach it
 * is a list nobody ever reaches the bottom of. The button also says what it
 * will do, which a scroll does not.
 *
 * The rows it appends are rendered by the same component the server used, so
 * the twenty-first line cannot look different from the twentieth.
 */
export function LoadMore({
  filters,
  loaded,
}: {
  filters: ArchiveFilters;
  /** How many the server already drew, which is where the next page starts. */
  loaded: number;
}) {
  const [rows, setRows] = useState<ArticleTeaser[]>([]);
  const [more, setMore] = useState(true);
  const [problem, setProblem] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const fetchMore = () =>
    start(async () => {
      setProblem(null);
      const answer = await moreArchiveAction(filters, loaded + rows.length);

      if (answer === null) {
        setProblem("Das ließ sich gerade nicht laden. Noch einmal versuchen?");
        return;
      }

      setRows([...rows, ...answer.rows]);
      setMore(answer.hasMore);
    });

  return (
    <>
      {rows.map((article, position) => (
        <ArchiveRow
          key={article.slug}
          article={article}
          last={!more && position === rows.length - 1}
        />
      ))}

      {problem === null ? null : (
        <p role="alert" className="mt-4 text-[13px] font-semibold text-ac2">
          {problem}
        </p>
      )}

      {more ? (
        <button
          type="button"
          onClick={fetchMore}
          disabled={pending}
          // `aria-busy` rather than a spinner: the label says what is happening
          // and a reader on a slow line gets the same sentence either way.
          aria-busy={pending}
          className="mt-5 inline-flex min-h-11 cursor-pointer items-center self-start rounded-[10px] border border-bd bg-transparent px-[18px] font-control text-[13.5px] font-bold text-tx transition-colors duration-200 ease-out hover:border-ac disabled:cursor-not-allowed disabled:opacity-45 md:mt-7"
        >
          {pending ? "Wird geladen …" : "Mehr laden"}
        </button>
      ) : null}
    </>
  );
}
