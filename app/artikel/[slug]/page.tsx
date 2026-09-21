import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { ArticleRelated } from "@/components/article-card";
import { ArticleCover } from "@/components/article-cover";
import { Avatar } from "@/components/avatar";
import { ArticleProse } from "@/components/prose";
import { ShareControls } from "@/components/share-controls";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { environment } from "@/lib/env";
import { longDate, machineDate, readingMinutes, shortDate } from "@/lib/format";
import {
  articleBySlug,
  currentSlugForRetiredSlug,
  everyPublishedArticle,
  relatedArticles,
} from "@/lib/queries";
import { roleTitle } from "@/lib/roles";
import { archiveHref, articleHref } from "@/lib/routes";

export const revalidate = 300;

type ArticleParams = { params: Promise<{ slug: string }> };

/**
 * Every published article is built ahead of time; anything else — a slug that
 * has only just appeared — is rendered on first request and cached from then
 * on, so a new article never waits for a deploy.
 */
export const generateStaticParams = async () =>
  (await everyPublishedArticle()).map((article) => ({ slug: article.slug }));

export const generateMetadata = async ({
  params,
}: ArticleParams): Promise<Metadata> => {
  const { slug } = await params;
  const article = await articleBySlug(slug);

  if (article === undefined) return { title: "Nicht gefunden" };

  return {
    title: article.title,
    description: article.teaser,
    alternates: { canonical: articleHref(article.slug) },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.teaser,
      url: articleHref(article.slug),
      publishedTime: article.publishedAt.toISOString(),
      authors: [article.authorName],
      section: article.categoryName,
    },
    twitter: { card: "summary_large_image" },
  };
};

export default async function ArticlePage({ params }: ArticleParams) {
  const { slug } = await params;
  const article = await articleBySlug(slug);

  if (article === undefined) {
    const current = await currentSlugForRetiredSlug(slug);
    if (current !== undefined) permanentRedirect(articleHref(current));
    notFound();
  }

  const related = await relatedArticles(article);
  const minutes = readingMinutes(article.wordCount);
  const author = roleTitle(article.authorRole, article.authorForm);
  const site = environment().NEXT_PUBLIC_SITE_URL;

  /**
   * Search engines and aggregators read the article from this block rather
   * than guessing at the markup; it names the same facts the byline prints.
   */
  const newsArticle = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.teaser,
    datePublished: article.publishedAt.toISOString(),
    articleSection: article.categoryName,
    inLanguage: "de-DE",
    wordCount: article.wordCount,
    author: { "@type": "Person", name: article.authorName },
    publisher: { "@type": "Organization", name: "Vox Audax" },
    mainEntityOfPage: new URL(articleHref(article.slug), site).toString(),
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <main className="flex-1">
        <article>
          <ArticleCover
            variant="article"
            title={article.title}
            colorId={article.cover.colorId}
            eyebrow="Titelthema"
            word={article.cover.word}
            line={article.cover.line}
          />

          <div className="px-[18px] pt-5 md:px-10 md:pt-9">
            <nav
              aria-label="Brotkrume"
              className="text-[11.5px] font-bold text-tm md:text-[12.5px]"
            >
              <a href={archiveHref({ category: article.categorySlug })} className="text-ac">
                {article.categoryName}
              </a>{" "}
              ·{" "}
              <time dateTime={machineDate(article.publishedAt)}>
                <span className="md:hidden">{shortDate(article.publishedAt)}</span>
                <span className="hidden md:inline">
                  {longDate(article.publishedAt)}
                </span>
              </time>
            </nav>

            <h1 className="mt-2.5 text-[31px] leading-[1.04] font-extrabold tracking-[-0.04em] md:mt-3.5 md:text-[66px] md:leading-[0.95] md:tracking-[-0.05em]">
              {article.title}
            </h1>

            <p className="mt-3 text-[17px] leading-[1.6] font-semibold text-tm md:mt-5 md:text-[22px] md:leading-[1.45]">
              {article.teaser}
            </p>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2.5 border-y border-bd px-[18px] py-3.5 md:mt-6 md:gap-4 md:px-10 md:py-[18px]">
            <a
              href={archiveHref({ author: article.authorSlug })}
              className="flex min-h-11 items-center gap-2.5 md:min-h-0 md:gap-3"
            >
              <Avatar initials={article.authorInitials} size="strip" />
              <span>
                <span className="block text-[12.5px] font-semibold tracking-[-0.02em] md:text-base md:font-bold">
                  {article.authorName}
                </span>
                <span className="block text-[12.5px] font-semibold text-tm md:text-xs">
                  {author} · {minutes} Min
                  <span className="hidden md:inline"> Lesezeit</span>
                </span>
              </span>
            </a>
            <ShareControls title={article.title} teaser={article.teaser} />
          </div>

          <div className="px-[18px] pt-[22px] pb-7 md:px-10 md:pt-9 md:pb-11">
            <ArticleProse document={article.body} />

            <div className="mt-[34px] flex max-w-[65ch] items-start gap-4 border-t border-bd pt-[22px]">
              <Avatar initials={article.authorInitials} size="box" />
              <div>
                <div className="text-base font-bold tracking-[-0.02em]">
                  {article.authorName}
                </div>
                {article.authorBio === null ? null : (
                  <p className="mt-1.5 max-w-[56ch] text-[14.5px] leading-[1.6] font-medium text-tm">
                    {article.authorBio}
                  </p>
                )}
                <a
                  href={archiveHref({ author: article.authorSlug })}
                  className="mt-1 inline-flex min-h-11 items-center text-[12.5px] font-bold text-ac md:mt-2 md:min-h-0"
                >
                  Alle Beiträge von {article.authorName.split(" ")[0]} →
                </a>
              </div>
            </div>
          </div>
        </article>

        {related.length === 0 ? null : (
          <section className="border-t border-bd bg-s2 px-[18px] py-5 md:px-10 md:pt-[30px] md:pb-10">
            <h2 className="mb-3 text-[11px] font-bold tracking-[0.14em] text-tm uppercase md:mb-4 md:text-xs">
              Weiterlesen
            </h2>
            <div className="md:grid md:grid-cols-3 md:gap-[18px]">
              {related.map((other) => (
                <ArticleRelated key={other.slug} article={other} />
              ))}
            </div>
          </section>
        )}
      </main>

      <SiteFooter />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(newsArticle) }}
      />
    </div>
  );
}
