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
  listArticles,
  missingAltText,
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
        body: { type: "doc", content: [{ type: "paragraph", content: [] }] },
        cover: { word: "TEST", line: "", colorId: "violett", imageId },
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
      categoryId: (await articleForEditor(owner, draftId))!.categoryId,
      publishAt: null,
    });

    assert.equal(saved, null);

    const untouched = await articleForEditor(owner, draftId);
    assert.equal(untouched?.title, "Fremder Entwurf");
  });

  it("refuses to submit it for review on the other author's behalf", async () => {
    assert.equal(await submitForReview(stranger, draftId), false);
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
        body: { type: "doc", content: [{ type: "paragraph", content: [] }] },
        cover: { word: "TEST", line: "", colorId: "violett", imageId },
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

  it("blocks somebody else's approval while the cover has no alt text", async () => {
    assert.equal(await approveArticle(editor, draftId), "alt_text_missing");
  });

  it("reports the missing alt text the way the screen draws it", async () => {
    const article = await articleForEditor(editor, draftId);
    assert.equal(await missingAltText({ cover: article!.cover, body: article!.body }), true);
  });

  it("approves once the alt text is there", async () => {
    await db.update(images).set({ alt: "Ein Testbild" }).where(eq(images.id, imageId));

    assert.equal(await approveArticle(editor, draftId), "approved");

    const published = await articleForEditor(editor, draftId);
    assert.equal(published?.status, "published");
    assert.notEqual(published?.publishedAt, null);
  });
});

describe("an approved article is not editable by the author who submitted it", () => {
  let author: Member;
  let articleId: string;

  const patch = (title: string): Omit<ArticlePatch, "categoryId"> => ({
    title,
    teaser: "Nach der Freigabe ersetzt.",
    body: { type: "doc", content: [] },
    cover: { word: "X", line: "", colorId: "violett" },
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

  it("saves while the article is still a draft", async () => {
    const saved = await saveArticle(author, articleId, {
      ...patch("Noch ein Entwurf"),
      categoryId: await categoryOf(),
    });

    assert.notEqual(saved, null);
    assert.equal((await articleForEditor(author, articleId))?.title, "Noch ein Entwurf");
  });

  it("refuses the write once the article waits for a review", async () => {
    const categoryId = await categoryOf();
    await db.update(articles).set({ status: "review" }).where(eq(articles.id, articleId));

    const saved = await saveArticle(author, articleId, {
      ...patch("Zwischen Lesen und Freigeben getauscht"),
      categoryId,
    });

    assert.equal(saved, null);
    assert.equal((await articleForEditor(author, articleId))?.title, "Noch ein Entwurf");
  });

  it("refuses the write once the article is published", async () => {
    const categoryId = await categoryOf();
    await db
      .update(articles)
      .set({ status: "published", publishedAt: new Date() })
      .where(eq(articles.id, articleId));

    const saved = await saveArticle(author, articleId, {
      ...patch("Nach der Freigabe uebernommen"),
      categoryId,
    });

    assert.equal(saved, null);
    assert.equal((await articleForEditor(author, articleId))?.title, "Noch ein Entwurf");
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
