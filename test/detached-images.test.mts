import assert from "node:assert/strict";
import { after, describe, it } from "node:test";

import { eq, inArray, sql } from "drizzle-orm";

import type { TipTapDocument } from "@/lib/content";
import { db } from "@/lib/db/client";
import { images, users } from "@/lib/db/schema";
import {
  imageIdsIn,
  reconcileArticleImages,
  sweepDetachedImages,
} from "@/lib/editorial/detached-images";
import { pool } from "@/lib/db/pool";

/**
 * A picture taken out of an article has to go — and must survive the second in
 * which it is only out because the writer pressed the wrong key. Both halves
 * are here.
 */

const document = (...sources: readonly string[]): TipTapDocument => ({
  type: "doc",
  content: [
    { type: "paragraph", content: [{ type: "text", text: "Davor." }] },
    ...sources.map((src) => ({ type: "image" as const, attrs: { src, alt: "" } })),
  ],
});

const written: string[] = [];

const plantImage = async () => {
  const [uploader] = await db.select({ id: users.id }).from(users).limit(1);
  assert.ok(uploader, "the seed has no member to have uploaded anything");

  const [row] = await db
    .insert(images)
    .values({
      // Never stored, so nothing in the bucket answers for it. The sweep logs
      // that and removes the row anyway, which is the half under test.
      key: `artikel/detached-probe-${written.length}-${process.pid}.png`,
      mime: "image/png",
      width: 10,
      height: 10,
      alt: "Probe",
      uploadedBy: uploader.id,
    })
    .returning({ id: images.id });

  written.push(row!.id);
  return row!.id;
};

const detachedAt = async (id: string) => {
  const [row] = await db
    .select({ detachedAt: images.detachedAt })
    .from(images)
    .where(eq(images.id, id));
  return row === undefined ? "gone" : row.detachedAt;
};

after(async () => {
  if (written.length > 0) await db.delete(images).where(inArray(images.id, written));
  await pool().end();
});

describe("a picture that leaves the text", () => {
  it("reads every address the editor writes, and nothing that only looks like one", () => {
    const id = "0f1e2d3c-4b5a-6978-8796-a5b4c3d2e1f0";
    const found = imageIdsIn(
      document(`/bild/${id}`, "https://anderswo.example/bild.png", "/bild/nicht-eine-uuid"),
    );

    assert.deepEqual([...found], [id]);
  });

  it("finds a picture nested inside a block, not only at the top level", () => {
    const id = "11111111-2222-3333-4444-555555555555";
    const nested: TipTapDocument = {
      type: "doc",
      content: [
        {
          type: "blockquote",
          content: [{ type: "image", attrs: { src: `/bild/${id}`, alt: "" } }],
        },
      ],
    };

    assert.deepEqual([...imageIdsIn(nested)], [id]);
  });

  it("is marked when it goes and unmarked when it comes back", async () => {
    const id = await plantImage();
    const withIt = document(`/bild/${id}`);

    await reconcileArticleImages(withIt, document());
    assert.notEqual(await detachedAt(id), null, "it should be marked once it is gone");

    await reconcileArticleImages(document(), withIt);
    assert.equal(await detachedAt(id), null, "putting it back should clear the mark");
  });

  it("survives the sweep while it is still within the day", async () => {
    const id = await plantImage();
    await reconcileArticleImages(document(`/bild/${id}`), document());

    await sweepDetachedImages();

    assert.notEqual(await detachedAt(id), "gone", "a fresh mark is not a licence to delete");
  });

  it("is removed once the mark is older than the day", async () => {
    const id = await plantImage();
    await reconcileArticleImages(document(`/bild/${id}`), document());

    await db
      .update(images)
      .set({ detachedAt: sql`now() - interval '2 days'` })
      .where(eq(images.id, id));

    await sweepDetachedImages();

    assert.equal(await detachedAt(id), "gone", "an old mark should take the row with it");
  });
});
