const PLAIN_TEXT_COLUMNS = 72;

const isUnbreakable = (word: string) => word.length > PLAIN_TEXT_COLUMNS;

/**
 * Wraps prose at a column width every mail reader can show without its own
 * reflow, and leaves a long token — a link, above all — on its own line rather
 * than splitting it, because a split link stops being clickable.
 */
export const wrapProse = (paragraph: string): string => {
  const lines: string[] = [];
  let line = "";

  for (const word of paragraph.split(/\s+/).filter((part) => part !== "")) {
    if (line === "") {
      line = word;
    } else if (line.length + 1 + word.length <= PLAIN_TEXT_COLUMNS) {
      line = `${line} ${word}`;
    } else {
      lines.push(line);
      line = word;
    }

    if (isUnbreakable(line)) {
      lines.push(line);
      line = "";
    }
  }

  if (line !== "") lines.push(line);

  return lines.join("\n");
};

/** One fact of the summary box, as "Geprüft: Mira Özkan · Redakteurin". */
export const labelled = (label: string, value: string) => `${label}: ${value}`;

export type PlainTextBlock = string | readonly string[] | null;

const renderBlock = (block: Exclude<PlainTextBlock, null>) =>
  typeof block === "string" ? wrapProse(block) : block.join("\n");

/**
 * Builds the plaintext part from blocks written for plaintext, rather than by
 * stripping the markup: the two parts say the same thing, but a reader who only
 * ever sees this one still gets a mail that was laid out for them.
 */
export const plainText = (blocks: readonly PlainTextBlock[]) =>
  `${blocks
    .filter((block): block is Exclude<PlainTextBlock, null> => block !== null)
    .map(renderBlock)
    .join("\n\n")}\n`;

export const SIGNATURE = [
  "—",
  "Vox Audax · Schülerzeitung des Uhland-Gymnasiums",
];
