import Link from "next/link";
import { notFound } from "next/navigation";

import { ArticleBody } from "@/components/article-body";
import { ArticleCover } from "@/components/article-cover";
import { requireCapability } from "@/lib/authorize";
import { articleForEditor } from "@/lib/editorial/articles";
import { formatWordCount, readingTimeMinutes } from "@/lib/reading-time";

export const metadata = { title: "Vorschau · Vox Audax Redaktion" };

const PUBLISHED = new Intl.DateTimeFormat("de-DE", { dateStyle: "long" });

/**
 * "Vorschau im echten Layout" — the same cover component and the same body
 * renderer the public article page uses, so what is checked here is the article
 * and not a second rendering of it.
 */
export default async function ArticlePreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const member = await requireCapability("writeOwnArticles");
  const { id } = await params;

  const article = await articleForEditor(member, id);
  if (article === null) notFound();


  return (
    <article className="mx-auto max-w-[900px]">
      <div className="mb-5 flex items-center justify-between text-[12.5px] font-semibold">
        <Link href={`/admin/artikel/${article.id}`} className="text-tm no-underline hover:text-tx">
          ← Zurück in den Editor
        </Link>
        <span className="text-tm">Vorschau · nicht öffentlich</span>
      </div>

      <div className="overflow-hidden rounded-[14px] border border-bd bg-s1">
        <ArticleCover
          title={article.title}
          colorId={article.cover.colorId}
          grid={article.cover.grid}
          eyebrow="Titelthema"
          word={article.cover.word}
          line={article.cover.line}
          variant="article"
        />

        <div className="px-5 py-8 md:px-10">
          <h1 className="m-0 text-[32px] leading-[1.05] font-extrabold tracking-[-0.04em] md:text-[46px]">
            {article.title}
          </h1>
          <p className="mt-3.5 max-w-[60ch] text-[17px] leading-relaxed font-medium text-tm">
            {article.teaser}
          </p>
          <div className="mt-4 text-[12.5px] font-semibold text-tm">
            {article.authorName} ·{" "}
            {article.publishedAt === null ? "noch nicht erschienen" : PUBLISHED.format(article.publishedAt)}{" "}
            · {formatWordCount(article.wordCount)} Wörter ·{" "}
            {readingTimeMinutes(article.wordCount)} Min Lesezeit
          </div>
          <div className="mt-8">
            <ArticleBody document={article.body} />
          </div>
        </div>
      </div>
    </article>
  );
}
