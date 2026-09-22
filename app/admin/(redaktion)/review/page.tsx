import Link from "next/link";

import { Avatar, COLUMN_HEADING_CLASS, PANEL_CLASS } from "@/components/admin/controls";
import {
  approveArticleAction,
  approveMemeAction,
  approveSponsorAction,
  rejectMemeAction,
  rejectSponsorAction,
  returnArticleAction,
} from "@/app/admin/(redaktion)/review/actions";
import { DecisionButtons } from "@/app/admin/(redaktion)/review/decision-buttons";
import { requireCapability } from "@/lib/authorize";
import { listSubmittedArticles, missingAltText } from "@/lib/editorial/articles";
import { listSubmittedMemes } from "@/lib/editorial/memes";
import { listSubmittedSponsors } from "@/lib/editorial/sponsors";
import { formatWordCount } from "@/lib/reading-time";

export const metadata = { title: "Freigabe · Vox Audax Redaktion" };

type Tab = "artikel" | "memes" | "sponsoren";

const isTab = (value: unknown): value is Tab =>
  value === "artikel" || value === "memes" || value === "sponsoren";

const waited = (since: Date | null) => {
  if (since === null) return "—";
  const hours = Math.round((Date.now() - since.getTime()) / 3600000);
  if (hours < 1) return "gerade eben";
  if (hours < 24) return `${hours} Stunden`;
  return `${Math.round(hours / 24)} Tage`;
};

const TAB_CLASS = (active: boolean) =>
  `border-none bg-transparent px-1 pt-3 pb-[11px] font-control text-xs font-bold no-underline transition-[color,box-shadow] duration-200 ease-out ${
    active ? "text-tx shadow-[inset_0_-2px_0_var(--ac)]" : "text-tm hover:text-tx"
  }`;

const ARTICLE_GRID =
  "grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_140px_108px_268px] md:gap-4";

/**
 * Screen 11a. The three tabs are three renders of the same page behind one
 * query parameter, so switching is a navigation the server answers rather than
 * three lists shipped to the browser and hidden from each other.
 */
export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireCapability("approveArticlesAndMemes");
  const parameters = await searchParams;
  const tab: Tab = isTab(parameters.tab) ? parameters.tab : "artikel";

  const [articles, memes, sponsors] = await Promise.all([
    listSubmittedArticles(),
    listSubmittedMemes(),
    listSubmittedSponsors(),
  ]);

  const articleRows = await Promise.all(
    articles.map(async (row) => ({
      ...row,
      blocked: missingAltText({ body: row.body }),
    })),
  );

  const tabs: readonly { readonly key: Tab; readonly label: string; readonly count: number }[] = [
    { key: "artikel", label: "Artikel", count: articles.length },
    { key: "memes", label: "Memes", count: memes.length },
    { key: "sponsoren", label: "Sponsoren", count: sponsors.length },
  ];

  return (
    <>
      <div className={PANEL_CLASS}>
        <div className="px-4 pt-[18px] md:px-[22px]">
          <h1 className="m-0 text-xl font-extrabold tracking-[-0.03em]">Freigabe</h1>
          <p className="mt-1.5 max-w-[64ch] text-[13.5px] font-medium text-tm">
            Alles, was Autorinnen und Autoren eingereicht haben. Nach der Freigabe geht es live
            und alle Admins sowie die einreichende Person bekommen eine Mail.
          </p>
        </div>

        <div role="tablist" aria-label="Art der Einreichung" className="mt-3.5 flex gap-[22px] border-b border-bd px-4 md:px-[22px]">
          {tabs.map((entry) => (
            <Link
              key={entry.key}
              href={{ pathname: "/admin/review", query: { tab: entry.key } }}
              role="tab"
              aria-selected={tab === entry.key}
              className={TAB_CLASS(tab === entry.key)}
            >
              {entry.label} {entry.count}
            </Link>
          ))}
        </div>

        {tab === "artikel" ? (
          <div className="va-in">
            <div className={`${ARTICLE_GRID} hidden border-b border-bd px-[22px] py-[11px] md:grid`}>
              <span className={COLUMN_HEADING_CLASS}>Titel</span>
              <span className={COLUMN_HEADING_CLASS}>Eingereicht von</span>
              <span className={COLUMN_HEADING_CLASS}>Wartet seit</span>
              <span className={`${COLUMN_HEADING_CLASS} text-right`}>Entscheidung</span>
            </div>
            {articleRows.length === 0 ? (
              <p className="px-4 py-8 text-[13.5px] font-medium text-tm md:px-[22px]">
                Zurzeit wartet kein Artikel auf eine Freigabe.
              </p>
            ) : (
              articleRows.map((row) => (
                <div key={row.id} className={`${ARTICLE_GRID} items-center border-b border-bd px-4 py-4 last:border-b-0 md:px-[22px]`}>
                  <span>
                    <Link href={`/admin/artikel/${row.id}`} className="block text-[15.5px] font-bold tracking-[-0.02em] no-underline">
                      {row.title}
                    </Link>
                    <span className="mt-1 block text-xs font-semibold text-tm">
                      {row.categoryName} · {formatWordCount(row.wordCount)} Wörter ·{" "}
                      {row.blocked ? "Alt-Text fehlt" : "Cover generiert"}
                    </span>
                  </span>
                  <span className="flex items-center gap-[9px] text-[13px] font-semibold text-tm">
                    <Avatar initials={row.authorInitials} size={26} />
                    {row.authorName}
                  </span>
                  <span className={`text-[12.5px] font-semibold ${row.blocked ? "text-ac2" : "text-tm"}`}>
                    {row.blocked ? "blockiert" : waited(row.submittedAt)}
                  </span>
                  <DecisionButtons
                    approve={approveArticleAction.bind(null, row.id)}
                    reject={returnArticleAction.bind(null, row.id)}
                    approveLabel="Freigeben"
                    rejectLabel="Zurück"
                    blocked={row.blocked}
                  />
                </div>
              ))
            )}
          </div>
        ) : null}

        {tab === "memes" ? (
          <div className="va-in grid grid-cols-2 gap-4 px-4 py-5 md:grid-cols-4 md:px-[22px]">
            {memes.length === 0 ? (
              <p className="col-span-full text-[13.5px] font-medium text-tm">
                Zurzeit wartet kein Meme auf eine Freigabe.
              </p>
            ) : (
              memes.map((meme) => {
                const blocked = meme.alt === null || meme.alt.trim().length === 0;
                return (
                  <figure key={meme.id} className="m-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/bilder/${meme.imageId}`}
                      alt={meme.alt ?? ""}
                      width={meme.width}
                      height={meme.height}
                      className="block w-full rounded-[10px] border border-bd bg-s2 object-cover"
                    />
                    <figcaption className={`mt-[9px] text-xs font-semibold ${blocked ? "text-ac2" : "text-tm"}`}>
                      {meme.authorName} · {blocked ? "Alt-Text fehlt" : waited(meme.createdAt)}
                    </figcaption>
                    <div className="mt-2">
                      <DecisionButtons
                        approve={approveMemeAction.bind(null, meme.id)}
                        reject={rejectMemeAction.bind(null, meme.id)}
                        approveLabel="Freigeben"
                        rejectLabel="Ab"
                        blocked={blocked}
                        layout="grid"
                      />
                    </div>
                  </figure>
                );
              })
            )}
          </div>
        ) : null}

        {tab === "sponsoren" ? (
          <div className="va-in">
            <div className="hidden grid-cols-[minmax(0,1fr)_150px_118px_208px] gap-4 border-b border-bd px-[22px] py-[11px] md:grid">
              <span className={COLUMN_HEADING_CLASS}>Sponsor</span>
              <span className={COLUMN_HEADING_CLASS}>Art</span>
              <span className={COLUMN_HEADING_CLASS}>Laufzeit</span>
              <span className={`${COLUMN_HEADING_CLASS} text-right`}>Entscheidung</span>
            </div>
            {sponsors.length === 0 ? (
              <p className="px-4 py-8 text-[13.5px] font-medium text-tm md:px-[22px]">
                Zurzeit wartet kein Unterstützer auf eine Freigabe.
              </p>
            ) : (
              sponsors.map((sponsor) => {
                const months = Math.round(
                  (sponsor.endsAt.getTime() - sponsor.startsAt.getTime()) / (30 * 24 * 3600 * 1000),
                );
                const blocked =
                  sponsor.logoImageId !== null &&
                  (sponsor.logoAlt === null || sponsor.logoAlt.trim().length === 0);

                return (
                  <div
                    key={sponsor.id}
                    className="grid grid-cols-1 items-center gap-3 border-b border-bd px-4 py-4 last:border-b-0 md:grid-cols-[minmax(0,1fr)_150px_118px_208px] md:gap-4 md:px-[22px]"
                  >
                    <span className="flex items-center gap-3">
                      <span className="grid h-10 w-10 flex-none place-items-center rounded-[9px] border border-bd bg-s2 text-xs font-extrabold text-tm">
                        {sponsor.initials}
                      </span>
                      <span>
                        <span className="block text-[14.5px] font-bold tracking-[-0.02em]">{sponsor.name}</span>
                        <span className="block text-[11.5px] font-semibold text-tm">
                          {sponsor.url ?? "ohne Link"}
                        </span>
                      </span>
                    </span>
                    <span className="text-[13px] font-semibold">{months} Monate</span>
                    <DecisionButtons
                      approve={approveSponsorAction.bind(null, sponsor.id)}
                      reject={rejectSponsorAction.bind(null, sponsor.id)}
                      approveLabel="Freigeben"
                      rejectLabel="Ablehnen"
                      blocked={blocked}
                    />
                  </div>
                );
              })
            )}
            <p className="px-4 pb-[18px] text-[12.5px] font-medium text-tm md:px-[22px]">
              Freigegebene Sponsoren erscheinen sofort im Bereich „Unterstützt durch“ auf der
              Startseite.
            </p>
          </div>
        ) : null}
      </div>

      <p className="mt-3.5 text-[12.5px] font-medium text-tm">
        Die Rolle <strong className="font-bold text-tx">Autor</strong> sieht diese Seite nicht.
        Freigeben dürfen <strong className="font-bold text-tx">Redakteur</strong> und{" "}
        <strong className="font-bold text-tx">Admin</strong> — niemand gibt die eigene Einreichung
        frei.
      </p>
    </>
  );
}
