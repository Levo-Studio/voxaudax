import "server-only";
import { and, asc, count, desc, eq, ilike, or, sql } from "drizzle-orm";

import type { Member } from "@/lib/authorize";
import type { ArticleCover, TipTapDocument } from "@/lib/content";
import { db } from "@/lib/db/client";
import { articles, categories, images, slugHistory, users } from "@/lib/db/schema";
import { may } from "@/lib/roles";
import { freeSlug, slugify } from "@/lib/slug";
import { countWords } from "@/lib/word-count";

export type ArticleStatus = (typeof articles.$inferSelect)["status"];

export const STATUS_LABELS: Record<ArticleStatus, string> = {
  draft: "Entwurf",
  review: "Review",
  published: "Veröffentlicht",
};

/**
 * Screen 7c: "Als Autor siehst du hier ausschließlich deine eigenen Artikel —
 * fremde Entwürfe sind weder sichtbar noch aufrufbar."
 *
 * This is the one expression that says so. Every read below starts from it, so
 * the list, the editor, the preview and the review queue cannot disagree about
 * what an author may reach, and a route that forgot to filter would have had to
 * write its own query to do it.
 */
const reachableBy = (member: Member) =>
  may(member.role, "readOthersDrafts") ? undefined : eq(articles.authorId, member.id);

const listColumns = {
  id: articles.id,
  slug: articles.slug,
  title: articles.title,
  status: articles.status,
  updatedAt: articles.updatedAt,
  publishAt: articles.publishAt,
  publishedAt: articles.publishedAt,
  submittedAt: articles.submittedAt,
  wordCount: articles.wordCount,
  cover: articles.cover,
  categoryName: categories.name,
  authorName: users.name,
  authorInitials: users.initials,
};

const withJoins = () =>
  db
    .select(listColumns)
    .from(articles)
    .innerJoin(categories, eq(categories.id, articles.categoryId))
    .innerJoin(users, eq(users.id, articles.authorId));

export type ArticleRow = Awaited<ReturnType<typeof withJoins>>[number];

export const SORTS = {
  changed: { label: "Zuletzt geändert", order: desc(articles.updatedAt) },
  title: { label: "Titel", order: asc(articles.title) },
  published: { label: "Veröffentlichung", order: desc(articles.publishedAt) },
} as const;

export type SortKey = keyof typeof SORTS;

export const isSortKey = (value: unknown): value is SortKey =>
  typeof value === "string" && value in SORTS;

export const listArticles = async (
  member: Member,
  filter: {
    readonly status?: ArticleStatus;
    readonly query?: string;
    readonly sort?: SortKey;
  },
) => {
  const search = filter.query?.trim();

  return withJoins()
    .where(
      and(
        reachableBy(member),
        filter.status === undefined ? undefined : eq(articles.status, filter.status),
        search === undefined || search.length === 0
          ? undefined
          : or(
              ilike(articles.title, `%${search}%`),
              ilike(articles.teaser, `%${search}%`),
            ),
      ),
    )
    .orderBy(SORTS[filter.sort ?? "changed"].order)
    .limit(200);
};

export const countArticlesByStatus = async (member: Member) => {
  const rows = await db
    .select({ status: articles.status, total: count() })
    .from(articles)
    .where(reachableBy(member))
    .groupBy(articles.status);

  const tally = { draft: 0, review: 0, published: 0 };
  for (const row of rows) tally[row.status] = row.total;

  return { ...tally, all: tally.draft + tally.review + tally.published };
};

/**
 * Answers null for an article the member may not reach, which is what makes the
 * refusal a 404 rather than a message about an article that exists.
 */
export const articleForEditor = async (member: Member, articleId: string) => {
  const [row] = await db
    .select({
      id: articles.id,
      slug: articles.slug,
      title: articles.title,
      teaser: articles.teaser,
      body: articles.body,
      cover: articles.cover,
      categoryId: articles.categoryId,
      authorId: articles.authorId,
      status: articles.status,
      publishAt: articles.publishAt,
      publishedAt: articles.publishedAt,
      submittedAt: articles.submittedAt,
      wordCount: articles.wordCount,
      updatedAt: articles.updatedAt,
      authorName: users.name,
      authorInitials: users.initials,
    })
    .from(articles)
    .innerJoin(users, eq(users.id, articles.authorId))
    .where(and(eq(articles.id, articleId), reachableBy(member)));

  return row ?? null;
};

/**
 * The same expression, asked about one row. The image route asks it about the
 * article a cover belongs to, so a cover can never be reachable where its
 * article is not — and there is still only one place that says what an author
 * may reach.
 */
export const mayReachArticle = async (member: Member, articleId: string) => {
  const [row] = await db
    .select({ id: articles.id })
    .from(articles)
    .where(and(eq(articles.id, articleId), reachableBy(member)));

  return row !== undefined;
};

export const coverImageOf = async (cover: ArticleCover) => {
  if (cover.imageId === undefined) return null;

  const [image] = await db
    .select({ id: images.id, alt: images.alt, width: images.width, height: images.height })
    .from(images)
    .where(eq(images.id, cover.imageId));

  return image ?? null;
};

const bodyImagesMissingAlt = (body: TipTapDocument) => {
  const missing = (node: { type: string; attrs?: Readonly<Record<string, unknown>>; content?: readonly unknown[] }): boolean => {
    if (node.type === "image") {
      const alt = node.attrs?.alt;
      return typeof alt !== "string" || alt.trim().length === 0;
    }
    return (node.content ?? []).some((child) =>
      missing(child as Parameters<typeof missing>[0]),
    );
  };

  return body.content.some((node) => missing(node));
};

/**
 * Screen 11a shows the "Freigeben" button disabled beside "Alt-Text fehlt".
 * This is what disables it, and the approval action asks the same question
 * again before it writes — the button is the report, not the rule.
 */
export const missingAltText = async (input: {
  readonly cover: ArticleCover;
  readonly body: TipTapDocument;
}) => {
  if (bodyImagesMissingAlt(input.body)) return true;

  const image = await coverImageOf(input.cover);
  if (image === null) return false;

  return image.alt === null || image.alt.trim().length === 0;
};

const takenSlugs = async () => {
  const [current, historic] = await Promise.all([
    db.select({ slug: articles.slug }).from(articles),
    db.select({ slug: slugHistory.oldSlug }).from(slugHistory),
  ]);

  return new Set([...current, ...historic].map((row) => row.slug));
};

export const createDraft = async (member: Member) => {
  const [firstCategory] = await db
    .select({ id: categories.id })
    .from(categories)
    .orderBy(asc(categories.position))
    .limit(1);

  if (firstCategory === undefined) {
    throw new Error("No category exists, so an article has nothing to be filed under.");
  }

  const slug = freeSlug("neuer-artikel", await takenSlugs());

  const [created] = await db
    .insert(articles)
    .values({
      slug,
      title: "Neuer Artikel",
      teaser: "",
      body: { type: "doc", content: [{ type: "paragraph", content: [] }] },
      cover: { word: "NEU", line: "", colorId: "violett" },
      categoryId: firstCategory.id,
      authorId: member.id,
      status: "draft",
    })
    .returning({ id: articles.id });

  return created!.id;
};

export type ArticlePatch = {
  readonly title: string;
  readonly teaser: string;
  readonly body: TipTapDocument;
  readonly cover: ArticleCover;
  readonly categoryId: string;
  readonly publishAt: Date | null;
};

/**
 * Autosave, and a draft is the only thing it writes. Once an article is
 * submitted, the row is what a reviewer is reading and about to approve; once
 * it is published, the row is what the public site is serving. Either way a
 * save would replace text that somebody else already answered for, so the way
 * back into an approved article is `returnToDraft` and not a write.
 *
 * The status is asked here rather than in the action because an action is a
 * caller, and the next caller would have to remember.
 *
 * The slug is not among the fields. Nothing derives it from the title — it is
 * drawn once when the draft is created and changed only by `renameSlug`, which
 * records the old one in the same transaction.
 */
export const saveArticle = async (
  member: Member,
  articleId: string,
  patch: ArticlePatch,
) => {
  const existing = await articleForEditor(member, articleId);
  if (existing === null || existing.status !== "draft") return null;

  const updatedAt = new Date();

  await db
    .update(articles)
    .set({
      title: patch.title,
      teaser: patch.teaser,
      body: patch.body,
      cover: patch.cover,
      categoryId: patch.categoryId,
      publishAt: patch.publishAt,
      wordCount: countWords(patch.body),
      updatedAt,
    })
    .where(eq(articles.id, articleId));

  return updatedAt;
};

/**
 * Screen 3b: "Bleibt nach Veröffentlichung stabil, alte Slugs leiten weiter."
 *
 * Both halves of that sentence are here. The first is the status: a published
 * article's address does not change under the readers who have it, so this
 * refuses one, the same way autosave does — the way back is `returnToDraft`.
 * The second is what happens when an article that was once public is renamed
 * after being returned: the old slug goes into `slug_history` in the same
 * transaction, so a URL that was ever public never stops resolving.
 */
export const renameSlug = async (
  member: Member,
  articleId: string,
  wanted: string,
) => {
  const existing = await articleForEditor(member, articleId);
  if (existing === null || existing.status !== "draft") return null;

  const slug = freeSlug(slugify(wanted), await takenSlugs());
  if (slug === existing.slug) return existing.slug;

  await db.transaction(async (tx) => {
    if (existing.publishedAt !== null) {
      await tx
        .insert(slugHistory)
        .values({ oldSlug: existing.slug, articleId })
        .onConflictDoNothing();
    }

    await tx
      .update(articles)
      .set({ slug, updatedAt: new Date() })
      .where(eq(articles.id, articleId));
  });

  return slug;
};

export const submitForReview = async (member: Member, articleId: string) => {
  const existing = await articleForEditor(member, articleId);
  if (existing === null || existing.status !== "draft") return false;

  await db
    .update(articles)
    .set({ status: "review", submittedAt: new Date(), updatedAt: new Date() })
    .where(eq(articles.id, articleId));

  return true;
};

/** Carries the body as well, because the alt-text question is asked of it. */
export const listSubmittedArticles = () =>
  db
    .select({ ...listColumns, body: articles.body })
    .from(articles)
    .innerJoin(categories, eq(categories.id, articles.categoryId))
    .innerJoin(users, eq(users.id, articles.authorId))
    .where(eq(articles.status, "review"))
    .orderBy(asc(articles.submittedAt));

/**
 * The two rules screen 11a states, enforced where the row is written rather
 * than where the button is drawn: nobody approves their own submission, and no
 * approval happens while an alt text is missing.
 */
export const approveArticle = async (approver: Member, articleId: string) => {
  const [row] = await db
    .select({
      id: articles.id,
      authorId: articles.authorId,
      status: articles.status,
      cover: articles.cover,
      body: articles.body,
      publishAt: articles.publishAt,
    })
    .from(articles)
    .where(eq(articles.id, articleId));

  if (row === undefined || row.status !== "review") return "unknown" as const;
  if (row.authorId === approver.id) return "own_submission" as const;
  if (await missingAltText(row)) return "alt_text_missing" as const;

  // A scheduled article is published now and appears at its own hour: the
  // public read asks for `published_at <= now()`, so the future date is the
  // schedule and no second process has to come back for it.
  const publishedAt = row.publishAt ?? new Date();

  await db
    .update(articles)
    .set({ status: "published", publishedAt, updatedAt: new Date() })
    .where(eq(articles.id, articleId));

  return "approved" as const;
};

export const returnToDraft = async (approver: Member, articleId: string) => {
  const [row] = await db
    .select({ authorId: articles.authorId, status: articles.status })
    .from(articles)
    .where(eq(articles.id, articleId));

  if (row === undefined || row.status !== "review") return "unknown" as const;
  if (row.authorId === approver.id) return "own_submission" as const;

  await db
    .update(articles)
    .set({ status: "draft", submittedAt: null, updatedAt: new Date() })
    .where(eq(articles.id, articleId));

  return "returned" as const;
};

export const listCategories = () =>
  db
    .select({ id: categories.id, slug: categories.slug, name: categories.name })
    .from(categories)
    .orderBy(asc(categories.position));

export const countPendingReview = async () => {
  const [row] = await db
    .select({
      articles: sql<number>`count(*) filter (where ${articles.status} = 'review')`.mapWith(Number),
    })
    .from(articles);

  return row?.articles ?? 0;
};
