/**
 * "Abbildung 2.1" — the second section's first picture. The number is never
 * stored: it is read off where the image sits, so moving a picture or adding a
 * heading above it renumbers everything below by itself, and two places that
 * both count cannot disagree.
 *
 * Sections are counted by level-2 headings. A picture that stands before the
 * first heading belongs to section 1, because an article with no headings still
 * has one part and calling its first picture "0.1" would read like a mistake.
 */
export const FIGURE_WORD = "Abbildung";

export const figureNumbers = (
  blocks: readonly { readonly kind: string }[],
): readonly (string | null)[] => {
  // Starts at 0 and becomes 1 at the first heading — or at the first picture,
  // if one comes before any heading at all.
  let section = 0;
  let figure = 0;

  return blocks.map((block) => {
    if (block.kind === "heading2") {
      section += 1;
      figure = 0;
      return null;
    }

    if (block.kind !== "image") return null;

    if (section === 0) section = 1;
    figure += 1;
    return `${section}.${figure}`;
  });
};
