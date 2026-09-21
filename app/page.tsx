import { ArticleBrief, ArticleCard } from "@/components/article-card";
import { ArticleCover } from "@/components/article-cover";
import { Avatar, toneForPosition } from "@/components/avatar";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Supporters } from "@/components/supporters";
import {
  formatNumber,
  machineDate,
  readingMinutes,
  shortDate,
  toSlug,
} from "@/lib/format";
import {
  activeSponsors,
  editorialMembers,
  homepageArticles,
  publishedArticleCount,
} from "@/lib/queries";
import { archiveHref, articleHref } from "@/lib/routes";

/**
 * Five minutes: an article scheduled to the minute reaches the front page
 * within five of the minute it was scheduled for, and a page nobody has asked
 * for in five minutes is not worth a database round trip either.
 */
export const revalidate = 300;

export default async function HomePage() {
  const [articles, total, supporters, members] = await Promise.all([
    homepageArticles(),
    publishedArticleCount(),
    activeSponsors(),
    editorialMembers(),
  ]);

  const [lead, ...rest] = articles;
  const cards = rest.slice(0, 3);
  const briefs = rest.slice(3, 9);

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader current="home" showCategoryBar showSearch />

      <main className="flex-1">
        {lead === undefined ? (
          <p className="px-[18px] py-12 text-[17px] font-medium text-tm md:px-10">
            Noch ist nichts veröffentlicht. Die erste Ausgabe entsteht gerade.
          </p>
        ) : (
          <article className="grid md:min-h-[404px] md:grid-cols-[1.15fr_1fr]">
            <div className="flex flex-col justify-between px-[18px] pb-[26px] md:px-11 md:py-12">
              <a
                href={archiveHref({ category: lead.categorySlug })}
                className="hidden self-start rounded-[5px] bg-ac px-[11px] py-1.5 text-[11.5px] font-bold tracking-[0.1em] text-s1 uppercase md:inline-flex"
              >
                {lead.categoryName}
              </a>

              <div>
                <a
                  href={archiveHref({ category: lead.categorySlug })}
                  className="mt-2 inline-flex min-h-11 items-center text-[11px] font-bold tracking-[0.12em] text-ac uppercase md:hidden"
                >
                  {lead.categoryName}
                </a>
                <h1 className="mt-2 text-[32px] leading-[1.04] font-extrabold tracking-[-0.035em] md:mt-[18px] md:text-[clamp(42px,5.2vw,68px)] md:leading-[0.95] md:tracking-[-0.045em]">
                  <a href={articleHref(lead.slug)}>{lead.title}</a>
                </h1>
                <p className="mt-3 text-[17px] leading-[1.62] font-medium text-tm md:mt-[18px] md:max-w-[50ch] md:text-[18px] md:leading-[1.6]">
                  {lead.teaser}
                </p>
              </div>

              <div className="mt-3.5 flex items-center gap-2.5 text-[12.5px] font-semibold text-tm md:mt-6 md:gap-3">
                <Avatar initials={lead.authorInitials} size="byline" />
                <span>
                  {/* Padding on an inline link grows the box that can be
                      tapped without growing the line it sits in: the byline
                      stays one line and the name is 44px tall to a thumb. */}
                  <a
                    href={archiveHref({ author: toSlug(lead.authorName) })}
                    className="py-[15px] text-tx"
                  >
                    {lead.authorName}
                  </a>{" "}
                  ·{" "}
                  <time dateTime={machineDate(lead.publishedAt)}>
                    {shortDate(lead.publishedAt)}
                  </time>{" "}
                  · {readingMinutes(lead.wordCount)} Min
                </span>
              </div>
            </div>

            {/* 4a sets the cover above the headline, 3a beside it. */}
            <a
              href={articleHref(lead.slug)}
              aria-label={`Artikel öffnen: ${lead.title}`}
              className="order-first block min-w-0 px-[18px] pb-4 md:order-none md:h-full md:px-0 md:pb-0"
            >
              <ArticleCover
                variant="hero"
                title={lead.title}
                colorId={lead.cover.colorId}
                eyebrow="Titelthema"
                word={lead.cover.word}
                line={lead.cover.line}
              />
            </a>
          </article>
        )}

        {cards.length === 0 ? null : (
          <section className="flex flex-col gap-5 border-t border-bd px-[18px] py-5 md:grid md:grid-cols-3 md:gap-px md:bg-bd md:p-0">
            {cards.map((article) => (
              <div key={article.slug} className="md:bg-s1 md:p-[26px]">
                <ArticleCard article={article} />
              </div>
            ))}
          </section>
        )}

        {briefs.length === 0 ? null : (
          <section className="border-t border-bd bg-s2 px-[18px] py-5 md:px-11 md:pt-[34px] md:pb-10">
            <h2 className="text-[11px] font-bold tracking-[0.14em] text-tm uppercase md:mb-1 md:text-xs">
              Außerdem
            </h2>
            <div className="md:grid md:grid-cols-2 md:gap-x-11">
              {briefs.map((article) => (
                <ArticleBrief key={article.slug} article={article} />
              ))}
            </div>
            <a
              href={archiveHref()}
              className="mt-1.5 inline-flex min-h-11 items-center text-[13px] font-bold text-ac md:mt-[22px] md:min-h-0"
            >
              Alle {formatNumber(total)} Artikel
              <span className="hidden md:inline"> im Archiv</span> →
            </a>
          </section>
        )}

        <Supporters supporters={supporters} />

        <section className="grid gap-px border-t border-bd md:grid-cols-2 md:bg-bd">
          <div className="bg-s1 px-[18px] py-5 md:px-11 md:py-8">
            <h2 className="text-[11px] font-bold tracking-[0.14em] text-tm uppercase md:text-xs">
              Die Redaktion
            </h2>
            <div className="mt-3 flex flex-wrap gap-2.5 md:mt-4">
              {members.map((member, position) => (
                <a
                  key={member.email}
                  href={archiveHref({ author: toSlug(member.name) })}
                  className="flex min-h-11 items-center gap-[9px] rounded-full border border-bd py-[7px] pr-[13px] pl-[7px] text-[13px] font-semibold md:min-h-0"
                >
                  <Avatar
                    initials={member.initials}
                    size="chip"
                    tone={toneForPosition(position)}
                  />
                  {member.name}
                </a>
              ))}
            </div>
          </div>

          <div className="bg-s1 px-[18px] py-5 md:px-11 md:py-8">
            <h2 className="text-[11px] font-bold tracking-[0.14em] text-tm uppercase md:text-xs">
              Mitschreiben
            </h2>
            <p className="mt-3 text-[15.5px] leading-[1.62] font-medium md:mt-3.5 md:max-w-[44ch] md:text-[16.5px]">
              Die Redaktion trifft sich mittwochs in der siebten Stunde in Raum
              214. Wer einen Text, eine Recherche oder eine Idee hat, schreibt
              uns.
            </p>
            <a
              href="/kontakt"
              className="mt-3.5 inline-flex min-h-11 items-center rounded-[9px] bg-ac px-[18px] py-[11px] text-[13.5px] font-bold text-s1 md:mt-4 md:min-h-0"
            >
              Kontakt aufnehmen
            </a>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
