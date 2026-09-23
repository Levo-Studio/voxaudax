import "server-only";
import { and, asc, count, desc, eq, sql } from "drizzle-orm";

import type { Member } from "@/lib/authorize";
import { somebodyElseCouldApprove } from "@/lib/editorial/second-pair";
import type { ArticleCover, TipTapDocument } from "@/lib/content";
import { db } from "@/lib/db/client";
import { reconcileArticleImages } from "@/lib/editorial/detached-images";
import { articles, categories, slugHistory, users } from "@/lib/db/schema";
import { may } from "@/lib/roles";
import { LIKE_ESCAPE, likeContains } from "@/lib/search";
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
  rejectionReason: articles.rejectionReason,
  updatedAt: articles.updatedAt,
  publishAt: articles.publishAt,
  publishedAt: articles.publishedAt,
  submittedAt: articles.submittedAt,
  wordCount: articles.wordCount,
  cover: articles.cover,
  categoryName: categories.name,
  authorId: articles.authorId,
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
    /** Only what this member wrote — the list a redakteur reads to find their own. */
    readonly mineOnly?: boolean;
  },
) => {
  const search = filter.query?.trim();

  /**
   * The same escaping the public archive does, for the same reason lib/search
   * gives: handed straight to `ilike`, a search for "50%" answers every article
   * with "50" in it and a search for "%" answers all of them. Written out as
   * SQL rather than through drizzle's `ilike`, which produces no `escape`
   * clause to name the character with.
   */
  const pattern =
    search === undefined || search.length === 0 ? null : likeContains(search);

  return withJoins()
    .where(
      and(
        reachableBy(member),
        filter.mineOnly === true ? eq(articles.authorId, member.id) : undefined,
        filter.status === undefined ? undefined : eq(articles.status, filter.status),
        pattern === null
          ? undefined
          : sql`(${articles.title} ilike ${pattern} escape ${LIKE_ESCAPE}
              or ${articles.teaser} ilike ${pattern} escape ${LIKE_ESCAPE})`,
      ),
    )
    .orderBy(SORTS[filter.sort ?? "changed"].order)
    .limit(200);
};

/** How many of the reachable articles this member wrote themselves. */
export const countOwnArticles = async (member: Member) => {
  const [row] = await db
    .select({ total: count() })
    .from(articles)
    .where(and(reachableBy(member), eq(articles.authorId, member.id)));

  return row?.total ?? 0;
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
      guestAuthor: articles.guestAuthor,
      body: articles.body,
      cover: articles.cover,
      categoryId: articles.categoryId,
      authorId: articles.authorId,
      status: articles.status,
      rejectionReason: articles.rejectionReason,
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
 *
 * Only the pictures in the body are asked about: covers are generated from the
 * title and the palette and carry no photograph any more.
 */
export const missingAltText = (input: { readonly body: TipTapDocument }) =>
  bodyImagesMissingAlt(input.body);

/**
 * Every address that is spoken for. Where an article is named, its own are not:
 * neither the slug it carries nor one it used to carry is a collision with
 * anybody else, and counting them as one is how a rename answered "x-2" to a
 * field that `slugStanding` had just called free — including the one that was
 * typed as a no-op, where the article was renamed away from itself.
 */
const takenSlugs = async (exceptArticleId?: string) => {
  const [current, historic] = await Promise.all([
    db.select({ slug: articles.slug, articleId: articles.id }).from(articles),
    db.select({ slug: slugHistory.oldSlug, articleId: slugHistory.articleId }).from(slugHistory),
  ]);

  return new Set(
    [...current, ...historic]
      .filter((row) => row.articleId !== exceptArticleId)
      .map((row) => row.slug),
  );
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
  /**
   * A name for somebody without an account, or null for the account holder's
   * own. It changes the byline and nothing else: who may edit the row is still
   * decided by `authorId`, which this does not touch.
   */
  readonly guestAuthor: string | null;
  /**
   * The stand of the row the editor is writing over: `updated_at` as it was
   * when this document was last read or last saved from this screen.
   */
  readonly knownUpdatedAt: Date;
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
 *
 * Answers `"conflict"` when the row has moved on since the editor read it, and
 * writes nothing. Autosave sends the whole document every time, so without this
 * the last tab to speak replaces paragraphs it never saw — a redakteur reading
 * somebody's draft may save it, the same author may have it open twice, and
 * there is no revision to take the lost text back out of.
 */
export const saveArticle = async (
  member: Member,
  articleId: string,
  patch: ArticlePatch,
) => {
  const existing = await articleForEditor(member, articleId);
  if (existing === null || existing.status !== "draft") return null;

  const updatedAt = new Date();

  // Truncated on the column rather than compared as it stands: a draft created
  // by `createDraft` carries the microseconds of the database's own `now()`,
  // and the driver hands a JavaScript Date back in milliseconds — an equality
  // against the value the editor was given would never hold again.
  const [written] = await db
    .update(articles)
    .set({
      title: patch.title,
      teaser: patch.teaser,
      guestAuthor: patch.guestAuthor,
      body: patch.body,
      cover: patch.cover,
      categoryId: patch.categoryId,
      publishAt: patch.publishAt,
      wordCount: countWords(patch.body),
      updatedAt,
    })
    .where(
      and(
        eq(articles.id, articleId),
        sql`date_trunc('milliseconds', ${articles.updatedAt}) = ${patch.knownUpdatedAt}`,
      ),
    )
    .returning({ id: articles.id });

  if (written === undefined) return "conflict" as const;

  // A picture the writer just took out of the text is taken out for good — but
  // marked rather than deleted, because an undo a second later would otherwise
  // find nothing where its address points. `reconcileArticleImages` never
  // throws: losing a photograph must not cost the paragraph it stood in.
  await reconcileArticleImages(existing.body, patch.body);

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

  const slug = freeSlug(slugify(wanted), await takenSlugs(articleId));
  if (slug === existing.slug) return existing.slug;

  await db.transaction(async (tx) => {
    if (existing.publishedAt !== null) {
      await tx
        .insert(slugHistory)
        .values({ oldSlug: existing.slug, articleId })
        .onConflictDoNothing();
    }

    // Taking an old address back means it resolves to the article again, so the
    // redirect it left behind has to go — an article that forwards to itself is
    // a loop, and the row would make the address look spoken for next time.
    await tx
      .delete(slugHistory)
      .where(and(eq(slugHistory.oldSlug, slug), eq(slugHistory.articleId, articleId)));

    await tx
      .update(articles)
      .set({ slug, updatedAt: new Date() })
      .where(eq(articles.id, articleId));
  });

  return slug;
};

/**
 * What "Zur Freigabe" does depends on who presses it.
 *
 * An author hands the article in and it waits. A redakteur or a chefredakteur
 * does not hand anything in: they are who the queue would hand it to, and
 * asking them to file their own work so that they can approve it a screen later
 * is ceremony, not review.
 *
 * What does not depend on the role is the alt text. A picture nobody can hear
 * is not finished whoever wrote the article, so the same rule that blocks an
 * approval blocks this — and the answer says so, in the same words the review
 * screen uses.
 */
export const submitForReview = async (member: Member, articleId: string) => {
  const existing = await articleForEditor(member, articleId);
  if (existing === null || existing.status !== "draft") return "unknown" as const;

  const publishes = may(member.role, "approveArticlesAndMemes");
  if (publishes && (await missingAltText(existing))) return "alt_text_missing" as const;

  await db
    .update(articles)
    .set(
      publishes
        ? {
            status: "published",
            // A scheduled article keeps its hour: the public read asks for
            // `published_at <= now()`, so a future date is the schedule.
            publishedAt: existing.publishAt ?? new Date(),
            submittedAt: new Date(),
            rejectionReason: null,
            updatedAt: new Date(),
          }
        : {
            status: "review",
            submittedAt: new Date(),
            // The reason described the draft that was sent back; once it is
            // handed in again it describes nothing, and leaving it would have
            // the author reading an objection to work they have already redone.
            rejectionReason: null,
            updatedAt: new Date(),
          },
    )
    .where(eq(articles.id, articleId));

  return publishes ? ("published" as const) : ("submitted" as const);
};

/** Carries the body as well, because the alt-text question is asked of it. */
export const listSubmittedArticles = () =>
  withJoins()
    .where(eq(articles.status, "review"))
    .orderBy(asc(articles.submittedAt));

/**
 * Which of the waiting articles a missing alt text blocks.
 *
 * Read apart from the list, because it is read apart from it: the tab bar on
 * screen 11a counts all three queues, so the list above is read whichever tab
 * is open, and `body` — the heaviest column in the table — is only asked about
 * on the one tab that shows articles.
 */
export const submittedArticlesBlockedByAltText = async () => {
  const rows = await db
    .select({ id: articles.id, body: articles.body })
    .from(articles)
    .where(eq(articles.status, "review"));

  return new Set(rows.filter((row) => missingAltText(row)).map((row) => row.id));
};

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
  if (
    row.authorId === approver.id &&
    (await somebodyElseCouldApprove(approver, "approveArticlesAndMemes"))
  ) {
    return "own_submission" as const;
  }
  if (await missingAltText(row)) return "alt_text_missing" as const;

  // A scheduled article is published now and appears at its own hour: the
  // public read asks for `published_at <= now()`, so the future date is the
  // schedule and no second process has to come back for it.
  const publishedAt = row.publishAt ?? new Date();

  // The status is read again by the write itself. Two reviewers have the queue
  // open at once by design, and between the select above and this line the
  // other one may have sent the article back — without this the later write
  // simply wins, and a rejected article stands published while its reason is
  // shown to nobody.
  const [updated] = await db
    .update(articles)
    .set({ status: "published", publishedAt, updatedAt: new Date() })
    .where(and(eq(articles.id, articleId), eq(articles.status, "review")))
    .returning({ id: articles.id });

  return updated === undefined ? ("unknown" as const) : ("approved" as const);
};

export const returnToDraft = async (
  approver: Member,
  articleId: string,
  reason: string,
) => {
  const [row] = await db
    .select({ authorId: articles.authorId, status: articles.status })
    .from(articles)
    .where(eq(articles.id, articleId));

  if (row === undefined || row.status !== "review") return "unknown" as const;
  if (
    row.authorId === approver.id &&
    (await somebodyElseCouldApprove(approver, "approveArticlesAndMemes"))
  ) {
    return "own_submission" as const;
  }

  // Asked again in the write, for the reason `approveArticle` gives: whichever
  // of two simultaneous decisions lands first is the decision, and the other
  // one is told the article is no longer in review.
  const [updated] = await db
    .update(articles)
    .set({
      status: "draft",
      submittedAt: null,
      rejectionReason: reason,
      updatedAt: new Date(),
    })
    .where(and(eq(articles.id, articleId), eq(articles.status, "review")))
    .returning({ id: articles.id });

  return updated === undefined ? ("unknown" as const) : ("returned" as const);
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

/**
 * A category the editors add while filing an article. The chip row on the home
 * page reads the table, so a new one appears there by itself — as soon as
 * something is published in it, which is the rule that keeps a chip from
 * leading into an empty archive.
 *
 * A name that already exists returns the row that has it rather than a second
 * one beside it: the slug is what an address is built from, and two categories
 * sharing one would be two chips leading to the same list.
 */
/**
 * An arbitrary but fixed number: an advisory lock is only ever a lock against
 * whoever asks for the same one, and nothing else in this application does.
 */
const CATEGORY_LOCK = 8_312_001;

export const createCategory = async (name: string) => {
  const slug = slugify(name);
  if (slug.length === 0) return null;

  /**
   * Both answers below are read and then written in a second statement, and
   * both columns are unique: two authors filing at the same moment read the
   * same highest `position` and the same absent slug, and the second insert
   * comes back as a constraint violation rather than as a category. The lock
   * is held for the transaction and taken nowhere else, so all it serialises
   * is adding a category — which happens a few times a year.
   */
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(${CATEGORY_LOCK})`);

    const [existing] = await tx
      .select({ id: categories.id, slug: categories.slug, name: categories.name })
      .from(categories)
      .where(eq(categories.slug, slug))
      .limit(1);

    if (existing !== undefined) return existing;

    // `position` orders the chip row and is unique, so the new one goes last.
    const [last] = await tx
      .select({ highest: sql<number>`coalesce(max(${categories.position}), 0)` })
      .from(categories);

    const [created] = await tx
      .insert(categories)
      .values({ slug, name: name.trim(), position: (last?.highest ?? 0) + 1 })
      .returning({ id: categories.id, slug: categories.slug, name: categories.name });

    return created ?? null;
  });
};

/**
 * Whether an address is still to be had. `freeSlug` would silently append a
 * number, which is the right thing when a draft is created and the wrong thing
 * when somebody is typing an address on purpose — so the editor asks first and
 * says which of the two it is.
 */
export const slugStanding = async (articleId: string, wanted: string) => {
  const slug = slugify(wanted);
  if (slug.length === 0) return { slug, free: false as const, reason: "leer" as const };

  const [taken] = await db
    .select({ id: articles.id })
    .from(articles)
    .where(eq(articles.slug, slug))
    .limit(1);

  if (taken !== undefined) {
    return taken.id === articleId
      ? { slug, free: true as const, reason: "eigener" as const }
      : { slug, free: false as const, reason: "belegt" as const };
  }

  // A slug an article once had still resolves, so handing it to another one
  // would break the redirect that promise rests on.
  const [historic] = await db
    .select({ articleId: slugHistory.articleId })
    .from(slugHistory)
    .where(eq(slugHistory.oldSlug, slug))
    .limit(1);

  return historic === undefined || historic.articleId === articleId
    ? { slug, free: true as const, reason: "frei" as const }
    : { slug, free: false as const, reason: "vergeben" as const };
};
