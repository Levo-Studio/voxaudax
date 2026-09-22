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
 * meme, a picture inside an article, a sponsor's logo. What may see the image
 * is what may see the thing it belongs to, so the owner is resolved first and
 * the answer follows from it.
 */
export type ImageAccess = {
  readonly key: string;
  readonly mime: string;
  /** Published meme, published article, published sponsor: the public site shows these. */
  readonly publiclyVisible: boolean;
  /** Set when the image stands in an article, and null for anything else. */
  readonly articleId: string | null;
  /** A meme or a sponsor's logo — the two things the back office decides about as a whole. */
  readonly belongsToMemeOrSponsor: boolean;
  /** Null once the account is gone, which is nobody and matches no member. */
  readonly uploadedBy: string | null;
};

export const imageAccess = async (imageId: string): Promise<ImageAccess | null> => {
  const [row] = await db
    .select({
      key: images.key,
      mime: images.mime,
      uploadedBy: images.uploadedBy,
      memeId: memes.id,
      memeStatus: memes.status,
      memeVisible: memes.visible,
      articleId: articles.id,
      // Published is not the same as due, and this is the same question
      // `live()` in lib/queries asks of the article itself: a scheduled article
      // carries the status days before its hour, and asking only for the status
      // put the photograph belonging to an embargoed piece on the open web —
      // with a year of cache — while the text was still nobody's to read.
      articleLive: sql<boolean>`${articles.status} = 'published' and ${articles.publishedAt} <= now()`,
      sponsorId: sponsors.id,
      sponsorStatus: sponsors.status,
    })
    .from(images)
    .leftJoin(memes, eq(memes.imageId, images.id))
    // Covers are generated and hold no picture any more, so the body is the
    // only place an article names one. The image node is asked for by name
    // rather than searched for as text: an id that happened to appear inside a
    // paragraph would otherwise make that article the picture's owner.
    //
    // Written as containment and not as an `exists` over `jsonb_array_elements`:
    // this question is asked on every delivered image byte, and the expanded
    // form reads and unpacks the body of every article on every request. `@>`
    // is what `articles_body_idx` can answer, and it asks the same thing — a
    // top-level node of the document carrying this type and this address.
    .leftJoin(
      articles,
      sql`${articles.body} @> jsonb_build_object(
        'content',
        jsonb_build_array(
          jsonb_build_object(
            'type', 'image',
            'attrs', jsonb_build_object('src', '/bild/' || ${images.id}::text)
          )
        )
      )`,
    )
    .leftJoin(sponsors, eq(sponsors.logoImageId, images.id))
    .where(eq(images.id, imageId));

  if (row === undefined) return null;

  return {
    key: row.key,
    mime: row.mime,
    publiclyVisible:
      (row.memeStatus === "published" && row.memeVisible === true) ||
      row.articleLive === true ||
      row.sponsorStatus === "published",
    articleId: row.articleId,
    belongsToMemeOrSponsor: row.memeId !== null || row.sponsorId !== null,
    uploadedBy: row.uploadedBy,
  };
};

/**
 * A member is only asked for where the image is not public, which is why the
 * caller may hand over `null` for one: a picture in a published article is
 * served to a reader who has no session at all.
 */
export const mayReadImage = async (access: ImageAccess, member: Member | null) => {
  if (access.publiclyVisible) return true;
  if (member === null) return false;
  if (access.articleId !== null) return mayReachArticle(member, access.articleId);

  // A meme before its freigabe and a sponsor's logo before its own: both sit in
  // a back-office list every member has in front of them, so the picture is as
  // reachable as the list is.
  if (access.belongsToMemeOrSponsor) return true;

  /**
   * Nothing points at the picture: it was dropped into a body that has not been
   * saved since, or it was taken back out of one. Until it is part of
   * something, the only person it is part of is whoever uploaded it.
   *
   * This used to answer "a session is enough", which made every lookup above a
   * quiet release the moment it stopped finding anything — which is what
   * happened when the editor and the parser disagreed about the address and no
   * body held an image node at all.
   */
  return access.uploadedBy !== null && access.uploadedBy === member.id;
};

/**
 * An SVG is a document and not a picture. Opened as an address of its own it
 * runs whatever script stands inside it, under this origin and in the session
 * of whoever opened it — and a logo is uploaded by anybody who may manage
 * sponsors, which is not only an admin. Every page here shows a logo through
 * `<img>`, and an `<img>` runs nothing; so the file is handed over as a
 * download rather than rendered, and sandboxed on top in case it is rendered
 * anyway. Both routes answer with these, so neither can answer differently.
 */
const ACTIVE_TYPES: readonly string[] = ["image/svg+xml"];

export const imageHeaders = (access: ImageAccess): Record<string, string> => {
  const active = ACTIVE_TYPES.includes(access.mime);

  return {
    "content-type": access.mime,
    // The id names one immutable object: a changed picture is a new row. Only
    // where the picture is public, though — a year in a shared cache is not
    // something a hidden meme can be taken back out of.
    "cache-control": access.publiclyVisible
      ? "public, max-age=31536000, immutable"
      : "private, no-store",
    "content-disposition": active ? "attachment" : "inline",
    "x-content-type-options": "nosniff",
    ...(active ? { "content-security-policy": "sandbox" } : {}),
  };
};
