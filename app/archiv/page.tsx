import type { Metadata, Route } from "next";
import Link from "next/link";

import { ArchiveSearch } from "@/components/archive-search";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { longDate, machineDate, shortDate } from "@/lib/format";
import {
  archiveResults,
  articleCategories,
  publishedArticleCount,
  publishedAuthors,
  publishedYears,
} from "@/lib/queries";
import { ARCHIVE_PARAMS, archiveHref, articleHref } from "@/lib/routes";

type SearchParams = Record<string, string | string[] | undefined>;

const single = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

/** "?q=" is an empty field, not a search: nothing is filtered by it. */
const filled = (value: string | undefined) => {
  const trimmed = value?.trim();
  return trimmed === undefined || trimmed.length === 0 ? undefined : trimmed;
};

/**
 * A filtered archive is the same articles in another order, so only the
 * unfiltered one is offered for indexing — the filters exist for readers, not
 * to multiply the site into a hundred near-identical pages.
 */
export const generateMetadata = async ({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> => {
  const parameters = await searchParams;
  const narrowed = Object.values(ARCHIVE_PARAMS).some(
    (key) => filled(single(parameters[key])) !== undefined,
  );

  return {
    title: "Archiv",
    description: "Alle veröffentlichten Beiträge der Vox Audax.",
    robots: narrowed ? { index: false, follow: true } : undefined,
    alternates: narrowed ? { canonical: "/archiv" } : undefined,
  };
};

/**
 * A filter value the archive does not recognise still narrows the list — to
 * nothing — so it has to be readable in the chip rather than hidden behind
 * "Alle Kategorien". It came out of the address bar, so it is shown at a length
 * the row can hold.
 */
const CHIP_LIMIT = 40;

const chip = (known: string | undefined, asked: string | undefined) =>
  known ?? asked?.slice(0, CHIP_LIMIT);

const positiveYear = (value: string | undefined) => {
  if (value === undefined) return undefined;
  const year = Number.parseInt(value, 10);
  return Number.isInteger(year) && year > 1900 && year < 2200 ? year : undefined;
};

type MenuOption = { label: string; href: Route; current: boolean };

/**
 * A filter is a menu of links, not a control that fetches: opening it needs no
 * script, choosing from it is a navigation, and the address that results is the
 * whole state of the page — so a filtered archive can be bookmarked and sent.
 *
 * Below md the panel is positioned against the row rather than against its own
 * chip, so it opens at the page's left margin and cannot reach past the right
 * one: anchored to the third chip it pushed a 360px page 36px sideways.
 */
function FilterMenu({
  label,
  value,
  options,
}: {
  label: string;
  value?: string;
  options: readonly MenuOption[];
}) {
  const active = value !== undefined;

  return (
    <details className="md:relative">
      <summary
        className={`inline-flex min-h-11 cursor-pointer list-none items-center rounded-full px-3 text-xs font-semibold [&::-webkit-details-marker]:hidden md:min-h-0 md:px-[13px] md:py-[7px] md:text-[12.5px] ${
          active ? "bg-ac text-s1" : "border border-bd text-tm"
        }`}
      >
        {value ?? label}
      </summary>
      <div className="absolute top-full left-0 z-10 mt-2 flex max-w-[calc(100vw-36px)] min-w-[200px] flex-col rounded-xl border border-bd bg-s1 p-1.5 shadow-lg md:top-auto md:max-w-none">
        {options.map((option) => (
          <Link
            key={option.href}
            href={option.href}
            aria-current={option.current ? "true" : undefined}
            className={`flex min-h-11 items-center rounded-lg px-3 text-[13px] font-semibold transition-colors hover:text-ac md:min-h-0 md:py-2 ${
              option.current ? "text-ac" : "text-tx"
            }`}
          >
            {option.label}
          </Link>
        ))}
      </div>
    </details>
  );
}

export default async function ArchivePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const parameters = await searchParams;
  const query = filled(single(parameters[ARCHIVE_PARAMS.query]));
  const category = filled(single(parameters[ARCHIVE_PARAMS.category]));
  const year = positiveYear(single(parameters[ARCHIVE_PARAMS.year]));
  const author = filled(single(parameters[ARCHIVE_PARAMS.author]));

  const [results, total, categories, years, authors] = await Promise.all([
    archiveResults({
      query,
      categorySlug: category,
      year,
      authorSlug: author,
    }),
    publishedArticleCount(),
    articleCategories(),
    publishedYears(),
    publishedAuthors(),
  ]);

  const filtered =
    query !== undefined || category !== undefined || year !== undefined || author !== undefined;

  const base = { query, category, year, author };
  const activeCategory = categories.find((entry) => entry.slug === category);
  const activeAuthor = authors.find((entry) => entry.slug === author);

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader current="archiv" />

      <main className="max-w-[860px] flex-1 px-[18px] pt-[22px] pb-7 md:px-10 md:pt-10 md:pb-[52px]">
        <h1 className="text-[30px] leading-[1.02] font-extrabold tracking-[-0.04em] md:text-[42px] md:leading-none">
          Archiv
        </h1>

        <ArchiveSearch
          filters={{ category, year, author }}
          query={query}
          shown={results.length}
          total={total}
        />

        <div className="relative mt-3 flex flex-wrap gap-[7px] md:mt-3.5">
          <FilterMenu
            label="Alle Kategorien"
            value={chip(activeCategory?.name, category)}
            options={[
              {
                label: "Alle Kategorien",
                href: archiveHref({ ...base, category: undefined }),
                current: category === undefined,
              },
              ...categories.map((entry) => ({
                label: entry.name,
                href: archiveHref({ ...base, category: entry.slug }),
                current: entry.slug === category,
              })),
            ]}
          />
          <FilterMenu
            label="Jahr"
            value={year === undefined ? undefined : String(year)}
            options={[
              {
                label: "Alle Jahre",
                href: archiveHref({ ...base, year: undefined }),
                current: year === undefined,
              },
              ...years.map((entry) => ({
                label: String(entry),
                href: archiveHref({ ...base, year: entry }),
                current: entry === year,
              })),
            ]}
          />
          <FilterMenu
            label="Autor"
            value={chip(activeAuthor?.name, author)}
            options={[
              {
                label: "Alle Autorinnen und Autoren",
                href: archiveHref({ ...base, author: undefined }),
                current: author === undefined,
              },
              ...authors.map((entry) => ({
                label: entry.name,
                href: archiveHref({ ...base, author: entry.slug }),
                current: entry.slug === author,
              })),
            ]}
          />
        </div>

        {results.length === 0 ? (
          <p className="mt-6 text-[17px] leading-[1.6] font-medium text-tm md:mt-8">
            Kein Beitrag passt zu dieser Suche.
          </p>
        ) : (
          <div className="mt-6 flex flex-col md:mt-[34px]">
            {results.map((article, position) => (
              <Link
                key={article.slug}
                href={articleHref(article.slug)}
                className={`group block border-t border-bd py-[17px] md:py-5 ${
                  position === results.length - 1 ? "border-b" : ""
                }`}
              >
                <span className="block text-[11.5px] font-semibold text-tm md:text-xs">
                  {article.categoryName} ·{" "}
                  <time dateTime={machineDate(article.publishedAt)}>
                    <span className="md:hidden">
                      {shortDate(article.publishedAt)}
                    </span>
                    <span className="hidden md:inline">
                      {longDate(article.publishedAt)}
                    </span>
                  </time>
                  <span className="hidden md:inline"> · {article.authorName}</span>
                </span>
                <span className="mt-1.5 block text-[18px] leading-[1.24] font-bold tracking-[-0.02em] transition-colors group-hover:text-ac md:mt-[7px] md:text-[23px] md:leading-[1.2] md:tracking-[-0.028em]">
                  {article.title}
                </span>
              </Link>
            ))}
          </div>
        )}

        {filtered ? (
          <Link
            href={archiveHref()}
            className="mt-3.5 inline-flex min-h-11 items-center text-[13px] font-bold text-tm transition-colors hover:text-tx md:mt-6 md:min-h-0"
          >
            Filter zurücksetzen
          </Link>
        ) : null}
      </main>

      <SiteFooter />
    </div>
  );
}
