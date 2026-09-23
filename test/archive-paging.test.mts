import assert from "node:assert/strict";
import { after, describe, it } from "node:test";

import { pool } from "@/lib/db/pool";
import { archivePage, publishedArticleCount } from "@/lib/queries";

/**
 * The archive used to fetch everything at once, capped at the ceiling. At
 * twelve articles that is a list; at five hundred it is a long scroll with
 * every cover of every year read before the first one.
 *
 * These are about the seam between two pages, which is where a paged list goes
 * wrong: an article shown twice, or one that falls between them and is shown
 * never.
 */

after(async () => {
  await pool().end();
});

describe("the archive in pages", () => {
  it("says there is more while there is, and stops saying it at the end", async () => {
    const total = await publishedArticleCount();
    assert.ok(total >= 3, "the seed needs a few published articles for this");

    const first = await archivePage({}, 0, 2);
    assert.equal(first.rows.length, 2);
    assert.equal(first.hasMore, total > 2);

    const last = await archivePage({}, Math.max(0, total - 2), 2);
    assert.equal(last.hasMore, false, "the final page must not offer another");
  });

  it("hands out no article twice and skips none between the pages", async () => {
    const total = await publishedArticleCount();
    const size = 3;

    const seen: string[] = [];
    for (let skip = 0; skip < total; skip += size) {
      const { rows } = await archivePage({}, skip, size);
      seen.push(...rows.map((article) => article.slug));
    }

    assert.equal(seen.length, total, "every published article has to appear once");
    assert.equal(new Set(seen).size, total, "and none of them twice");
  });

  it("keeps the order across the seam: newest first, without exception", async () => {
    // Asserted as a property rather than against a second fetch: the suite runs
    // file-parallel against one database, and another file publishing an
    // article between two calls would move the list underneath a comparison.
    const stitched = [
      ...(await archivePage({}, 0, 4)).rows,
      ...(await archivePage({}, 4, 4)).rows,
      ...(await archivePage({}, 8, 100)).rows,
    ];

    for (let row = 1; row < stitched.length; row += 1) {
      const older = stitched[row]!.publishedAt.getTime();
      const newer = stitched[row - 1]!.publishedAt.getTime();
      assert.ok(
        newer >= older,
        `${stitched[row - 1]!.slug} is older than ${stitched[row]!.slug} but stands above it`,
      );
    }
  });

  it("pages a filtered list the same way", async () => {
    const { rows } = await archivePage({}, 0, 100);
    assert.ok(rows[0], "the seed has no published article");
    const category = rows[0].categorySlug;

    const filtered = await archivePage({ categorySlug: category }, 0, 100);
    assert.ok(filtered.rows.length >= 1);
    for (const article of filtered.rows) {
      assert.equal(article.categorySlug, category, "a filter must survive the page");
    }
  });

  it("asks for nothing beyond the end", async () => {
    const total = await publishedArticleCount();
    const beyond = await archivePage({}, total + 50, 5);
    assert.deepEqual(beyond.rows, []);
    assert.equal(beyond.hasMore, false);
  });
});
