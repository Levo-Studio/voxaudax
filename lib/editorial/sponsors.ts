import "server-only";
import { asc, eq, sql } from "drizzle-orm";

import type { Member } from "@/lib/authorize";
import { db } from "@/lib/db/client";
import { images, sponsors } from "@/lib/db/schema";
import {
  endOfRuntime,
  type RuntimeMonths,
  type SponsorKind,
} from "@/lib/editorial/vocabulary";

export * from "@/lib/editorial/vocabulary";

const rows = () =>
  db
    .select({
      id: sponsors.id,
      name: sponsors.name,
      initials: sponsors.initials,
      url: sponsors.url,
      kind: sponsors.kind,
      startsAt: sponsors.startsAt,
      endsAt: sponsors.endsAt,
      active: sponsors.active,
      status: sponsors.status,
      rejectionReason: sponsors.rejectionReason,
      createdBy: sponsors.createdBy,
      logoImageId: sponsors.logoImageId,
      logoAlt: images.alt,
    })
    .from(sponsors)
    .leftJoin(images, eq(images.id, sponsors.logoImageId));

export type SponsorRow = Awaited<ReturnType<typeof rows>>[number];

export const listSponsors = () => rows().orderBy(asc(sponsors.endsAt));

export const listSubmittedSponsors = () =>
  rows().where(eq(sponsors.status, "review")).orderBy(asc(sponsors.createdAt));

/**
 * Screen 6b: an expired or switched-off entry is not a faded row on the
 * homepage, it is a section that is not rendered. So "visible" is a question
 * about the clock as much as about the switch, and both are asked here.
 */
export const isRunning = (sponsor: {
  readonly active: boolean;
  readonly status: string;
  readonly startsAt: Date;
  readonly endsAt: Date;
}) =>
  sponsor.active &&
  sponsor.status === "published" &&
  sponsor.startsAt <= new Date() &&
  sponsor.endsAt > new Date();

export const countRunningSponsors = async () => {
  const [row] = await db
    .select({
      running:
        sql<number>`count(*) filter (where ${sponsors.active} and ${sponsors.status} = 'published' and ${sponsors.startsAt} <= now() and ${sponsors.endsAt} > now())`.mapWith(
          Number,
        ),
      total: sql<number>`count(*)`.mapWith(Number),
    })
    .from(sponsors);

  return row ?? { running: 0, total: 0 };
};

export type SponsorInput = {
  readonly name: string;
  readonly initials: string;
  readonly url: string | null;
  readonly kind: SponsorKind;
  readonly startsAt: Date;
  readonly months: RuntimeMonths;
};

export const createSponsor = (member: Member, input: SponsorInput) =>
  db
    .insert(sponsors)
    .values({
      name: input.name,
      initials: input.initials,
      url: input.url,
      kind: input.kind,
      startsAt: input.startsAt,
      endsAt: endOfRuntime(input.startsAt, input.months),
      createdBy: member.id,
    })
    .returning({ id: sponsors.id });

/**
 * A freigabe is about what the homepage shows, so changing a published entry
 * changes what was approved. It goes back into the review queue rather than
 * reaching the public site unread — written as one statement so that two
 * editors saving at once cannot leave it published.
 *
 * An entry that is still waiting stays where it is, and nothing here publishes
 * anything: only `approveSponsor` does that.
 */
const backIntoReview = sql`case when ${sponsors.status} = 'published' then 'review' else ${sponsors.status} end`;

export const updateSponsor = (sponsorId: string, input: SponsorInput) =>
  db
    .update(sponsors)
    .set({
      name: input.name,
      initials: input.initials,
      url: input.url,
      kind: input.kind,
      startsAt: input.startsAt,
      endsAt: endOfRuntime(input.startsAt, input.months),
      status: backIntoReview,
    })
    .where(eq(sponsors.id, sponsorId));

export const setSponsorActive = (sponsorId: string, active: boolean) =>
  db.update(sponsors).set({ active }).where(eq(sponsors.id, sponsorId));

export const setSponsorLogo = (input: {
  readonly member: Member;
  readonly sponsorId: string;
  readonly imageKey: string;
  readonly mime: string;
  readonly width: number;
  readonly height: number;
  readonly alt: string;
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

    await tx
      .update(sponsors)
      .set({ logoImageId: image!.id, status: backIntoReview })
      .where(eq(sponsors.id, input.sponsorId));
  });

export const approveSponsor = async (approver: Member, sponsorId: string) => {
  const [row] = await db
    .select({ createdBy: sponsors.createdBy, status: sponsors.status, logoAlt: images.alt, logoImageId: sponsors.logoImageId })
    .from(sponsors)
    .leftJoin(images, eq(images.id, sponsors.logoImageId))
    .where(eq(sponsors.id, sponsorId));

  if (row === undefined || row.status !== "review") return "unknown" as const;
  if (row.createdBy === approver.id) return "own_submission" as const;
  if (row.logoImageId !== null && (row.logoAlt === null || row.logoAlt.trim().length === 0)) {
    return "alt_text_missing" as const;
  }

  await db.update(sponsors).set({ status: "published" }).where(eq(sponsors.id, sponsorId));
  return "approved" as const;
};

export const rejectSponsor = async (
  approver: Member,
  sponsorId: string,
  reason: string,
) => {
  const [row] = await db
    .select({ createdBy: sponsors.createdBy, status: sponsors.status })
    .from(sponsors)
    .where(eq(sponsors.id, sponsorId));

  if (row === undefined || row.status !== "review") return "unknown" as const;
  if (row.createdBy === approver.id) return "own_submission" as const;

  await db
    .update(sponsors)
    .set({ status: "abgelehnt", active: false, rejectionReason: reason })
    .where(eq(sponsors.id, sponsorId));

  return "rejected" as const;
};
