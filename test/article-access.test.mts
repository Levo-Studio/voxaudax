import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import { eq, inArray, ne } from "drizzle-orm";

import type { Member } from "@/lib/authorize";
import { db } from "@/lib/db/client";
import { articles, images, users } from "@/lib/db/schema";
import { pool } from "@/lib/db/pool";
import {
  approveArticle,
  type ArticlePatch,
  articleForEditor,
  countArticlesByStatus,
  countPendingReview,
  listArticles,
  listSubmittedArticles,
  missingAltText,
  renameSlug,
  returnToDraft,
  saveArticle,
  submitForReview,
} from "@/lib/editorial/articles";

/**
 * The claim screen 7c makes is that another author's draft is "weder sichtbar
 * noch aufrufbar". Hiding the link is the sichtbar half; this is the aufrufbar
 * half, and it is the half a guessed URL tests.
 *
 * `articleForEditor` is the whole of what `/admin/artikel/[id]` does with the
 * id it was handed — the page has no second check, and a null answer is its
 * `notFound()`. So calling it with one member's session and another member's
 * draft is the same request as typing that URL.
 */

const memberFor = async (email: string): Promise<Member> => {
  const [row] = await db.select().from(users).where(eq(users.email, email));
  assert.ok(row, `the seed has no member ${email}`);

  return {
    id: row.id,
    // The tests below never resolve a session, so the account id only has to be
    // a value; every query keys on the editorial row's own id.
    velveUserId: row.velveUserId ?? row.id,
    email: row.email,
    name: row.name,
    initials: row.initials,
    role: row.role,
    form: row.form,
    bio: row.bio,
    mustChangePassword: row.mustChangePassword,
  };
};

describe("an author cannot reach another author's draft by URL", () => {
  let owner: Member;
  let stranger: Member;
  let editor: Member;
  let draftId: string;
  let imageId: string;

  before(async () => {
    owner = await memberFor("emil.radtke@voxaudax.de");
    stranger = await memberFor("paul.ostermann@voxaudax.de");
    editor = await memberFor("mira.oezkan@voxaudax.de");

    assert.equal(owner.role, "autor");
    assert.equal(stranger.role, "autor");
    assert.equal(editor.role, "redakteur");

    const [image] = await db
      .insert(images)
      .values({
        key: `test/${crypto.randomUUID()}.png`,
        mime: "image/png",
        width: 1200,
        height: 630,
        alt: null,
        uploadedBy: owner.id,
      })
      .returning({ id: images.id });
    imageId = image!.id;

    const [category] = await db.execute<{ id: string }>(
      "select id from categories order by position limit 1",
    ).then((result) => result.rows);

    const [created] = await db
      .insert(articles)
      .values({
        slug: `test-fremder-entwurf-${crypto.randomUUID()}`,
        title: "Fremder Entwurf",
        teaser: "Gehört Emil und niemandem sonst.",
        // The picture stands in the body: a cover is generated and holds none.
        body: {
          type: "doc",
          content: [{ type: "image", attrs: { src: `/bild/${imageId}`, alt: "" } }],
        },
        cover: { word: "TEST", line: "", colorId: "violett" },
        categoryId: category!.id,
        authorId: owner.id,
        status: "draft",
      })
      .returning({ id: articles.id });

    draftId = created!.id;
  });

  after(async () => {
    await db.delete(articles).where(eq(articles.id, draftId));
    await db.delete(images).where(eq(images.id, imageId));
  });

  it("answers nothing for the other author, which the route turns into a 404", async () => {
    assert.equal(await articleForEditor(stranger, draftId), null);
  });

  it("answers the draft for the author who wrote it", async () => {
    const reached = await articleForEditor(owner, draftId);
    assert.equal(reached?.id, draftId);
  });

  it("answers the draft for a redakteur, who may see other people's drafts", async () => {
    const reached = await articleForEditor(editor, draftId);
    assert.equal(reached?.id, draftId);
  });

  it("refuses the write as well, not only the read", async () => {
    const saved = await saveArticle(stranger, draftId, {
      title: "Übernommen",
      teaser: "",
      body: { type: "doc", content: [] },
      cover: { word: "X", line: "", colorId: "violett" },
      guestAuthor: null,
      categoryId: (await articleForEditor(owner, draftId))!.categoryId,
      publishAt: null,
      knownUpdatedAt: (await articleForEditor(owner, draftId))!.updatedAt,
    });

    assert.equal(saved, null);

    const untouched = await articleForEditor(owner, draftId);
    assert.equal(untouched?.title, "Fremder Entwurf");
  });

  it("refuses to submit it for review on the other author's behalf", async () => {
    assert.equal(await submitForReview(stranger, draftId), "unknown");
  });

  it("keeps it out of the other author's list and out of their counts", async () => {
    const listed = await listArticles(stranger, {});
    assert.ok(listed.every((row) => row.authorName === stranger.name));
    assert.ok(!listed.some((row) => row.id === draftId));

    const counts = await countArticlesByStatus(stranger);
    const [{ total }] = await db
      .select({ total: articles.id })
      .from(articles)
      .where(eq(articles.authorId, stranger.id))
      .then((rows) => [{ total: rows.length }]);

    assert.equal(counts.all, total);
  });

  it("shows it to a redakteur's list", async () => {
    const listed = await listArticles(editor, { status: "draft" });
    assert.ok(listed.some((row) => row.id === draftId));
  });
});

describe("the two rules the review screen states", () => {
  let owner: Member;
  let editor: Member;
  let draftId: string;
  let imageId: string;

  before(async () => {
    owner = await memberFor("mira.oezkan@voxaudax.de");
    editor = await memberFor("lina.brenner@voxaudax.de");

    const [image] = await db
      .insert(images)
      .values({
        key: `test/${crypto.randomUUID()}.png`,
        mime: "image/png",
        width: 1200,
        height: 630,
        alt: null,
        uploadedBy: owner.id,
      })
      .returning({ id: images.id });
    imageId = image!.id;

    const [category] = await db
      .execute<{ id: string }>("select id from categories order by position limit 1")
      .then((result) => result.rows);

    const [created] = await db
      .insert(articles)
      .values({
        slug: `test-eingereicht-${crypto.randomUUID()}`,
        title: "Eingereicht von Mira",
        teaser: "Wartet auf eine Freigabe.",
        // The picture stands in the body: a cover is generated and holds none.
        body: {
          type: "doc",
          content: [{ type: "image", attrs: { src: `/bild/${imageId}`, alt: "" } }],
        },
        cover: { word: "TEST", line: "", colorId: "violett" },
        categoryId: category!.id,
        authorId: owner.id,
        status: "review",
        submittedAt: new Date(),
      })
      .returning({ id: articles.id });

    draftId = created!.id;
  });

  after(async () => {
    await db.delete(articles).where(eq(articles.id, draftId));
    await db.delete(images).where(eq(images.id, imageId));
  });

  it("refuses the submitter's own approval, even though the submitter is a redakteur", async () => {
    assert.equal(await approveArticle(owner, draftId), "own_submission");
  });

  it("blocks somebody else's approval while a picture has no alt text", async () => {
    assert.equal(await approveArticle(editor, draftId), "alt_text_missing");
  });

  it("reports the missing alt text the way the screen draws it", async () => {
    const article = await articleForEditor(editor, draftId);
    assert.equal(missingAltText({ body: article!.body }), true);
  });

  it("approves once the alt text is there", async () => {
    // A picture in the body carries its description in the document node, not
    // in the images row: that column belongs to memes and sponsor logos.
    await db
      .update(articles)
      .set({
        body: {
          type: "doc",
          content: [
            { type: "image", attrs: { src: `/bild/${imageId}`, alt: "Ein Testbild" } },
          ],
        },
      })
      .where(eq(articles.id, draftId));

    assert.equal(await approveArticle(editor, draftId), "approved");

    const published = await articleForEditor(editor, draftId);
    assert.equal(published?.status, "published");
    assert.notEqual(published?.publishedAt, null);
  });
});

describe("an approved article is not editable by the author who submitted it", () => {
  let author: Member;
  let articleId: string;

  const patch = (
    title: string,
  ): Omit<ArticlePatch, "categoryId" | "knownUpdatedAt"> => ({
    title,
    teaser: "Nach der Freigabe ersetzt.",
    body: { type: "doc", content: [] },
    cover: { word: "X", line: "", colorId: "violett" },
    guestAuthor: null,
    publishAt: null,
  });

  before(async () => {
    author = await memberFor("emil.radtke@voxaudax.de");

    const [category] = await db
      .execute<{ id: string }>("select id from categories order by position limit 1")
      .then((result) => result.rows);

    const [created] = await db
      .insert(articles)
      .values({
        slug: `test-freigegeben-${crypto.randomUUID()}`,
        title: "Harmlos eingereicht",
        teaser: "So stand es da, als es gelesen wurde.",
        body: { type: "doc", content: [{ type: "paragraph", content: [] }] },
        cover: { word: "TEST", line: "", colorId: "violett" },
        categoryId: category!.id,
        authorId: author.id,
        status: "draft",
      })
      .returning({ id: articles.id });

    articleId = created!.id;
  });

  after(async () => {
    await db.delete(articles).where(eq(articles.id, articleId));
  });

  const categoryOf = async () => (await articleForEditor(author, articleId))!.categoryId;
  const standOf = async () => (await articleForEditor(author, articleId))!.updatedAt;

  it("saves while the article is still a draft", async () => {
    const saved = await saveArticle(author, articleId, {
      ...patch("Noch ein Entwurf"),
      categoryId: await categoryOf(),
      knownUpdatedAt: await standOf(),
    });

    assert.notEqual(saved, null);
    assert.equal((await articleForEditor(author, articleId))?.title, "Noch ein Entwurf");
  });

  /**
   * Two tabs, or an author and a redakteur in the same draft. Autosave sends
   * the whole document, so the second write would replace text it never read.
   */
  it("refuses a write pinned to a stand the row has moved past", async () => {
    const stale = new Date(Date.now() - 60_000);

    const saved = await saveArticle(author, articleId, {
      ...patch("Aus einem Tab, der den Entwurf von vorhin hält"),
      categoryId: await categoryOf(),
      knownUpdatedAt: stale,
    });

    assert.equal(saved, "conflict");
    assert.equal((await articleForEditor(author, articleId))?.title, "Noch ein Entwurf");
  });

  it("refuses the write once the article waits for a review", async () => {
    const categoryId = await categoryOf();
    const stand = await standOf();
    await db.update(articles).set({ status: "review" }).where(eq(articles.id, articleId));

    const saved = await saveArticle(author, articleId, {
      ...patch("Zwischen Lesen und Freigeben getauscht"),
      categoryId,
      knownUpdatedAt: stand,
    });

    assert.equal(saved, null);
    assert.equal((await articleForEditor(author, articleId))?.title, "Noch ein Entwurf");
  });

  it("refuses the write once the article is published", async () => {
    const categoryId = await categoryOf();
    const stand = await standOf();
    await db
      .update(articles)
      .set({ status: "published", publishedAt: new Date() })
      .where(eq(articles.id, articleId));

    const saved = await saveArticle(author, articleId, {
      ...patch("Nach der Freigabe uebernommen"),
      categoryId,
      knownUpdatedAt: stand,
    });

    assert.equal(saved, null);
    assert.equal((await articleForEditor(author, articleId))?.title, "Noch ein Entwurf");
  });

  it("refuses to rename the slug of a published article, which readers already hold", async () => {
    const before = (await articleForEditor(author, articleId))!.slug;

    assert.equal(await renameSlug(author, articleId, "ganz-neue-adresse"), null);
    assert.equal((await articleForEditor(author, articleId))?.slug, before);
  });
});

/**
 * The approving half of the review is read above. This is the other half, which
 * nothing read at all: an article goes in, comes back with a reason, is handed
 * in again and is approved. Two of the lines it turns on are single fields in a
 * single `set` — `submittedAt: null` on the way back and `rejectionReason: null`
 * on the way in again — and losing either is silent. EXTRAPOLATION.md makes the
 * second one a promise: the objection is to the draft that was sent back, and
 * an author who has already answered it must not still be reading it.
 */
describe("an article goes back with a reason and comes round again", () => {
  let author: Member;
  let reviewer: Member;
  let articleId: string;

  const REASON = "Die zweite Quelle fehlt noch.";

  before(async () => {
    author = await memberFor("emil.radtke@voxaudax.de");
    reviewer = await memberFor("mira.oezkan@voxaudax.de");

    const [category] = await db
      .execute<{ id: string }>("select id from categories order by position limit 1")
      .then((result) => result.rows);

    const [created] = await db
      .insert(articles)
      .values({
        slug: `test-ruecklauf-${crypto.randomUUID()}`,
        title: "Auf dem Weg durch die Freigabe",
        teaser: "Einreichen, zurückweisen, erneut einreichen, freigeben.",
        // No picture in the body: the alt-text rule is read elsewhere and would
        // answer before any of this.
        body: { type: "doc", content: [{ type: "paragraph", content: [] }] },
        cover: { word: "TEST", line: "", colorId: "violett" },
        categoryId: category!.id,
        authorId: author.id,
        status: "draft",
      })
      .returning({ id: articles.id });

    articleId = created!.id;
  });

  after(async () => {
    await db.delete(articles).where(eq(articles.id, articleId));
  });

  const standing = async () => (await articleForEditor(author, articleId))!;

  const waiting = async () =>
    (await listSubmittedArticles()).some((row) => row.id === articleId);

  it("waits in the queue once the author hands it in", async () => {
    assert.equal(await submitForReview(author, articleId), "submitted");

    const row = await standing();
    assert.equal(row.status, "review");
    assert.notEqual(row.submittedAt, null);
    assert.equal(await waiting(), true);
  });

  it("leaves the queue when it is sent back, and takes the reason with it", async () => {
    const pending = await countPendingReview();

    assert.equal(await returnToDraft(reviewer, articleId, REASON), "returned");

    const row = await standing();
    assert.equal(row.status, "draft");
    assert.equal(row.submittedAt, null);
    assert.equal(row.rejectionReason, REASON);
    assert.equal(await waiting(), false);
    assert.equal(await countPendingReview(), pending - 1);
  });

  it("cannot be sent back a second time, because it is no longer in the queue", async () => {
    assert.equal(await returnToDraft(reviewer, articleId, REASON), "unknown");
  });

  it("drops the reason when the author hands the article in again", async () => {
    assert.equal(await submitForReview(author, articleId), "submitted");

    const row = await standing();
    assert.equal(row.status, "review");
    assert.equal(row.rejectionReason, null);
  });

  it("is published by somebody who did not write it", async () => {
    assert.equal(await approveArticle(reviewer, articleId), "approved");

    const row = await standing();
    assert.equal(row.status, "published");
    assert.notEqual(row.publishedAt, null);
  });
});

describe("the seeded roles are the ones the matrix is written against", () => {
  it("has two admins, one redakteur and three autoren", async () => {
    const rows = await db
      .select({ role: users.role })
      .from(users)
      .where(
        inArray(users.email, [
          "lina.brenner@voxaudax.de",
          "jonas.weidmann@voxaudax.de",
          "mira.oezkan@voxaudax.de",
          "paul.ostermann@voxaudax.de",
          "emil.radtke@voxaudax.de",
          "sophie.adler@voxaudax.de",
        ]),
      );

    const tally = rows.reduce<Record<string, number>>((counted, row) => {
      counted[row.role] = (counted[row.role] ?? 0) + 1;
      return counted;
    }, {});

    assert.deepEqual(tally, { admin: 2, redakteur: 1, autor: 3 });
  });

  it("links no invited person to an account", async () => {
    const invited = await db
      .select({ velveUserId: users.velveUserId })
      .from(users)
      .where(ne(users.status, "aktiv"));

    assert.ok(invited.every((row) => row.velveUserId === null));
  });
});

// One pool serves the process, so it is closed once, after the last suite.
after(async () => {
  await pool().end();
});
