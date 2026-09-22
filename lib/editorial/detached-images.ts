import "server-only";
import { and, eq, inArray, isNotNull, lt, sql } from "drizzle-orm";

import type { TipTapDocument, TipTapNode } from "@/lib/content";
import { db } from "@/lib/db/client";
import { articles, images } from "@/lib/db/schema";
import { removeObject } from "@/lib/storage";

/**
 * A picture taken out of an article is taken out for good — but not in the same
 * second, because the editor writes a second after the last keystroke. Between
 * deleting a block and undoing it lie two saves, and a picture deleted on the
 * first would be gone before the second put its address back.
 *
 * So removal happens in two steps. Saving marks what no longer stands in the
 * body; saving again with it back clears the mark. What stays marked for a day
 * is swept: the row goes, and the object in the bucket goes with it.
 *
 * Nothing of this is visible to a reader in the meantime. `imageAccess` finds
 * no article for an unreferenced picture, so from the moment of the first save
 * it is served to nobody but the person who uploaded it.
 */
const GRACE = "1 day";

/** How the editor writes an image, and the only shape `imageAccess` matches. */
const ADDRESS = /^\/bild\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

const collect = (nodes: readonly TipTapNode[], into: Set<string>) => {
  for (const node of nodes) {
    if (node.type === "image") {
      const src = node.attrs?.src;
      const found = typeof src === "string" ? ADDRESS.exec(src) : null;
      if (found !== null) into.add(found[1]!.toLowerCase());
      continue;
    }
    if (node.content !== undefined) collect(node.content, into);
  }
};

/** Every picture this document points at, by id. */
export const imageIdsIn = (document: TipTapDocument): ReadonlySet<string> => {
  const found = new Set<string>();
  collect(document.content, found);
  return found;
};

/**
 * Called with the body as it was and as it now is. Marks what left, unmarks
 * what came back, and sweeps whatever has been gone long enough.
 *
 * Never throws: a picture that could not be removed from the bucket must not
 * cost the writer the paragraph they just typed. It is logged and tried again
 * on the next save, because the mark stays until the row goes.
 */
export const reconcileArticleImages = async (
  before: TipTapDocument,
  after: TipTapDocument,
) => {
  try {
    const was = imageIdsIn(before);
    const now = imageIdsIn(after);

    const gone = [...was].filter((id) => !now.has(id));

    // Everything the body shows, not only what it showed before: a picture
    // pasted in from somewhere else carries a mark from the article it left,
    // and standing in this one is what clears it.
    const back = [...now];

    if (gone.length > 0) {
      await db
        .update(images)
        .set({ detachedAt: sql`now()` })
        .where(and(inArray(images.id, gone), sql`${images.detachedAt} is null`));
    }

    if (back.length > 0) {
      await db
        .update(images)
        .set({ detachedAt: null })
        .where(and(inArray(images.id, back), isNotNull(images.detachedAt)));
    }

    await sweepDetachedImages();
  } catch (cause) {
    console.error("error", "detached images could not be reconciled", { cause });
  }
};

/**
 * Removes what has been unreferenced for longer than the grace period.
 *
 * The body is asked once more before anything is deleted, with the same
 * containment `imageAccess` uses: between the mark and the sweep lies a day, in
 * which the picture may have been pasted into a different article. A mark is a
 * suspicion, the query is the answer.
 */
export const sweepDetachedImages = async () => {
  const stale = await db
    .select({ id: images.id, key: images.key })
    .from(images)
    .where(
      and(
        isNotNull(images.detachedAt),
        lt(images.detachedAt, sql`now() - interval ${sql.raw(`'${GRACE}'`)}`),
      ),
    )
    .limit(50);

  for (const image of stale) {
    const [holder] = await db
      .select({ id: articles.id })
      .from(articles)
      .where(
        sql`${articles.body} @> jsonb_build_object(
          'content',
          jsonb_build_array(
            jsonb_build_object(
              'type', 'image',
              'attrs', jsonb_build_object('src', '/bild/' || ${image.id}::text)
            )
          )
        )`,
      )
      .limit(1);

    if (holder !== undefined) {
      await db.update(images).set({ detachedAt: null }).where(eq(images.id, image.id));
      continue;
    }

    // The row first: an object left in the bucket is waste, but a row pointing
    // at an object that is gone is a picture the page tries and fails to draw.
    await db.delete(images).where(eq(images.id, image.id));

    try {
      await removeObject(image.key);
    } catch (cause) {
      console.error("error", "an image object outlived its row", { key: image.key, cause });
    }
  }

  return stale.length;
};
