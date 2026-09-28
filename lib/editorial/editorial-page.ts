import "server-only";
import { eq, sql } from "drizzle-orm";

import type { TipTapDocument } from "@/lib/content";
import { db } from "@/lib/db/client";
import { chatGroups, pages } from "@/lib/db/schema";
import type { ChatGroupKind } from "@/lib/chat-groups";
import { editorialPageFields, type EditorialPageFields } from "@/lib/editorial-page";

/** The row `/redaktion` and the home page's "Mitschreiben" block both read. */
export const EDITORIAL_PAGE_SLUG = "redaktion";

export type ChatGroupUrls = Readonly<Record<ChatGroupKind, string | null>>;

export const readEditorialPage = async (): Promise<{
  readonly fields: EditorialPageFields;
  readonly groups: ChatGroupUrls;
}> => {
  const [[page], groups] = await Promise.all([
    db
      .select({ title: pages.title, body: pages.body })
      .from(pages)
      .where(eq(pages.slug, EDITORIAL_PAGE_SLUG))
      .limit(1),
    db.select({ kind: chatGroups.kind, url: chatGroups.url }).from(chatGroups),
  ]);

  const urlOf = (kind: ChatGroupKind) => groups.find((group) => group.kind === kind)?.url ?? null;

  return {
    fields: editorialPageFields(page?.title ?? "Die Redaktion", page?.body.content ?? []),
    groups: { signal: urlOf("signal"), whatsapp: urlOf("whatsapp") },
  };
};

/**
 * The text and the links in one transaction: they are one section on the page,
 * and a save that wrote the sentence "tritt unserer Signal-Gruppe bei" without
 * the link it names would publish half of a change.
 */
export const saveEditorialPage = (input: {
  readonly title: string;
  readonly body: TipTapDocument;
  readonly groups: ChatGroupUrls;
}) =>
  db.transaction(async (tx) => {
    await tx
      .insert(pages)
      .values({ slug: EDITORIAL_PAGE_SLUG, title: input.title, body: input.body })
      .onConflictDoUpdate({
        target: pages.slug,
        set: { title: input.title, body: input.body, updatedAt: sql`now()` },
      });

    for (const [kind, url] of Object.entries(input.groups) as [ChatGroupKind, string | null][]) {
      if (url === null) {
        await tx.delete(chatGroups).where(eq(chatGroups.kind, kind));
        continue;
      }

      await tx
        .insert(chatGroups)
        .values({ kind, url })
        .onConflictDoUpdate({
          target: chatGroups.kind,
          set: { url, updatedAt: sql`now()` },
        });
    }
  });
