import "server-only";
import { and, asc, desc, eq, sql } from "drizzle-orm";

import type { Member } from "@/lib/authorize";
import { may } from "@/lib/roles";
import { somebodyElseCouldApprove } from "@/lib/editorial/second-pair";
import { db } from "@/lib/db/client";
import { images, memes, users } from "@/lib/db/schema";

const withImage = () =>
  db
    .select({
      id: memes.id,
      caption: memes.caption,
      visible: memes.visible,
      status: memes.status,
      rejectionReason: memes.rejectionReason,
      createdAt: memes.createdAt,
      createdBy: memes.createdBy,
      authorName: users.name,
      imageId: images.id,
      alt: images.alt,
      width: images.width,
      height: images.height,
    })
    .from(memes)
    .innerJoin(images, eq(images.id, memes.imageId))
    .innerJoin(users, eq(users.id, memes.createdBy));

export type MemeRow = Awaited<ReturnType<typeof withImage>>[number];

export type MemeFilter = "alle" | "online" | "ausgeblendet";

export const MEME_FILTERS: Record<MemeFilter, string> = {
  alle: "Alle",
  online: "Online",
  ausgeblendet: "Ausgeblendet",
};

export const isMemeFilter = (value: unknown): value is MemeFilter =>
  typeof value === "string" && value in MEME_FILTERS;

export const listMemes = (filter: MemeFilter) =>
  withImage()
    .where(
      filter === "online"
        ? and(eq(memes.visible, true), eq(memes.status, "published"))
        : filter === "ausgeblendet"
          ? sql`${memes.visible} = false or ${memes.status} = 'review'`
          : undefined,
    )
    .orderBy(desc(memes.createdAt))
    .limit(120);

export const countMemes = async () => {
  const [row] = await db
    .select({
      online: sql<number>`count(*) filter (where ${memes.visible} and ${memes.status} = 'published')`.mapWith(Number),
      hidden: sql<number>`count(*) filter (where not ${memes.visible} or ${memes.status} = 'review')`.mapWith(Number),
      review: sql<number>`count(*) filter (where ${memes.status} = 'review')`.mapWith(Number),
    })
    .from(memes);

  return row ?? { online: 0, hidden: 0, review: 0 };
};

export const listSubmittedMemes = () =>
  withImage().where(eq(memes.status, "review")).orderBy(asc(memes.createdAt));

/**
 * Screen 10b: the alt text is the one mandatory field, so it is required here
 * rather than checked at approval time — a meme with no alt text never reaches
 * the review grid as approvable in the first place.
 */
/**
 * A meme uploaded by somebody who may approve memes is published as it is
 * uploaded. The alt text is required by the form either way, which is the one
 * thing an approval would have checked.
 */
export const createMeme = async (input: {
  readonly member: Member;
  readonly imageKey: string;
  readonly mime: string;
  readonly width: number;
  readonly height: number;
  readonly alt: string;
  readonly caption: string | null;
  readonly visible: boolean;
}) =>
  db.transaction(async (tx) => {
    const [image] = await tx
      .insert(images)
      .values({
        key: input.imageKey,
        mime: input.mime,
        width: input.width,
        height: input.height,
        alt: input.alt,
        uploadedBy: input.member.id,
      })
      .returning({ id: images.id });

    const [created] = await tx
      .insert(memes)
      .values({
        imageId: image!.id,
        caption: input.caption,
        visible: input.visible,
        createdBy: input.member.id,
        ...(may(input.member.role, "approveArticlesAndMemes")
          ? { status: "published" as const }
          : {}),
      })
      .returning({ id: memes.id });

    return created!.id;
  });

export const setMemeVisibility = (memeId: string, visible: boolean) =>
  db.update(memes).set({ visible }).where(eq(memes.id, memeId));

/**
 * The image is not a parameter. It was, and a posted `imageId` meant the alt
 * text of any row in `images` could be rewritten through this form — including
 * the cover of somebody else's unpublished draft, which is the field approval
 * is blocked on. What may be edited follows from the meme, so it is read from
 * the meme, inside the transaction that writes it.
 */
export const editMeme = (input: {
  readonly memeId: string;
  readonly caption: string | null;
  readonly alt: string;
  readonly visible: boolean;
}) =>
  db.transaction(async (tx) => {
    const [meme] = await tx
      .select({ imageId: memes.imageId })
      .from(memes)
      .where(eq(memes.id, input.memeId));

    if (meme === undefined) return;

    await tx.update(images).set({ alt: input.alt }).where(eq(images.id, meme.imageId));
    await tx
      .update(memes)
      .set({ caption: input.caption, visible: input.visible })
      .where(eq(memes.id, input.memeId));
  });

/** The same two rules as an article: not your own, and not without an alt text. */
export const approveMeme = async (approver: Member, memeId: string) => {
  const [row] = await db
    .select({ createdBy: memes.createdBy, status: memes.status, alt: images.alt })
    .from(memes)
    .innerJoin(images, eq(images.id, memes.imageId))
    .where(eq(memes.id, memeId));

  if (row === undefined || row.status !== "review") return "unknown" as const;
  if (
    row.createdBy === approver.id &&
    (await somebodyElseCouldApprove(approver, "approveArticlesAndMemes"))
  ) {
    return "own_submission" as const;
  }
  if (row.alt === null || row.alt.trim().length === 0) return "alt_text_missing" as const;

  await db.update(memes).set({ status: "published" }).where(eq(memes.id, memeId));
  return "approved" as const;
};

export const rejectMeme = async (approver: Member, memeId: string, reason: string) => {
  const [row] = await db
    .select({ createdBy: memes.createdBy, status: memes.status })
    .from(memes)
    .where(eq(memes.id, memeId));

  if (row === undefined || row.status !== "review") return "unknown" as const;
  if (
    row.createdBy === approver.id &&
    (await somebodyElseCouldApprove(approver, "approveArticlesAndMemes"))
  ) {
    return "own_submission" as const;
  }

  // Both, and for different reasons: the status takes it out of the queue so
  // the decision sticks, and `visible` keeps it off the wall even if somebody
  // later publishes it by hand. The reason goes with them, because a refusal
  // nobody can read is a refusal nobody can answer.
  await db
    .update(memes)
    .set({ status: "abgelehnt", visible: false, rejectionReason: reason })
    .where(eq(memes.id, memeId));

  return "rejected" as const;
};
