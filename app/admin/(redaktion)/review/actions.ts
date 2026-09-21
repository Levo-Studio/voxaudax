"use server";

import { revalidatePath } from "next/cache";

import { requireCapability } from "@/lib/authorize";
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
  run: (memberId: Awaited<ReturnType<typeof requireCapability>>) => Promise<string>,
) => {
  const member = await requireCapability(capability);
  const outcome = await run(member);
  revalidatePath("/admin/review");
  return { outcome };
};

export const approveArticleAction = async (articleId: string) =>
  decide("approveArticlesAndMemes", (member) => approveArticle(member, articleId));

export const returnArticleAction = async (articleId: string) =>
  decide("approveArticlesAndMemes", (member) => returnToDraft(member, articleId));

export const approveMemeAction = async (memeId: string) =>
  decide("approveArticlesAndMemes", (member) => approveMeme(member, memeId));

export const rejectMemeAction = async (memeId: string) =>
  decide("approveArticlesAndMemes", (member) => rejectMeme(member, memeId));

export const approveSponsorAction = async (sponsorId: string) =>
  decide("approveSponsors", (member) => approveSponsor(member, sponsorId));

export const rejectSponsorAction = async (sponsorId: string) =>
  decide("approveSponsors", (member) => rejectSponsor(member, sponsorId));
