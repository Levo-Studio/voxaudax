import Link from "next/link";

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

const MEMBER_PILLS = 8;

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

  // Eight names fit two rows at 375px. Past that the block grows without
  // telling the reader anything new, so the rest become one pill that says how
  // many they are and opens the page they are all on.
  const shownMembers = members.slice(0, MEMBER_PILLS);
  const furtherMembers = members.length - shownMembers.length;

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader current="home" showCategoryBar />

      <main className="flex-1">
        {lead === undefined ? (
          <p className="px-[18px] py-12 text-[17px] font-medium text-tm md:px-10">
            Noch ist nichts veröffentlicht. Die erste Ausgabe entsteht gerade.
          </p>
        ) : (
          <article className="grid md:min-h-[404px] md:grid-cols-[1.15fr_1fr]">
            <div className="flex flex-col justify-between px-[18px] pb-[26px] md:px-11 md:py-12">
              <Link
                href={archiveHref({ category: lead.categorySlug })}
                className="hidden self-start rounded-[5px] bg-ac px-[11px] py-1.5 text-[11.5px] font-bold tracking-[0.1em] text-s1 uppercase transition-opacity hover:opacity-85 md:inline-flex"
              >
                {lead.categoryName}
              </Link>

              <div>
                <Link
                  href={archiveHref({ category: lead.categorySlug })}
                  className="mt-2 inline-flex min-h-11 items-center text-[11px] font-bold tracking-[0.12em] text-ac uppercase md:hidden"
                >
                  {lead.categoryName}
                </Link>
                <h1 className="mt-2 text-[32px] leading-[1.04] font-extrabold tracking-[-0.035em] md:mt-[18px] md:text-[clamp(42px,5.2vw,68px)] md:leading-[0.95] md:tracking-[-0.045em]">
                  <Link
                    href={articleHref(lead.slug)}
                    className="transition-colors hover:text-ac"
                  >
                    {lead.title}
                  </Link>
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
                  <Link
                    href={archiveHref({ author: toSlug(lead.authorName) })}
                    className="py-[15px] text-tx transition-colors hover:text-ac"
                  >
                    {lead.authorName}
                  </Link>{" "}
                  ·{" "}
                  <time dateTime={machineDate(lead.publishedAt)}>
                    {shortDate(lead.publishedAt)}
                  </time>{" "}
                  · {readingMinutes(lead.wordCount)} Min
                </span>
              </div>
            </div>

            {/* 4a sets the cover above the headline, 3a beside it. */}
            <Link
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
                image={lead.coverImage}
              />
            </Link>
          </article>
        )}

        {cards.length === 0 ? null : (
          <section className="flex flex-col gap-5 border-t border-bd px-[18px] py-5 md:grid md:grid-cols-3 md:gap-px md:bg-bd md:p-0">
            {cards.map((article) => (
              <div key={article.slug} className="md:bg-s1 md:p-[26px]">
                <ArticleCard headingLevel="h2" article={article} />
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
            <Link
              href={archiveHref()}
              className="mt-1.5 inline-flex min-h-11 items-center text-[13px] font-bold text-ac transition-opacity hover:opacity-75 md:mt-[22px] md:min-h-0"
            >
              {/*
                The whole label is one child, because the anchor is a flex
                container — `inline-flex` is what gives the 44px touch target —
                and a flex container throws away the whitespace between its
                items. With the inner span as an item of its own it read
                "Alle 12 Artikelim Archiv→"; inside this span it is ordinary
                inline text again, spaces and all.
              */}
              <span>
                Alle {formatNumber(total)} Artikel
                <span className="hidden md:inline"> im Archiv</span> →
              </span>
            </Link>
          </section>
        )}

        <Supporters supporters={supporters} />

        <section className="grid gap-px border-t border-bd md:grid-cols-2 md:bg-bd">
          <div className="bg-s1 px-[18px] py-5 md:px-11 md:py-8">
            <h2 className="text-[11px] font-bold tracking-[0.14em] text-tm uppercase md:text-xs">
              Die Redaktion
            </h2>
            <div className="mt-3 flex flex-wrap gap-2.5 md:mt-4">
              {shownMembers.map((member, position) => (
                <Link
                  key={member.email}
                  href={archiveHref({ author: toSlug(member.name) })}
                  className="flex min-h-11 items-center gap-[9px] rounded-full border border-bd py-[7px] pr-[13px] pl-[7px] text-[13px] font-semibold transition-colors hover:border-ac md:min-h-0"
                >
                  <Avatar
                    initials={member.initials}
                    size="chip"
                    tone={toneForPosition(position)}
                  />
                  {member.name}
                </Link>
              ))}
              {furtherMembers > 0 ? (
                <Link
                  href="/redaktion"
                  className="flex min-h-11 items-center rounded-full border border-bd px-[15px] text-[13px] font-semibold text-tm transition-colors hover:border-ac hover:text-tx md:min-h-0 md:py-[7px]"
                >
                  + {formatNumber(furtherMembers)} weitere
                </Link>
              ) : null}
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
            <Link
              href="/kontakt"
              className="mt-3.5 inline-flex min-h-11 items-center rounded-[9px] bg-ac px-[18px] py-[11px] text-[13.5px] font-bold text-s1 transition-opacity hover:opacity-85 md:mt-4 md:min-h-0"
            >
              Kontakt aufnehmen
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
