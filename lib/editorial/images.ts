import "server-only";
import { eq, sql } from "drizzle-orm";

import type { Member } from "@/lib/authorize";
import { db } from "@/lib/db/client";
import { articles, images, memes, sponsors } from "@/lib/db/schema";
import { mayReachArticle } from "@/lib/editorial/articles";

/**
 * The bucket is private and the storage host never reaches a browser, so the
 * bytes are served from this origin — which makes the route, and not the
 * bucket, the access rule.
 *
 * The rule cannot be "is anybody signed in". An image is part of something: a
 * meme, an article's cover, a sponsor's logo. What may see the image is what
 * may see the thing it belongs to, so the owner is resolved first and the
 * answer follows from it.
 */
export type ImageAccess = {
  readonly key: string;
  readonly mime: string;
  /** Published meme, published article, published sponsor: the public site shows these. */
  readonly publiclyVisible: boolean;
  /** Set when the image is an article's cover, and null for anything else. */
  readonly articleId: string | null;
};

export const imageAccess = async (imageId: string): Promise<ImageAccess | null> => {
  const [row] = await db
    .select({
      key: images.key,
      mime: images.mime,
      memeStatus: memes.status,
      memeVisible: memes.visible,
      articleId: articles.id,
      articleStatus: articles.status,
      sponsorStatus: sponsors.status,
    })
    .from(images)
    .leftJoin(memes, eq(memes.imageId, images.id))
    .leftJoin(articles, sql`${articles.cover}->>'imageId' = ${images.id}::text`)
    .leftJoin(sponsors, eq(sponsors.logoImageId, images.id))
    .where(eq(images.id, imageId));

  if (row === undefined) return null;

  return {
    key: row.key,
    mime: row.mime,
    publiclyVisible:
      (row.memeStatus === "published" && row.memeVisible === true) ||
      row.articleStatus === "published" ||
      row.sponsorStatus === "published",
    articleId: row.articleId,
  };
};

/**
 * A member is only asked for where the image is not public, which is why the
 * caller may hand over `null` for one: a published cover is served to a reader
 * who has no session at all.
 */
export const mayReadImage = async (access: ImageAccess, member: Member | null) => {
  if (access.publiclyVisible) return true;
  if (member === null) return false;
  if (access.articleId === null) return true;

  return mayReachArticle(member, access.articleId);
};
