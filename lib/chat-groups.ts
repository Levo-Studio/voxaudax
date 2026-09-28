import type { chatGroupKind } from "@/lib/db/schema";

export type ChatGroupKind = (typeof chatGroupKind.enumValues)[number];

/**
 * The two messengers the editorial team is reachable in, in the order their
 * buttons stand. Each invite link has one host it can live on, and an address
 * for any other host is a typo or somebody else's group — so it is refused
 * rather than published under the newspaper's name.
 */
export const CHAT_GROUPS: ReadonlyArray<{
  readonly kind: ChatGroupKind;
  readonly label: string;
  readonly host: string;
  readonly example: string;
}> = [
  {
    kind: "signal",
    label: "Signal-Gruppe",
    host: "signal.group",
    example: "https://signal.group/#…",
  },
  {
    kind: "whatsapp",
    label: "WhatsApp-Gruppe",
    host: "chat.whatsapp.com",
    example: "https://chat.whatsapp.com/…",
  },
];

export const chatGroupLabel = (kind: ChatGroupKind) =>
  CHAT_GROUPS.find((group) => group.kind === kind)?.label ?? kind;

/**
 * What an admin typed into the link field, read as an invite link.
 *
 * Empty means "no group", which takes the button off the page. Anything else
 * has to be an https address on the messenger's own host and has to name a
 * group: Signal carries the group in the fragment, WhatsApp in the path, and
 * the bare host alone leads to an app download page.
 */
export const chatGroupAddress = (
  kind: ChatGroupKind,
  typed: string,
): { readonly ok: true; readonly url: string | null } | { readonly ok: false } => {
  const trimmed = typed.trim();
  if (trimmed.length === 0) return { ok: true, url: null };

  const group = CHAT_GROUPS.find((candidate) => candidate.kind === kind);
  if (group === undefined) return { ok: false };

  let url: URL;
  try {
    url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`);
  } catch {
    return { ok: false };
  }

  if (url.protocol !== "https:" || url.hostname !== group.host) return { ok: false };

  const namesAGroup =
    kind === "signal" ? url.hash.length > 1 : url.pathname.replace(/\/+$/, "").length > 1;

  return namesAGroup ? { ok: true, url: url.href } : { ok: false };
};
