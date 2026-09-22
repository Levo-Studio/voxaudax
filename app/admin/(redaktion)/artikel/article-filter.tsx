"use client";

import type { Route } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

/**
 * Searching and sorting without a button to press. The list narrows as the
 * query is typed and reorders the moment the order is chosen — the button only
 * ever stood between the two.
 *
 * It stays a real GET form around a submit that is only reachable without
 * script, so the page still works with the script switched off and the address
 * is the whole state of the list either way.
 */
const SETTLE_MS = 180;

export function ArticleFilter({
  query,
  sort,
  sorts,
}: {
  query: string;
  sort: string;
  sorts: readonly { readonly key: string; readonly label: string }[];
}) {
  const router = useRouter();
  const current = useSearchParams();

  /**
   * Built here rather than handed down: a function cannot cross from a server
   * component into a client one, and the status and author filters this has to
   * preserve are already in the address it is reading.
   */
  const hrefFor = (next: { q?: string; sort?: string }) => {
    const search = new URLSearchParams(current.toString());

    for (const [key, value] of Object.entries(next)) {
      if (value === undefined || value.length === 0 || (key === "sort" && value === "changed")) {
        search.delete(key);
      } else {
        search.set(key, value);
      }
    }

    const written = search.toString();
    return written.length === 0 ? "/admin/artikel" : `/admin/artikel?${written}`;
  };

  const [, startNavigation] = useTransition();
  const [text, setText] = useState(query);

  // What the address already says, so a query arriving from elsewhere — a
  // status pill, the back button — can be told apart from the one this field
  // asked for, and only the former overwrites what is typed.
  const asked = useRef(query);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (query === asked.current) return;
    asked.current = query;
    setText(query);
  }, [query]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const go = (href: string) =>
    startNavigation(() => router.replace(href as Route, { scroll: false }));

  return (
    <form action="/admin/artikel" method="get" className="flex flex-wrap items-center gap-2 border-b border-bd px-4 py-3 md:px-[22px]">
      <input
        type="search"
        name="q"
        value={text}
        onChange={(event) => {
          const written = event.target.value;
          setText(written);
          clearTimeout(timer.current);
          timer.current = setTimeout(() => {
            asked.current = written.trim();
            go(hrefFor({ q: written.trim() }));
          }, SETTLE_MS);
        }}
        placeholder="Titel oder Teaser durchsuchen"
        aria-label="Artikel durchsuchen"
        autoComplete="off"
        className="h-[38px] min-w-0 flex-1 rounded-lg border border-bd bg-s2 px-[11px] font-control text-[13.5px] font-semibold text-tx outline-ac placeholder:text-tm"
      />
      <label className="flex items-center gap-2 text-[12.5px] font-semibold text-tm">
        Sortieren
        <select
          name="sort"
          value={sort}
          onChange={(event) => go(hrefFor({ sort: event.target.value }))}
          className="h-[38px] rounded-lg border border-bd bg-s2 px-2.5 font-control text-[12.5px] font-semibold text-tx outline-ac"
        >
          {sorts.map((one) => (
            <option key={one.key} value={one.key}>
              {one.label}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" className="sr-only">
        Anwenden
      </button>
    </form>
  );
}
