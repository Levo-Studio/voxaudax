import Link from "next/link";

import { COLUMN_HEADING_CLASS, FilterPill, PANEL_CLASS, PRIMARY_BUTTON_CLASS } from "@/components/admin/controls";
import { PlacementNote } from "@/components/admin/placement-note";
import { ArticleFilter } from "@/app/admin/(redaktion)/artikel/article-filter";
import { newArticleAction } from "@/app/admin/(redaktion)/artikel/actions";
import { requireMember } from "@/lib/authorize";
import {
  countArticlesByStatus,
  isSortKey,
  countOwnArticles,
  listArticles,
  SORTS,
  STATUS_LABELS,
  type ArticleRow,
  type ArticleStatus,
} from "@/lib/editorial/articles";
import { may } from "@/lib/roles";

export const metadata = { title: "Artikel · Vox Audax Redaktion" };

const STATUSES: readonly ArticleStatus[] = ["draft", "review", "published"];

const isStatus = (value: unknown): value is ArticleStatus =>
  typeof value === "string" && (STATUSES as readonly string[]).includes(value);

const changedLabel = (at: Date) => {
  const minutes = Math.round((Date.now() - at.getTime()) / 60000);
  if (minutes < 60) return `vor ${Math.max(1, minutes)} Min`;
  if (minutes < 60 * 24) return `vor ${Math.round(minutes / 60)} Std`;
  if (minutes < 60 * 48) return "gestern";
  return at.toLocaleDateString("de-DE");
};

const SCHEDULE = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

const subtitle = (row: ArticleRow) => {
  // The whole row is a link, so the reason cannot fold out here — a `details`
  // inside an anchor navigates on the first click. It is said in one word and
  // written out on the article itself, which is where it is acted on.
  if (row.status === "draft" && row.rejectionReason !== null) {
    return `${row.categoryName} · zurückgegeben`;
  }
  if (row.status === "review") return `${row.categoryName} · wartet auf Freigabe`;
  if (row.status === "draft" && row.publishAt !== null) {
    return `${row.categoryName} · geplant für ${SCHEDULE.format(row.publishAt)}`;
  }
  return row.categoryName;
};

const ROW_GRID = "grid grid-cols-[1fr_auto] gap-y-1 md:grid-cols-[1fr_150px_128px_116px] md:gap-4";

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const member = await requireMember();
  const parameters = await searchParams;

  const status = isStatus(parameters.status) ? parameters.status : undefined;
  const query = typeof parameters.q === "string" ? parameters.q : "";
  const sort = isSortKey(parameters.sort) ? parameters.sort : "changed";
  const mineOnly = parameters.von === "ich";

  const [rows, counts, mine] = await Promise.all([
    listArticles(member, { status, query, sort, mineOnly }),
    countArticlesByStatus(member),
    countOwnArticles(member),
  ]);

  const link = (next: Record<string, string | undefined>) => {
    const search = new URLSearchParams();
    const merged = { status, q: query, sort, von: mineOnly ? "ich" : undefined, ...next };
    for (const [key, value] of Object.entries(merged)) {
      if (value !== undefined && value.length > 0 && !(key === "sort" && value === "changed")) {
        search.set(key, value);
      }
    }
    const rendered = search.toString();
    return { pathname: "/admin/artikel" as const, query: rendered };
  };

  return (
    <>
      <div className={PANEL_CLASS}>
        <div className="flex flex-wrap items-center gap-3 border-b border-bd px-4 py-[18px] md:px-[22px]">
          <h1 className="m-0 text-xl font-extrabold tracking-[-0.03em]">Artikel</h1>
          <div className="flex flex-wrap gap-1.5">
            {/* "Alle" clears both filters and is only lit when neither is set:
                with two independent filters in one row, a pill that stayed
                active beside another active pill read as two answers to one
                question. */}
            <FilterPill
              href={link({ status: undefined, von: undefined })}
              active={status === undefined && !mineOnly}
            >
              Alle {counts.all}
            </FilterPill>
            {STATUSES.map((candidate) => (
              <FilterPill key={candidate} href={link({ status: candidate })} active={status === candidate}>
                {STATUS_LABELS[candidate]} {counts[candidate]}
              </FilterPill>
            ))}
            {/* Only where there is something to tell apart: an autor sees their
                own articles and nothing else, so the filter would say the same
                thing twice. */}
            {counts.all === mine ? null : (
              <FilterPill href={link({ von: mineOnly ? undefined : "ich" })} active={mineOnly}>
                Von mir {mine}
              </FilterPill>
            )}
          </div>
          {may(member.role, "writeOwnArticles") ? (
            <form action={newArticleAction} className="ml-auto">
              <button type="submit" className={`${PRIMARY_BUTTON_CLASS} py-2 text-[13px]`}>
                Neuer Artikel
              </button>
            </form>
          ) : null}
        </div>

        <ArticleFilter
          query={query}
          sort={sort}
          sorts={Object.entries(SORTS).map(([key, value]) => ({ key, label: value.label }))}
          shown={rows.length}
        />

        <div className={`${ROW_GRID} hidden border-b border-bd px-[22px] py-[11px] md:grid`}>
          <span className={COLUMN_HEADING_CLASS}>Titel</span>
          <span className={COLUMN_HEADING_CLASS}>Autor</span>
          <span className={COLUMN_HEADING_CLASS}>Status</span>
          <span className={`${COLUMN_HEADING_CLASS} text-right`}>Geändert</span>
        </div>

        {rows.length === 0 ? (
          <p className="px-4 py-8 text-[13.5px] font-medium text-tm md:px-[22px]">
            Kein Artikel passt zu dieser Auswahl.
          </p>
        ) : (
          rows.map((row) => (
            <Link
              key={row.id}
              href={`/admin/artikel/${row.id}`}
              className={`${ROW_GRID} items-center border-b border-bd px-4 py-3.5 no-underline transition-colors duration-200 ease-out last:border-b-0 hover:bg-s2 md:px-[22px]`}
            >
              <span className="col-span-2 md:col-span-1">
                <span className="block text-[15.5px] font-bold tracking-[-0.02em]">{row.title}</span>
                <span className="mt-[3px] block text-[11.5px] font-semibold text-tm">{subtitle(row)}</span>
              </span>
              {/* The name is what one reads down a column to find one's own
                  work, so the row says "Du" rather than repeating the name the
                  reader already knows — and says it in the accent, which is the
                  only place in this column that carries one. */}
              <span
                className={`text-[13px] font-semibold ${
                  row.authorId === member.id ? "font-bold text-ac" : "text-tm"
                }`}
              >
                {row.authorId === member.id ? "Du" : row.authorName}
              </span>
              <span className="justify-self-end md:justify-self-start">
                <span
                  className={`rounded-full px-2.5 py-[5px] text-[11.5px] font-bold ${
                    row.status === "review"
                      ? "bg-ac text-s1"
                      : row.status === "draft"
                        ? "border border-bd bg-s2 text-tm"
                        : "border border-bd text-tm"
                  }`}
                >
                  {STATUS_LABELS[row.status]}
                </span>
              </span>
              <span className="text-right text-xs font-semibold text-tm">{changedLabel(row.updatedAt)}</span>
            </Link>
          ))
        )}
      </div>

      {may(member.role, "readOthersDrafts") ? null : (
        <p className="mt-3.5 text-[12.5px] font-medium text-tm">
          Als Autor siehst du hier ausschließlich deine eigenen Artikel — fremde Entwürfe sind
          weder sichtbar noch aufrufbar.
        </p>
      )}

      {/* The one question this list does not answer: a piece can be published,
          correct and nowhere in sight because eleven newer ones are in front
          of it. */}
      <div className="mt-3.5">
        <PlacementNote />
      </div>
    </>
  );
}
