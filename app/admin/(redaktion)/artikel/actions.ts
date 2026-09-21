"use server";

import { redirect } from "next/navigation";

import { requireCapability } from "@/lib/authorize";
import { createDraft } from "@/lib/editorial/articles";

export const newArticleAction = async () => {
  const member = await requireCapability("writeOwnArticles");
  const articleId = await createDraft(member);
  redirect(`/admin/artikel/${articleId}`);
};
