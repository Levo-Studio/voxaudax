import type { TipTapNode } from "@/lib/content";

/**
 * Screen 9a is an introduction, the list of people, one boxed invitation and a
 * closing note in small type. The `redaktion` page row supplies the three
 * pieces of text in that order: what stands before the first heading
 * introduces, the first heading and the paragraph under it are the invitation,
 * and whatever follows is the note.
 *
 * The home page's "Mitschreiben" block is the same invitation, so it reads it
 * from here rather than carrying a second copy that has to be changed twice.
 */
export type EditorialPageParts = {
  intro: readonly TipTapNode[];
  invitation?: { heading: TipTapNode; text: TipTapNode };
  note: readonly TipTapNode[];
};

export const splitEditorialPage = (
  nodes: readonly TipTapNode[],
): EditorialPageParts => {
  const headingAt = nodes.findIndex((node) => node.type === "heading");

  if (headingAt === -1) return { intro: nodes, invitation: undefined, note: [] };

  const [invitationText, ...note] = nodes.slice(headingAt + 1);

  return {
    intro: nodes.slice(0, headingAt),
    invitation:
      invitationText === undefined
        ? undefined
        : { heading: nodes[headingAt], text: invitationText },
    note,
  };
};
