import "server-only";
import { and, asc, desc, eq, lte, sql } from "drizzle-orm";

import type { ArticleCover, TipTapDocument } from "@/lib/content";
import { db } from "@/lib/db/client";
import {
  articles,
  categories,
  images,
  memes,
  pages,
  slugHistory,
  sponsors,
  userForm,
  userRole,
  users,
} from "@/lib/db/schema";
import { toSlug } from "@/lib/format";
import { LIKE_ESCAPE, likeContains } from "@/lib/search";

/**
 * Every public read of the database lives here. The pages are server
 * components and call these directly, so an article's prose is in the first
 * HTML response and no browser ever asks this application for content a second
 * time.
 */

/**
 * Published is not the same as due: an article can carry the status while its
 * publication moment is still ahead, and until that moment passes it belongs
 * to no one but the editor who scheduled it.
 */
const live = () =>
  and(eq(articles.status, "published"), lte(articles.publishedAt, sql`now()`));

export type ArticleTeaser = {
  slug: string;
  title: string;
  teaser: string;
  cover: ArticleCover;
  publishedAt: Date;
  wordCount: number;
  categorySlug: string;
  categoryName: string;
  authorName: string;
  authorInitials: string;
};

export type FullArticle = ArticleTeaser & {
  id: string;
  body: TipTapDocument;
  categoryId: string;
  authorSlug: string;
  authorBio: string | null;
  authorRole: (typeof userRole.enumValues)[number];
  authorForm: (typeof userForm.enumValues)[number];
};

const teaserColumns = {
  slug: articles.slug,
  title: articles.title,
  teaser: articles.teaser,
  cover: articles.cover,
  publishedAt: articles.publishedAt,
  wordCount: articles.wordCount,
  categorySlug: categories.slug,
  categoryName: categories.name,
  authorName: users.name,
  authorInitials: users.initials,
};

/**
 * The column is nullable, and a check constraint keeps it filled on every
 * published row — which SQL knows and the type system does not. Narrowing once
 * here beats an assertion at each of the dozen places that print a date.
 */
const dated = <Row extends { publishedAt: Date | null }>(rows: readonly Row[]) =>
  rows.flatMap((row) =>
    row.publishedAt === null ? [] : [{ ...row, publishedAt: row.publishedAt }],
  );

const teaserQuery = () =>
  db
    .select(teaserColumns)
    .from(articles)
    .innerJoin(categories, eq(categories.id, articles.categoryId))
    .innerJoin(users, eq(users.id, articles.authorId));

export const publishedArticleCount = async () => {
  const [row] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(articles)
    .where(live());

  return row.total;
};

/** The lead story, the three cards and the six "Außerdem" rows of screen 3a. */
export const homepageArticles = async (): Promise<ArticleTeaser[]> =>
  dated(
    await teaserQuery()
      .where(live())
      .orderBy(desc(articles.publishedAt))
      .limit(10),
  );

export const everyPublishedArticle = async (): Promise<ArticleTeaser[]> =>
  dated(await teaserQuery().where(live()).orderBy(desc(articles.publishedAt)));

export const articleBySlug = async (
  slug: string,
): Promise<FullArticle | undefined> => {
  const [article] = dated(
    await db
      .select({
        ...teaserColumns,
        id: articles.id,
        body: articles.body,
        categoryId: articles.categoryId,
        authorBio: users.bio,
        authorRole: users.role,
        authorForm: users.form,
      })
      .from(articles)
      .innerJoin(categories, eq(categories.id, articles.categoryId))
      .innerJoin(users, eq(users.id, articles.authorId))
      .where(and(live(), eq(articles.slug, slug)))
      .limit(1),
  );

  return article === undefined
    ? undefined
    : { ...article, authorSlug: toSlug(article.authorName) };
};

/** Screen 13a shows two from the article's own category and one from outside. */
export const relatedArticles = async (
  article: FullArticle,
): Promise<ArticleTeaser[]> =>
  dated(
    await teaserQuery()
      .where(and(live(), sql`${articles.id} <> ${article.id}`))
      .orderBy(
        sql`(${articles.categoryId} = ${article.categoryId}) desc`,
        desc(articles.publishedAt),
      )
      .limit(3),
  );

/**
 * A slug survives the article it named. A link printed in the school paper or
 * sent around last term still has to arrive, so an address that is no longer
 * current names where it went instead of nothing.
 */
export const currentSlugForRetiredSlug = async (retired: string) => {
  const [row] = await db
    .select({ slug: articles.slug })
    .from(slugHistory)
    .innerJoin(articles, eq(articles.id, slugHistory.articleId))
    .where(and(eq(slugHistory.oldSlug, retired), live()))
    .limit(1);

  return row?.slug;
};

export const articleCategories = () =>
  db
    .select({ slug: categories.slug, name: categories.name })
    .from(categories)
    .orderBy(asc(categories.position));

export const publishedYears = async () => {
  const rows = await db
    .select({
      year: sql<number>`extract(year from ${articles.publishedAt})::int`,
    })
    .from(articles)
    .where(live())
    .groupBy(sql`extract(year from ${articles.publishedAt})`)
    .orderBy(sql`extract(year from ${articles.publishedAt}) desc`);

  return rows.map((row) => row.year);
};

export type ArchiveAuthor = { name: string; slug: string };

/** Only people with something to read: an empty filter would be a dead link. */
export const publishedAuthors = async (): Promise<ArchiveAuthor[]> => {
  const rows = await db
    .selectDistinct({ name: users.name })
    .from(articles)
    .innerJoin(users, eq(users.id, articles.authorId))
    .where(live())
    .orderBy(asc(users.name));

  return rows.map((row) => ({ name: row.name, slug: toSlug(row.name) }));
};

/**
 * The author is addressed by the slug of their name rather than by an id, so a
 * filtered archive can be read, spoken and pasted. Resolving it needs the whole
 * editorial team in memory, which is eight rows.
 */
const authorIdForSlug = async (slug: string) => {
  const rows = await db.select({ id: users.id, name: users.name }).from(users);
  return rows.find((row) => toSlug(row.name) === slug)?.id;
};

export type ArchiveFilters = {
  query?: string;
  categorySlug?: string;
  year?: number;
  authorSlug?: string;
};

export const archiveResults = async (
  filters: ArchiveFilters,
): Promise<ArticleTeaser[]> => {
  const conditions = [live()];

  if (filters.query !== undefined && filters.query.length > 0) {
    const pattern = likeContains(filters.query);
    // The index answers whole words the German dictionary stems; the two
    // patterns answer the reader who stopped typing after four letters.
    conditions.push(sql`(
      to_tsvector('german', ${articles.title} || ' ' || ${articles.teaser})
        @@ plainto_tsquery('german', ${filters.query})
      or ${articles.title} ilike ${pattern} escape ${LIKE_ESCAPE}
      or ${articles.teaser} ilike ${pattern} escape ${LIKE_ESCAPE}
    )`);
  }

  if (filters.categorySlug !== undefined) {
    conditions.push(eq(categories.slug, filters.categorySlug));
  }

  if (filters.year !== undefined) {
    conditions.push(
      sql`extract(year from ${articles.publishedAt})::int = ${filters.year}`,
    );
  }

  if (filters.authorSlug !== undefined) {
    const authorId = await authorIdForSlug(filters.authorSlug);
    conditions.push(
      authorId === undefined ? sql`false` : eq(articles.authorId, authorId),
    );
  }

  return dated(
    await teaserQuery()
      .where(and(...conditions))
      .orderBy(desc(articles.publishedAt)),
  );
};

export const activeSponsors = () =>
  db
    .select({
      name: sponsors.name,
      initials: sponsors.initials,
      url: sponsors.url,
      kind: sponsors.kind,
    })
    .from(sponsors)
    .where(
      and(
        eq(sponsors.active, true),
        eq(sponsors.status, "published"),
        lte(sponsors.startsAt, sql`now()`),
        sql`${sponsors.endsAt} > now()`,
      ),
    )
    .orderBy(asc(sponsors.name));

export type EditorialMember = {
  name: string;
  initials: string;
  email: string;
  bio: string | null;
  ressorts: string[];
  role: (typeof userRole.enumValues)[number];
  form: (typeof userForm.enumValues)[number];
};

/**
 * Invited people are not on the masthead yet. The order is rank first and then
 * name: the sequence screens 3a and 9a print is hand-made, and nothing in the
 * table records it.
 */
export const editorialMembers = (): Promise<EditorialMember[]> =>
  db
    .select({
      name: users.name,
      initials: users.initials,
      email: users.email,
      bio: users.bio,
      ressorts: users.ressorts,
      role: users.role,
      form: users.form,
    })
    .from(users)
    .where(eq(users.status, "aktiv"))
    .orderBy(desc(users.role), asc(users.name));

export const pageBySlug = async (slug: string) => {
  const [page] = await db
    .select({ title: pages.title, body: pages.body, updatedAt: pages.updatedAt })
    .from(pages)
    .where(eq(pages.slug, slug))
    .limit(1);

  return page;
};

export type GalleryMeme = {
  id: string;
  caption: string | null;
  createdAt: Date;
  imageId: string;
  width: number;
  height: number;
  alt: string | null;
};

/**
 * The cursor names the last meme of the previous page rather than the instant
 * that meme was created, because the instant identifies nothing: `defaultNow()`
 * is the statement timestamp, so everything uploaded in one batch carries the
 * same one and a cursor that knew only the instant dropped every row sharing
 * it. A timestamp that has been through a URL and a JavaScript Date has also
 * lost its microseconds and no longer names the row it was read from. The id
 * carries both facts exactly, and a cursor naming a meme that has since been
 * taken down opens the gallery at the top instead of at nothing.
 */
export const memeGallery = async (limit: number, after?: string) => {
  const olderThanCursor =
    after === undefined
      ? undefined
      : sql`(
          not exists (
            select 1 from ${memes} as cursor_meme where cursor_meme.id = ${after}::uuid
          )
          or (${memes.createdAt}, ${memes.id}) < (
            select cursor_meme.created_at, cursor_meme.id
              from ${memes} as cursor_meme
             where cursor_meme.id = ${after}::uuid
          )
        )`;

  const rows: GalleryMeme[] = await db
    .select({
      id: memes.id,
      caption: memes.caption,
      createdAt: memes.createdAt,
      imageId: images.id,
      width: images.width,
      height: images.height,
      alt: images.alt,
    })
    .from(memes)
    .innerJoin(images, eq(images.id, memes.imageId))
    .where(
      and(
        eq(memes.status, "published"),
        eq(memes.visible, true),
        olderThanCursor,
      ),
    )
    // The sort has to be total, or the page the cursor cuts is not the page the
    // reader was looking at.
    .orderBy(desc(memes.createdAt), desc(memes.id))
    .limit(limit + 1);

  return { memes: rows.slice(0, limit), hasOlder: rows.length > limit };
};

export const publishedMemeCount = async () => {
  const [row] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(memes)
    .where(and(eq(memes.status, "published"), eq(memes.visible, true)));

  return row.total;
};

export const imageRecord = async (id: string) => {
  const [image] = await db
    .select({
      key: images.key,
      mime: images.mime,
      alt: images.alt,
      width: images.width,
      height: images.height,
    })
    .from(images)
    .where(eq(images.id, id))
    .limit(1);

  return image;
};
