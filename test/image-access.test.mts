import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import { eq } from "drizzle-orm";

import type { Member } from "@/lib/authorize";
import { db } from "@/lib/db/client";
import { articles, images, memes, users } from "@/lib/db/schema";
import { imageAccess, mayReadImage } from "@/lib/editorial/images";
import { pool } from "@/lib/db/pool";

/**
 * `/api/bilder/[id]` serves bytes out of a private bucket, so this route is the
 * access rule. It used to ask only whether a member existed, which let any
 * autor fetch the cover of anybody's unpublished draft — and, in the other
 * direction, marked a published article's cover `private, no-store`, so the
 * public site could not show it.
 *
 * These are the two halves of that, read back as the route reads them.
 */
const memberFor = async (email: string): Promise<Member> => {
  const [row] = await db.select().from(users).where(eq(users.email, email));
  assert.ok(row, `the seed has no member ${email}`);

  return {
    id: row.id,
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

describe("an image is as reachable as the thing it belongs to", () => {
  let owner: Member;
  let stranger: Member;
  let editor: Member;

  let draftCoverId: string;
  let publishedCoverId: string;
  let memeImageId: string;
  let hiddenMemeImageId: string;

  let draftId: string;
  let publishedId: string;
  let memeId: string;
  let hiddenMemeId: string;

  const insertImage = async (alt: string, uploadedBy: string) => {
    const [image] = await db
      .insert(images)
      .values({
        key: `test/${crypto.randomUUID()}.png`,
        mime: "image/png",
        width: 1,
        height: 1,
        alt,
        uploadedBy,
      })
      .returning({ id: images.id });
    return image!.id;
  };

  before(async () => {
    owner = await memberFor("emil.radtke@voxaudax.de");
    stranger = await memberFor("paul.ostermann@voxaudax.de");
    editor = await memberFor("mira.oezkan@voxaudax.de");

    assert.equal(owner.role, "autor");
    assert.equal(stranger.role, "autor");
    assert.equal(editor.role, "redakteur");

    const [category] = await db
      .execute<{ id: string }>("select id from categories order by position limit 1")
      .then((result) => result.rows);

    draftCoverId = await insertImage("Aufmacher eines Entwurfs", owner.id);
    publishedCoverId = await insertImage("Aufmacher eines Artikels", owner.id);
    memeImageId = await insertImage("Ein freigegebenes Meme", editor.id);
    hiddenMemeImageId = await insertImage("Ein eingereichtes Meme", editor.id);

    const article = async (status: "draft" | "published", imageId: string) => {
      const [created] = await db
        .insert(articles)
        .values({
          slug: `test-bildzugriff-${crypto.randomUUID()}`,
          title: "Bildzugriff",
          teaser: "",
          // The picture stands in the body now: a cover is generated and holds
          // no image, so that is the only place an article can name one.
          body: {
            type: "doc",
            content: [{ type: "image", attrs: { src: `/bild/${imageId}`, alt: "" } }],
          },
          cover: { word: "BILD", line: "", colorId: "violett" },
          categoryId: category!.id,
          authorId: owner.id,
          status,
          ...(status === "published" ? { publishedAt: new Date() } : {}),
        })
        .returning({ id: articles.id });
      return created!.id;
    };

    draftId = await article("draft", draftCoverId);
    publishedId = await article("published", publishedCoverId);

    const meme = async (status: "review" | "published", imageId: string) => {
      const [created] = await db
        .insert(memes)
        .values({ imageId, caption: null, visible: true, status, createdBy: editor.id })
        .returning({ id: memes.id });
      return created!.id;
    };

    memeId = await meme("published", memeImageId);
    hiddenMemeId = await meme("review", hiddenMemeImageId);
  });

  after(async () => {
    await db.delete(memes).where(eq(memes.id, memeId));
    await db.delete(memes).where(eq(memes.id, hiddenMemeId));
    await db.delete(articles).where(eq(articles.id, draftId));
    await db.delete(articles).where(eq(articles.id, publishedId));
    for (const id of [draftCoverId, publishedCoverId, memeImageId, hiddenMemeImageId]) {
      await db.delete(images).where(eq(images.id, id));
    }
  });

  const reachable = async (imageId: string, member: Member | null) => {
    const access = await imageAccess(imageId);
    assert.ok(access, "the image exists");
    return mayReadImage(access, member);
  };

  it("serves a published article's cover to a reader with no session", async () => {
    const access = await imageAccess(publishedCoverId);
    assert.equal(access?.publiclyVisible, true);
    assert.equal(await reachable(publishedCoverId, null), true);
  });

  it("serves a published meme to a reader with no session", async () => {
    assert.equal((await imageAccess(memeImageId))?.publiclyVisible, true);
    assert.equal(await reachable(memeImageId, null), true);
  });

  it("keeps an unpublished draft's cover from a reader with no session", async () => {
    assert.equal((await imageAccess(draftCoverId))?.publiclyVisible, false);
    assert.equal(await reachable(draftCoverId, null), false);
  });

  it("keeps an unpublished draft's cover from another author", async () => {
    assert.equal(await reachable(draftCoverId, stranger), false);
  });

  it("shows it to the author whose draft it is", async () => {
    assert.equal(await reachable(draftCoverId, owner), true);
  });

  it("shows it to a redakteur, who may read other people's drafts", async () => {
    assert.equal(await reachable(draftCoverId, editor), true);
  });

  it("keeps a meme that still waits for a freigabe off the public site", async () => {
    assert.equal((await imageAccess(hiddenMemeImageId))?.publiclyVisible, false);
    assert.equal(await reachable(hiddenMemeImageId, null), false);
  });

  it("answers nothing at all for an image that does not exist", async () => {
    assert.equal(await imageAccess(crypto.randomUUID()), null);
  });
});

after(async () => {
  await pool().end();
});
