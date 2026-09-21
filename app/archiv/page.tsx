import type { Metadata } from "next";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { formatNumber, longDate, machineDate, shortDate } from "@/lib/format";
import {
  archiveResults,
  articleCategories,
  publishedArticleCount,
  publishedAuthors,
  publishedYears,
} from "@/lib/queries";
import { ARCHIVE_PARAMS, archiveHref, articleHref } from "@/lib/routes";

type SearchParams = Record<string, string | string[] | undefined>;

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
    (key) => parameters[key] !== undefined,
  );

  return {
    title: "Archiv",
    description: "Alle veröffentlichten Beiträge der Vox Audax.",
    robots: narrowed ? { index: false, follow: true } : undefined,
    alternates: narrowed ? { canonical: "/archiv" } : undefined,
  };
};

const single = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const positiveYear = (value: string | undefined) => {
  if (value === undefined) return undefined;
  const year = Number.parseInt(value, 10);
  return Number.isInteger(year) && year > 1900 && year < 2200 ? year : undefined;
};

type MenuOption = { label: string; href: string; current: boolean };

/**
 * A filter is a menu of links, not a control that fetches: opening it needs no
 * script, choosing from it is a navigation, and the address that results is the
 * whole state of the page — so a filtered archive can be bookmarked and sent.
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
    <details className="relative">
      <summary
        className={`inline-flex min-h-11 cursor-pointer list-none items-center rounded-full px-3 text-xs font-semibold [&::-webkit-details-marker]:hidden md:min-h-0 md:px-[13px] md:py-[7px] md:text-[12.5px] ${
          active ? "bg-ac text-s1" : "border border-bd text-tm"
        }`}
      >
        {value ?? label}
      </summary>
      <div className="absolute z-10 mt-2 flex min-w-[200px] flex-col rounded-xl border border-bd bg-s1 p-1.5 shadow-lg">
        {options.map((option) => (
          <a
            key={option.href}
            href={option.href}
            aria-current={option.current ? "true" : undefined}
            className={`flex min-h-11 items-center rounded-lg px-3 text-[13px] font-semibold md:min-h-0 md:py-2 ${
              option.current ? "text-ac" : "text-tx"
            }`}
          >
            {option.label}
          </a>
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
  const query = single(parameters[ARCHIVE_PARAMS.query])?.trim();
  const category = single(parameters[ARCHIVE_PARAMS.category]);
  const year = positiveYear(single(parameters[ARCHIVE_PARAMS.year]));
  const author = single(parameters[ARCHIVE_PARAMS.author]);

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

        <form action="/archiv" method="get">
          <label className="mt-4 flex items-center gap-2.5 rounded-xl border border-bd px-[15px] py-[13px] md:mt-[22px] md:gap-3 md:px-[18px] md:py-[15px]">
            <span className="sr-only">Im Archiv suchen</span>
            <input
              type="search"
              name={ARCHIVE_PARAMS.query}
              defaultValue={query}
              placeholder="Suchen"
              className="min-w-0 flex-1 bg-transparent text-[15px] font-semibold text-tx outline-none placeholder:text-tm"
            />
            <span className="text-[11.5px] font-semibold whitespace-nowrap text-tm md:text-[12.5px]">
              {formatNumber(results.length)} von {formatNumber(total)}
            </span>
          </label>

          {/* The other filters travel with the search so submitting the field
              narrows the list the reader is looking at rather than resetting it. */}
          {category === undefined ? null : (
            <input type="hidden" name={ARCHIVE_PARAMS.category} value={category} />
          )}
          {year === undefined ? null : (
            <input type="hidden" name={ARCHIVE_PARAMS.year} value={year} />
          )}
          {author === undefined ? null : (
            <input type="hidden" name={ARCHIVE_PARAMS.author} value={author} />
          )}
          <button type="submit" className="sr-only">
            Suchen
          </button>
        </form>

        <div className="mt-3 flex flex-wrap gap-[7px] md:mt-3.5">
          <FilterMenu
            label="Alle Kategorien"
            value={activeCategory?.name}
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
            value={activeAuthor?.name}
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
              <a
                key={article.slug}
                href={articleHref(article.slug)}
                className={`block border-t border-bd py-[17px] md:py-5 ${
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
                <span className="mt-1.5 block text-[18px] leading-[1.24] font-bold tracking-[-0.02em] md:mt-[7px] md:text-[23px] md:leading-[1.2] md:tracking-[-0.028em]">
                  {article.title}
                </span>
              </a>
            ))}
          </div>
        )}

        {filtered ? (
          <a
            href={archiveHref()}
            className="mt-3.5 inline-flex min-h-11 items-center text-[13px] font-bold text-tm md:mt-6 md:min-h-0"
          >
            Filter zurücksetzen
          </a>
        ) : null}
      </main>

      <SiteFooter />
    </div>
  );
}
