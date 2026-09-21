import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import { eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { images, memes, users } from "@/lib/db/schema";
import { editMeme } from "@/lib/editorial/memes";
import { pool } from "@/lib/db/pool";

/**
 * `editMemeAction` took the image out of the posted form and wrote `images.alt`
 * for whatever id arrived. Any row in `images` was reachable that way — the
 * cover of somebody else's unpublished draft included, which is the field the
 * approval of that draft is blocked on.
 *
 * `editMeme` no longer has a parameter to abuse. This reads that back the only
 * way that stays true after a refactor: by writing through it and looking at
 * the row it was never supposed to reach.
 */
describe("editing a meme reaches that meme's image and no other", () => {
  let memeId: string;
  let memeImageId: string;
  let strangerImageId: string;

  before(async () => {
    const [uploader] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, "mira.oezkan@voxaudax.de"));

    const insertImage = async (alt: string) => {
      const [image] = await db
        .insert(images)
        .values({
          key: `test/${crypto.randomUUID()}.png`,
          mime: "image/png",
          width: 1,
          height: 1,
          alt,
          uploadedBy: uploader!.id,
        })
        .returning({ id: images.id });
      return image!.id;
    };

    memeImageId = await insertImage("Das Bild des Memes");
    strangerImageId = await insertImage("Der Aufmacher eines fremden Entwurfs");

    const [meme] = await db
      .insert(memes)
      .values({
        imageId: memeImageId,
        caption: "Ursprüngliche Bildunterschrift",
        visible: true,
        status: "published",
        createdBy: uploader!.id,
      })
      .returning({ id: memes.id });

    memeId = meme!.id;
  });

  after(async () => {
    await db.delete(memes).where(eq(memes.id, memeId));
    await db.delete(images).where(eq(images.id, memeImageId));
    await db.delete(images).where(eq(images.id, strangerImageId));
  });

  const altOf = async (imageId: string) => {
    const [row] = await db.select({ alt: images.alt }).from(images).where(eq(images.id, imageId));
    return row?.alt ?? null;
  };

  it("writes the alt text of the image the meme names", async () => {
    await editMeme({
      memeId,
      alt: "Neuer Alt-Text",
      caption: "Neue Bildunterschrift",
      visible: false,
    });

    assert.equal(await altOf(memeImageId), "Neuer Alt-Text");
  });

  it("leaves every other image alone", async () => {
    assert.equal(await altOf(strangerImageId), "Der Aufmacher eines fremden Entwurfs");
  });

  it("writes nothing at all for a meme that does not exist", async () => {
    await editMeme({
      memeId: crypto.randomUUID(),
      alt: "Sollte nirgends landen",
      caption: null,
      visible: true,
    });

    assert.equal(await altOf(memeImageId), "Neuer Alt-Text");
    assert.equal(await altOf(strangerImageId), "Der Aufmacher eines fremden Entwurfs");
  });
});

after(async () => {
  await pool().end();
});
