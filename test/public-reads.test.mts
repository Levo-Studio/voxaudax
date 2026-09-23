import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import { eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { articles, images, memes, slugHistory, users } from "@/lib/db/schema";
import { pool } from "@/lib/db/pool";
import { ARCHIVE_PAGE } from "@/lib/limits";
import {
  archiveResults,
  articleBySlug,
  currentSlugForRetiredSlug,
  everyPublishedArticle,
  homepageArticles,
  memeGallery,
  publishedArticleCount,
  publishedAuthors,
  publishedCategories,
  publishedYears,
  recentArticles,
} from "@/lib/queries";

/**
 * Everything a reader is ever shown comes out of `lib/queries`, and every one
 * of its reads narrows to `live()` — status `published` *and* the hour passed.
 * The condition is an ordinary argument that each query appends for itself, so
 * losing it out of one of them changes nothing anybody would notice until a
 * draft stands in the archive and a scheduled article in the feed, where the
 * feed readers keep it.
 *
 * So the question is asked of the queries themselves, with one of each kind of
 * article in the table: what a reader is offered is the published one and
 * nothing else.
 */

const RARE = "Ziegelmauerkompromiss";

describe("the public side shows what is published and nothing beside it", () => {
  let authorId: string;
  let authorName: string;
  let categoryId: string;
  let categorySlug: string;

  let publishedId: string;
  let scheduledId: string;
  let draftId: string;

  const publishedSlug = `test-oeffentlich-${crypto.randomUUID()}`;
  const scheduledSlug = `test-geplant-${crypto.randomUUID()}`;
  const draftSlug = `test-entwurf-${crypto.randomUUID()}`;
  const retiredSlug = `test-alt-${crypto.randomUUID()}`;
  const retiredScheduledSlug = `test-alt-geplant-${crypto.randomUUID()}`;

  const write = async (input: {
    readonly slug: string;
    readonly status: "draft" | "published";
    readonly publishedAt: Date | null;
  }) => {
    const [created] = await db
      .insert(articles)
      .values({
        slug: input.slug,
        title: `${RARE} ${input.slug}`,
        teaser: "Was die Leseschicht herausgibt und was nicht.",
        body: { type: "doc", content: [{ type: "paragraph", content: [] }] },
        cover: { word: "TEST", line: "", colorId: "violett" },
        categoryId,
        authorId,
        status: input.status,
        publishedAt: input.publishedAt,
      })
      .returning({ id: articles.id });

    return created!.id;
  };

  before(async () => {
    // Somebody the seed has already published under: the author filter offers
    // only people with something to read, so a fresh account would not be on it
    // at all and the filter would be asserted against nothing.
    const [author] = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.email, "emil.radtke@voxaudax.de"));
    assert.ok(author, "the seed has no member emil.radtke@voxaudax.de");
    authorId = author.id;
    authorName = author.name;

    const [category] = await db
      .execute<{ id: string; slug: string }>(
        "select id, slug from categories order by position limit 1",
      )
      .then((result) => result.rows);
    categoryId = category!.id;
    categorySlug = category!.slug;

    publishedId = await write({
      slug: publishedSlug,
      status: "published",
      publishedAt: new Date(Date.now() - 60_000),
    });

    // Approved and dated forward: the row carries the status, the hour does not.
    scheduledId = await write({
      slug: scheduledSlug,
      status: "published",
      publishedAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    });

    draftId = await write({ slug: draftSlug, status: "draft", publishedAt: null });

    await db.insert(slugHistory).values([
      { oldSlug: retiredSlug, articleId: publishedId },
      { oldSlug: retiredScheduledSlug, articleId: scheduledId },
    ]);
  });

  after(async () => {
    for (const id of [publishedId, scheduledId, draftId]) {
      await db.delete(slugHistory).where(eq(slugHistory.articleId, id));
      await db.delete(articles).where(eq(articles.id, id));
    }
  });

  const slugsOf = (teasers: readonly { slug: string }[]) => teasers.map((row) => row.slug);

  const holds = (teasers: readonly { slug: string }[], where: string) => {
    const slugs = slugsOf(teasers);
    assert.ok(slugs.includes(publishedSlug), `${where} is missing the published article`);
    assert.ok(!slugs.includes(scheduledSlug), `${where} carries a scheduled article`);
    assert.ok(!slugs.includes(draftSlug), `${where} carries a draft`);
  };

  it("puts the published one on the home page and neither of the others", async () => {
    holds(await homepageArticles(), "the home page");
  });

  it("answers the same for the feed, the sitemap and the archive", async () => {
    holds(await recentArticles(50), "the feed");
    holds(await everyPublishedArticle(), "the sitemap");
    holds(await archiveResults({}, 0, ARCHIVE_PAGE), "the archive");
  });

  /**
   * The figure beside the archive's heading. It is a second query with the same
   * condition rather than a count of the list, so it is asked separately —
   * against this suite's own rows, because the other suites publish and retract
   * articles in the same database while this one runs.
   */
  it("counts an article from the hour it is due and not before", async () => {
    const counting = async () => {
      const before = await publishedArticleCount();
      await db
        .update(articles)
        .set({ publishedAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000) })
        .where(eq(articles.id, publishedId));
      const withoutIt = await publishedArticleCount();
      await db
        .update(articles)
        .set({ publishedAt: new Date(Date.now() - 60_000) })
        .where(eq(articles.id, publishedId));

      return before - withoutIt;
    };

    // The delta is taken twice and one clean reading is enough: a suite that
    // publishes between the two counts moves the total by one as well, and a
    // rule that was actually lost gives the wrong delta every time.
    assert.ok(
      [await counting(), await counting()].includes(1),
      "the count does not follow the hour the article is due",
    );
  });

  it("answers under the slug of the published one only", async () => {
    assert.equal((await articleBySlug(publishedSlug))?.slug, publishedSlug);
    assert.equal(await articleBySlug(scheduledSlug), undefined);
    assert.equal(await articleBySlug(draftSlug), undefined);
  });

  /**
   * Screen 3b: "Bleibt nach Veröffentlichung stabil, alte Slugs leiten weiter."
   * A link printed on paper last term is the reason, and an article that is not
   * public yet forwards to nothing — the redirect would be the announcement.
   */
  it("forwards a retired slug to the article that carries it now", async () => {
    assert.equal(await currentSlugForRetiredSlug(retiredSlug), publishedSlug);
  });

  it("forwards nothing for a slug whose article has not appeared yet", async () => {
    assert.equal(await currentSlugForRetiredSlug(retiredScheduledSlug), undefined);
  });

  it("finds the published one through each of the archive's four filters", async () => {
    holds(await archiveResults({ query: RARE }, 0, ARCHIVE_PAGE), "the search");
    holds(await archiveResults({ categorySlug }, 0, ARCHIVE_PAGE), "the category filter");
    holds(
      await archiveResults({ year: new Date().getFullYear() }, 0, ARCHIVE_PAGE),
      "the year filter",
    );

    const author = (await publishedAuthors()).find((entry) => entry.name === authorName);
    assert.ok(author, "the author filter does not offer the author who published");
    holds(await archiveResults({ authorSlug: author.slug }, 0, ARCHIVE_PAGE), "the author filter");
  });

  it("offers no filter that leads into an empty list", async () => {
    const categories = await publishedCategories();
    assert.ok(categories.some((entry) => entry.slug === categorySlug));

    assert.ok((await publishedYears()).includes(new Date().getFullYear()));
  });
});

/**
 * The wall has the same two conditions as an article, written out rather than
 * shared: `status = 'published'` and `visible`. `rejectMeme` sets the second one
 * as well as the first precisely so that publishing a rejected meme by hand
 * still does not put it up — which is only true while the gallery asks for it.
 */
describe("the meme wall shows what is published and still visible", () => {
  let imageIds: string[] = [];
  let visibleIds: string[] = [];
  let hiddenId: string;

  before(async () => {
    const [uploader] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, "mira.oezkan@voxaudax.de"));
    assert.ok(uploader, "the seed has no member mira.oezkan@voxaudax.de");

    const rows = await db
      .insert(images)
      .values(
        Array.from({ length: 4 }, () => ({
          key: `test/${crypto.randomUUID()}.png`,
          mime: "image/png",
          width: 1,
          height: 1,
          alt: "Ein Meme",
          uploadedBy: uploader.id,
        })),
      )
      .returning({ id: images.id });
    imageIds = rows.map((row) => row.id);

    // All four in one statement, which is the case the cursor exists for:
    // `defaultNow()` is the statement timestamp, so these share one to the
    // microsecond and an instant alone names none of them.
    const created = await db
      .insert(memes)
      .values(
        imageIds.map((imageId, position) => ({
          imageId,
          caption: null,
          visible: position < 3,
          status: "published" as const,
          createdBy: uploader.id,
        })),
      )
      .returning({ id: memes.id, visible: memes.visible });

    visibleIds = created.filter((meme) => meme.visible).map((meme) => meme.id);
    hiddenId = created.find((meme) => !meme.visible)!.id;
  });

  after(async () => {
    for (const id of [...visibleIds, hiddenId]) {
      await db.delete(memes).where(eq(memes.id, id));
    }
    for (const id of imageIds) {
      await db.delete(images).where(eq(images.id, id));
    }
  });

  it("leaves a meme that was taken down off the wall", async () => {
    const { memes: shown } = await memeGallery(500);
    const ids = shown.map((meme) => meme.id);

    for (const id of visibleIds) assert.ok(ids.includes(id), "a published meme is missing");
    assert.ok(!ids.includes(hiddenId), "a meme that was taken down is on the wall");
  });

  /**
   * The cursor names a meme and not the instant it was created: everything
   * uploaded in one batch carries the same instant, and a cursor that knew only
   * the instant dropped every row sharing it.
   */
  it("hands out each meme once across two pages", async () => {
    const first = await memeGallery(2);
    assert.equal(first.memes.length, 2);
    assert.equal(first.hasOlder, true);

    const second = await memeGallery(2, first.memes[1]!.id);
    const ids = [...first.memes, ...second.memes].map((meme) => meme.id);

    assert.equal(new Set(ids).size, ids.length, "a meme was handed out twice");
    for (const id of visibleIds) assert.ok(ids.includes(id), "a meme fell between the pages");
  });

  it("opens the wall at the top for a cursor that names nothing", async () => {
    const { memes: shown } = await memeGallery(2, crypto.randomUUID());
    const { memes: top } = await memeGallery(2);

    assert.deepEqual(shown.map((meme) => meme.id), top.map((meme) => meme.id));
  });
});

after(async () => {
  await pool().end();
});
