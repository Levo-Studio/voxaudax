import { notFound } from "next/navigation";

import { Editor } from "@/app/admin/(redaktion)/artikel/[id]/editor";
import { requireCapability } from "@/lib/authorize";
import { articleForEditor, listCategories } from "@/lib/editorial/articles";
import { may } from "@/lib/roles";

export const metadata = { title: "Artikel bearbeiten · Vox Audax Redaktion" };

/**
 * There is no check here beyond asking for the article as this member. A row an
 * author may not reach answers null, and null is a 404 — which is what makes
 * screen 7c's promise hold against a guessed URL and not only against a hidden
 * link.
 */
export default async function ArticleEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const member = await requireCapability("writeOwnArticles");
  const { id } = await params;

  const article = await articleForEditor(member, id);
  if (article === null) notFound();

  const [categories] = await Promise.all([
    listCategories(),
  ]);

  const localDateTime = (at: Date | null) =>
    at === null
      ? null
      : new Date(at.getTime() - at.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

  return (
    <Editor
      article={{
        id: article.id,
        slug: article.slug,
        rejectionReason: article.rejectionReason,
        title: article.title,
        teaser: article.teaser,
        body: article.body,
        cover: article.cover,
        categoryId: article.categoryId,
        status: article.status,
        publishAt: localDateTime(article.publishAt),
        updatedAt: article.updatedAt.toISOString(),
        authorName: article.authorName,
        authorInitials: article.authorInitials,
      }}
      categories={categories}
      canPublish={may(member.role, "approveArticlesAndMemes")}
    />
  );
}
