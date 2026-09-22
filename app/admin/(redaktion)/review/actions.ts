"use server";

import { revalidatePath } from "next/cache";

import { requireCapability } from "@/lib/authorize";
import { refreshPublic } from "@/lib/refresh";
import { approveArticle, returnToDraft } from "@/lib/editorial/articles";
import { approveMeme, rejectMeme } from "@/lib/editorial/memes";
import { approveSponsor, rejectSponsor } from "@/lib/editorial/sponsors";

/**
 * Every decision goes through `requireCapability("approveArticlesAndMemes")` or
 * its sponsor counterpart, and each repository refuses a submission the caller
 * made themselves and one whose alt text is missing. The buttons on screen 11a
 * are a report of those two answers, not the place they are decided: a request
 * posted straight at this action meets the same refusal.
 */
const decide = async (
  capability: "approveArticlesAndMemes" | "approveSponsors",
  shows: keyof typeof refreshPublic,
  run: (memberId: Awaited<ReturnType<typeof requireCapability>>) => Promise<string>,
) => {
  const member = await requireCapability(capability);
  const outcome = await run(member);

  revalidatePath("/admin/review");
  // Every decision here changes what a reader sees, so the pages that show it
  // are rebuilt now rather than at the end of their five minutes.
  refreshPublic[shows]();

  return { outcome };
};

export const approveArticleAction = async (articleId: string) =>
  decide("approveArticlesAndMemes", "articles", (member) => approveArticle(member, articleId));

/**
 * A refusal carries a reason, and the reason is not optional: "abgelehnt" on
 * its own tells the author that something is wrong and nothing about what. It
 * is trimmed and capped here, because it is written by a person into a box and
 * read by another person out of a list.
 */
const MAXIMUM_REASON = 500;

const reasoned = (reason: string) => reason.trim().slice(0, MAXIMUM_REASON);

export const returnArticleAction = async (articleId: string, reason: string) => {
  const written = reasoned(reason);
  if (written.length === 0) return { outcome: "reason_missing" };

  return decide("approveArticlesAndMemes", "articles", (member) =>
    returnToDraft(member, articleId, written),
  );
};

export const approveMemeAction = async (memeId: string) =>
  decide("approveArticlesAndMemes", "memes", (member) => approveMeme(member, memeId));

export const rejectMemeAction = async (memeId: string, reason: string) => {
  const written = reasoned(reason);
  if (written.length === 0) return { outcome: "reason_missing" };

  return decide("approveArticlesAndMemes", "memes", (member) =>
    rejectMeme(member, memeId, written),
  );
};

export const approveSponsorAction = async (sponsorId: string) =>
  decide("approveSponsors", "sponsors", (member) => approveSponsor(member, sponsorId));

export const rejectSponsorAction = async (sponsorId: string, reason: string) => {
  const written = reasoned(reason);
  if (written.length === 0) return { outcome: "reason_missing" };

  return decide("approveSponsors", "sponsors", (member) =>
    rejectSponsor(member, sponsorId, written),
  );
};
