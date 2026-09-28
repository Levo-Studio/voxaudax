import type { TipTapDocument, TipTapNode } from "@/lib/content";

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

/**
 * The page as an admin edits it: plain text in five fields, one per piece
 * `splitEditorialPage` finds. The stored document stays the source of truth
 * for the public pages; these two functions only translate between it and the
 * form, so the split above keeps deciding what a reader sees.
 *
 * A blank line starts a new paragraph. A single line break is where somebody's
 * text wrapped when they pasted it and is read as a space — the invitation is
 * set in a narrow column on the home page, where a forced break lands wherever
 * the column happens to end.
 */
export type EditorialPageFields = {
  readonly title: string;
  readonly intro: string;
  readonly heading: string;
  readonly invitation: string;
  readonly note: string;
};

const plainText = (node: TipTapNode): string =>
  node.type === "hardBreak"
    ? "\n"
    : (node.text ?? (node.content ?? []).map(plainText).join(""));

export const paragraphsOf = (typed: string): string[] =>
  typed
    .replace(/\r\n?/g, "\n")
    .split(/\n[^\S\n]*\n/)
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter((paragraph) => paragraph.length > 0);

const paragraph = (text: string): TipTapNode => ({
  type: "paragraph",
  content: [{ type: "text", text }],
});

export const editorialPageFields = (
  title: string,
  nodes: readonly TipTapNode[],
): EditorialPageFields => {
  const { intro, invitation, note } = splitEditorialPage(nodes);
  const joined = (part: readonly TipTapNode[]) => part.map(plainText).join("\n\n");

  return {
    title,
    intro: joined(intro),
    heading: invitation === undefined ? "" : plainText(invitation.heading),
    invitation: invitation === undefined ? "" : plainText(invitation.text),
    note: joined(note),
  };
};

/**
 * Always writes the heading and the invitation, even though the split would
 * accept a page without them: the home page's "Mitschreiben" block reads the
 * invitation from here, and a page saved without one would empty that block.
 */
export const editorialPageDocument = (fields: EditorialPageFields): TipTapDocument => ({
  type: "doc",
  content: [
    ...paragraphsOf(fields.intro).map(paragraph),
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: fields.heading.replace(/\s+/g, " ").trim() }],
    },
    paragraph(paragraphsOf(fields.invitation).join(" ")),
    ...paragraphsOf(fields.note).map(paragraph),
  ],
});
