"use server";

import { revalidatePath } from "next/cache";

import { requireCapability } from "@/lib/authorize";
import { CHAT_GROUPS, chatGroupAddress, type ChatGroupKind } from "@/lib/chat-groups";
import { editorialPageDocument, paragraphsOf } from "@/lib/editorial-page";
import { saveEditorialPage, type ChatGroupUrls } from "@/lib/editorial/editorial-page";
import { refreshPublic } from "@/lib/refresh";

export type EditorialPageState = { readonly problem: string | null; readonly saved: boolean };

const LIMITS = { title: 80, heading: 60, invitation: 600, intro: 2000, note: 2000 } as const;

export const saveEditorialPageAction = async (
  _state: EditorialPageState,
  form: FormData,
): Promise<EditorialPageState> => {
  await requireCapability("editEditorialPage");

  const field = (name: string) => String(form.get(name) ?? "");
  const fields = {
    title: field("title").replace(/\s+/g, " ").trim(),
    intro: field("intro"),
    heading: field("heading"),
    invitation: field("invitation"),
    note: field("note"),
  };

  if (fields.title.length === 0) return { problem: "Die Seite braucht einen Titel.", saved: false };
  if (fields.heading.trim().length === 0) {
    return { problem: "Die Einladung braucht eine Überschrift.", saved: false };
  }
  if (paragraphsOf(fields.invitation).length === 0) {
    return { problem: "Ohne Einladungstext bleibt der Kasten auf der Startseite leer.", saved: false };
  }

  for (const [name, limit] of Object.entries(LIMITS) as [keyof typeof LIMITS, number][]) {
    if (fields[name].trim().length > limit) {
      return { problem: `Ein Feld ist länger als ${limit} Zeichen.`, saved: false };
    }
  }

  const groups: Partial<Record<ChatGroupKind, string | null>> = {};
  for (const group of CHAT_GROUPS) {
    const address = chatGroupAddress(group.kind, field(group.kind));
    if (!address.ok) {
      return {
        problem: `Der Link zur ${group.label} ist keine Einladung auf ${group.host}.`,
        saved: false,
      };
    }
    groups[group.kind] = address.url;
  }

  try {
    await saveEditorialPage({
      title: fields.title,
      body: editorialPageDocument(fields),
      groups: groups as ChatGroupUrls,
    });
  } catch (cause) {
    console.error("error", "the editorial page could not be saved", { cause });
    return { problem: "Das ließ sich gerade nicht speichern.", saved: false };
  }

  revalidatePath("/admin/redaktionsseite");
  refreshPublic.editorial();

  return { problem: null, saved: true };
};
