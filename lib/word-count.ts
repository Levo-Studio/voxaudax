import type { TipTapDocument, TipTapNode } from "@/lib/content";

const textOf = (node: TipTapNode): string =>
  [node.text ?? "", ...(node.content ?? []).map(textOf)].join(" ");

/**
 * What the editor's "1.204 Wörter" counts: runs of non-whitespace in the
 * document's own text, with no node type weighted differently.
 */
export const countWords = (document: TipTapDocument) =>
  textOf({ type: "doc", content: document.content })
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
