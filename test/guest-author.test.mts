import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import { eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { articles } from "@/lib/db/schema";
import { pool } from "@/lib/db/pool";
import { archivePage, articleBySlug } from "@/lib/queries";

/**
 * A byline for somebody without an account. What it must not do is move the
 * article: `author_id` still decides who may edit it, and only the name under
 * the headline changes.
 *
 * One article is picked once and held by its slug. Asking for "the newest" in
 * every step would follow whatever another test file published in between —
 * the suite runs file-parallel against one database.
 */

const GUEST = "Klasse 8c";

let slug: string;
let id: string;
let memberName: string;

before(async () => {
  const [row] = await db
    .select({ id: articles.id, slug: articles.slug })
    .from(articles)
    .where(eq(articles.status, "published"))
    .limit(1);
  assert.ok(row, "the seed has no published article");

  id = row.id;
  slug = row.slug;

  const before_ = await articleBySlug(slug);
  assert.ok(before_);
  memberName = before_.authorName;

  await db.update(articles).set({ guestAuthor: GUEST }).where(eq(articles.id, id));
});

after(async () => {
  await db.update(articles).set({ guestAuthor: null }).where(eq(articles.id, id));
  await pool().end();
});

describe("an article written by somebody without an account", () => {
  it("prints the typed name and not the account holder's", async () => {
    const article = await articleBySlug(slug);
    assert.ok(article);
    assert.equal(article.authorName, GUEST);
    assert.notEqual(article.authorName, memberName);
  });

  it("takes its initials from the typed name", async () => {
    const article = await articleBySlug(slug);
    assert.equal(article?.authorInitials, "K8");
  });

  it("links nowhere, because the archive has nobody to filter by", async () => {
    const article = await articleBySlug(slug);
    assert.equal(article?.authorSlug, null);
  });

  it("is never marked as a former member, having never been one", async () => {
    const article = await articleBySlug(slug);
    assert.equal(article?.authorFormer, false);
  });

  it("does not move the article away from the account that owns it", async () => {
    const [row] = await db
      .select({ authorId: articles.authorId })
      .from(articles)
      .where(eq(articles.id, id));

    assert.ok(row?.authorId, "the owner must still be set");
  });

  it("stands in the archive like any other", async () => {
    const { rows } = await archivePage({}, 0, 500);
    const guest = rows.find((article) => article.slug === slug);
    assert.ok(guest, "a guest byline must not drop the article out of the archive");
    assert.equal(guest.authorName, GUEST);
    assert.equal(guest.authorSlug, null);
  });
});
