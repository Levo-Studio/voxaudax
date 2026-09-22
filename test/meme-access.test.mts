import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import { eq } from "drizzle-orm";

import type { Member } from "@/lib/authorize";
import { db } from "@/lib/db/client";
import { images, memes, users } from "@/lib/db/schema";
import { editMeme, rejectMeme } from "@/lib/editorial/memes";
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

/**
 * A rejected meme leaves the queue and comes off the wall in one write, and the
 * second half is the one nothing read: `visible = false` is there so that the
 * decision survives somebody setting the status back to published by hand,
 * which the "Sichtbar" switch in the back office can do at any time.
 */
describe("a rejected meme leaves the queue and stays off the wall", () => {
  let reviewer: Member;
  let memeId: string;
  let imageId: string;

  const REASON = "Ohne Zustimmung der Abgebildeten.";

  before(async () => {
    const [row] = await db.select().from(users).where(eq(users.email, "mira.oezkan@voxaudax.de"));
    assert.ok(row, "the seed has no member mira.oezkan@voxaudax.de");
    assert.equal(row.role, "redakteur");

    reviewer = {
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

    const [author] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, "emil.radtke@voxaudax.de"));

    const [image] = await db
      .insert(images)
      .values({
        key: `test/${crypto.randomUUID()}.png`,
        mime: "image/png",
        width: 1,
        height: 1,
        alt: "Ein eingereichtes Meme",
        uploadedBy: author!.id,
      })
      .returning({ id: images.id });
    imageId = image!.id;

    const [meme] = await db
      .insert(memes)
      .values({
        imageId,
        caption: null,
        visible: true,
        status: "review",
        createdBy: author!.id,
      })
      .returning({ id: memes.id });
    memeId = meme!.id;
  });

  after(async () => {
    await db.delete(memes).where(eq(memes.id, memeId));
    await db.delete(images).where(eq(images.id, imageId));
  });

  const standing = async () => {
    const [row] = await db
      .select({
        status: memes.status,
        visible: memes.visible,
        rejectionReason: memes.rejectionReason,
      })
      .from(memes)
      .where(eq(memes.id, memeId));
    return row!;
  };

  it("writes the decision, the reason and the invisibility in one go", async () => {
    assert.equal(await rejectMeme(reviewer, memeId, REASON), "rejected");

    const row = await standing();
    assert.equal(row.status, "abgelehnt");
    assert.equal(row.visible, false);
    assert.equal(row.rejectionReason, REASON);
  });

  it("keeps it off the wall even where the status is set back by hand", async () => {
    await db.update(memes).set({ status: "published" }).where(eq(memes.id, memeId));

    // The gallery asks for both, which is read in test/public-reads.test.mts;
    // this is the half the rejection is responsible for.
    assert.equal((await standing()).visible, false);
  });

  it("is not decided about twice", async () => {
    await db.update(memes).set({ status: "abgelehnt" }).where(eq(memes.id, memeId));

    assert.equal(await rejectMeme(reviewer, memeId, REASON), "unknown");
  });
});

after(async () => {
  await pool().end();
});
