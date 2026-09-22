import { FormerTag } from "@/components/former-tag";
import { ArticleCover } from "@/components/article-cover";
import type { ArticleTeaser } from "@/lib/queries";
import { machineDate, readingMinutes, shortDate } from "@/lib/format";
import { articleHref } from "@/lib/routes";

/**
 * The same article in the two shapes 3a and 4a draw: a card with the cover
 * above the headline on the wide screen, a row with a square tile beside it on
 * the phone. One element, because it is one article — a second copy behind a
 * media query would ship every headline twice.
 */
export function ArticleCard({
  article,
  variant = "card",
  headingLevel = "h3",
}: {
  article: ArticleTeaser;
  variant?: "card" | "related";
  /**
   * The level belongs to the page, not to the card. On the homepage the cards
   * follow the lead story's h1 with no section heading between them, so h3
   * would skip a level; under "Weiterlesen" they follow that section's h2 and
   * h3 is right.
   */
  headingLevel?: "h2" | "h3";
}) {
  const href = articleHref(article.slug);
  const Heading = headingLevel;

  return (
    <article className="grid grid-cols-[104px_1fr] items-start gap-3.5 md:block">
      {/* The cover repeats the headline's destination. Hidden from keyboard and
          screen reader so the same article is not announced twice in a row. */}
      <a href={href} tabIndex={-1} aria-hidden className="block">
        <ArticleCover
          variant={variant}
          title={article.title}
          colorId={article.cover.colorId}
          grid={article.cover.grid}
          eyebrow={article.categoryName}
          word={article.cover.word}
          image={article.coverImage}
        />
      </a>

      <div>
        <div className="text-[10.5px] font-bold tracking-[0.12em] text-tm uppercase md:hidden">
          {article.categoryName}
        </div>
        <Heading className="mt-1.5 text-[17.5px] leading-[1.2] font-bold tracking-[-0.02em] md:mt-4 md:text-[22px] md:leading-[1.12] md:tracking-[-0.028em]">
          <a href={href}>{article.title}</a>
        </Heading>
        <p className="mt-[9px] hidden text-sm leading-[1.6] font-medium text-tm md:block">
          {article.teaser}
        </p>
        <div className="mt-[7px] text-[11.5px] font-semibold text-tm md:mt-2.5">
          {article.authorName}
          {article.authorFormer ? <FormerTag /> : null} ·{" "}
          <span className="md:hidden">
            {readingMinutes(article.wordCount)} Min
          </span>
          <time
            dateTime={machineDate(article.publishedAt)}
            className="hidden md:inline"
          >
            {shortDate(article.publishedAt)}
          </time>
        </div>
      </div>
    </article>
  );
}

/** The "Außerdem" rows: category, headline, nothing else. */
export function ArticleBrief({ article }: { article: ArticleTeaser }) {
  return (
    <a
      href={articleHref(article.slug)}
      className="flex flex-col border-b border-bd py-3.5 md:flex-row md:items-baseline md:gap-4 md:py-[15px]"
    >
      <span className="text-[10.5px] font-bold tracking-[0.1em] text-ac uppercase md:min-w-[94px] md:text-[11px]">
        {article.categoryName}
      </span>
      <span className="mt-[5px] text-base leading-[1.3] font-semibold tracking-[-0.02em] md:mt-0 md:text-[17px] md:leading-[1.25]">
        {article.title}
      </span>
    </a>
  );
}

/**
 * "Weiterlesen" under an article: 13a sets three cards, 13b two ruled rows
 * without the byline. Same element, same article, two shapes.
 */
export function ArticleRelated({ article }: { article: ArticleTeaser }) {
  return (
    <a
      href={articleHref(article.slug)}
      className="grid grid-cols-[96px_1fr] items-center gap-3.5 border-t border-bd py-3 md:block md:border-0 md:py-0"
    >
      <ArticleCover
        variant="related"
        title={article.title}
        colorId={article.cover.colorId}
        grid={article.cover.grid}
        eyebrow={article.categoryName}
        word={article.cover.word}
        image={article.coverImage}
      />
      <span className="block">
        <span className="block text-[16.5px] leading-[1.24] font-bold tracking-[-0.02em] md:mt-3 md:text-[19px] md:leading-[1.2] md:tracking-[-0.025em]">
          {article.title}
        </span>
        <span className="mt-1.5 hidden text-[11.5px] font-semibold text-tm md:block">
          {article.authorName}
          {article.authorFormer ? <FormerTag /> : null} ·{" "}
          <time dateTime={machineDate(article.publishedAt)}>
            {shortDate(article.publishedAt)}
          </time>
        </span>
      </span>
    </a>
  );
}
