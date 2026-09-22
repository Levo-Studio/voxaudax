"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { formatNumber } from "@/lib/format";
import { ARCHIVE_PARAMS, archiveHref, type ArchiveLink } from "@/lib/routes";

/** Long enough that a typed word costs one request, short enough to feel typed. */
const SETTLE_MS = 180;

/**
 * The field searches while it is typed, but it stays a GET form around a real
 * submit button: what it does on every keystroke is exactly what the form would
 * do on submit, so the archive still works with the script switched off, and the
 * address still holds the whole state of the page either way.
 */
export function ArchiveSearch({
  filters,
  query,
  shown,
  total,
}: {
  filters: Omit<ArchiveLink, "query">;
  query: string | undefined;
  shown: number;
  total: number;
}) {
  const router = useRouter();
  const [, startNavigation] = useTransition();
  const [text, setText] = useState(query ?? "");

  // What the address already says, so a query arriving from anywhere else — a
  // filter chip, the reset link, the back button — can be told apart from the
  // one this field just asked for, and only the former overwrites what is typed.
  const asked = useRef(query ?? "");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if ((query ?? "") === asked.current) return;
    asked.current = query ?? "";
    setText(query ?? "");
  }, [query]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const type = (value: string) => {
    setText(value);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const trimmed = value.trim();
      asked.current = trimmed;
      startNavigation(() => {
        // replace, not push: a search typed letter by letter would otherwise
        // leave one history entry per letter to walk back through.
        router.replace(
          archiveHref({ ...filters, query: trimmed === "" ? undefined : trimmed }),
          { scroll: false },
        );
      });
    }, SETTLE_MS);
  };

  return (
    <form action="/archiv" method="get">
      {/* va-search hands the field's focus ring to the box around it — see the
          rule in globals.css. The box is already an outline; a second one
          floating 3px outside it was what the ring looked like. */}
      <label className="va-search mt-4 flex items-center gap-2.5 rounded-xl border border-bd px-[15px] py-[13px] transition-colors focus-within:border-ac focus-within:ring-1 focus-within:ring-ac md:mt-[22px] md:gap-3 md:px-[18px] md:py-[15px]">
        <span className="sr-only">Im Archiv suchen</span>
        <input
          type="search"
          name={ARCHIVE_PARAMS.query}
          value={text}
          onChange={(event) => type(event.target.value)}
          placeholder="Suchen"
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent text-[15px] font-semibold text-tx placeholder:text-tm"
        />
        <span className="text-[11.5px] font-semibold whitespace-nowrap text-tm md:text-[12.5px]">
          {formatNumber(shown)} von {formatNumber(total)}
        </span>
      </label>

      {/* The other filters travel with the search so submitting the field
          narrows the list the reader is looking at rather than resetting it. */}
      {filters.category === undefined ? null : (
        <input type="hidden" name={ARCHIVE_PARAMS.category} value={filters.category} />
      )}
      {filters.year === undefined ? null : (
        <input type="hidden" name={ARCHIVE_PARAMS.year} value={filters.year} />
      )}
      {filters.author === undefined ? null : (
        <input type="hidden" name={ARCHIVE_PARAMS.author} value={filters.author} />
      )}
      <button type="submit" className="sr-only">
        Suchen
      </button>
    </form>
  );
}
