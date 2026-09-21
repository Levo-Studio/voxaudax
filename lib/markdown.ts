import type { TipTapDocument, TipTapMark, TipTapNode } from "@/lib/content";
import { EMPTY_DOCUMENT } from "@/lib/tiptap";

/**
 * The two editor modes are two spellings of one document. The Markdown mode is
 * not a second storage format: what it parses to is the same TipTap JSON the
 * rich text mode produces, so switching modes cannot lose a node that has no
 * Markdown and cannot leave two sources of truth in the row.
 *
 * The subset is the one screen 3b prints in its own toolbar hint — `## H2`,
 * `**fett**`, `*kursiv*`, `[link](url)`, `> Zitat`, `- Liste`, `---` — and
 * nothing beyond it, because a syntax the toolbar does not name is a syntax the
 * rich text mode could not show back.
 */

/**
 * The link alternative refuses one that a `!` introduces: `![alt](src)` is an
 * image, and reading it as a link would leave the `!` behind as text and the
 * address as a link — which is exactly what the round trip used to do to every
 * image in a body.
 */
const INLINE = /(\*\*[^*]+\*\*|\*[^*]+\*|(?<!!)\[[^\]]*\]\([^)\s]*\))/;

/** A line that is nothing but an image is the image block the editor draws. */
const IMAGE_LINE = /^!\[([^\]]*)\]\(([^)\s]*)\)\s*$/;

const inlineNodes = (text: string): TipTapNode[] => {
  const nodes: TipTapNode[] = [];

  for (const piece of text.split(INLINE)) {
    if (piece.length === 0) continue;

    const withMark = (inner: string, mark: TipTapMark) =>
      nodes.push({ type: "text", text: inner, marks: [mark] });

    if (piece.startsWith("**") && piece.endsWith("**") && piece.length > 4) {
      withMark(piece.slice(2, -2), { type: "bold" });
      continue;
    }

    if (piece.startsWith("*") && piece.endsWith("*") && piece.length > 2) {
      withMark(piece.slice(1, -1), { type: "italic" });
      continue;
    }

    const link = /^\[([^\]]*)\]\(([^)\s]*)\)$/.exec(piece);
    if (link !== null) {
      withMark(link[1]!.length > 0 ? link[1]! : link[2]!, {
        type: "link",
        attrs: { href: link[2]! },
      });
      continue;
    }

    nodes.push({ type: "text", text: piece });
  }

  return nodes;
};

const paragraph = (lines: readonly string[]): TipTapNode => ({
  type: "paragraph",
  content: inlineNodes(lines.join(" ")),
});

export const markdownToDocument = (markdown: string): TipTapDocument => {
  const content: TipTapNode[] = [];
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  let index = 0;

  const collect = (matches: (line: string) => boolean) => {
    const gathered: string[] = [];
    while (index < lines.length && matches(lines[index]!)) {
      gathered.push(lines[index]!);
      index += 1;
    }
    return gathered;
  };

  while (index < lines.length) {
    const line = lines[index]!;

    if (line.trim().length === 0) {
      index += 1;
      continue;
    }

    if (/^-{3,}\s*$/.test(line)) {
      content.push({ type: "horizontalRule" });
      index += 1;
      continue;
    }

    const image = IMAGE_LINE.exec(line);
    if (image !== null) {
      content.push({ type: "image", attrs: { src: image[2]!, alt: image[1]! } });
      index += 1;
      continue;
    }

    const heading = /^(#{2,3})\s+(.*)$/.exec(line);
    if (heading !== null) {
      content.push({
        type: "heading",
        attrs: { level: heading[1]!.length === 3 ? 3 : 2 },
        content: inlineNodes(heading[2]!.trim()),
      });
      index += 1;
      continue;
    }

    if (line.startsWith(">")) {
      // A bare `>` separates one quoted paragraph from the next, the way a
      // blank line separates two paragraphs outside a quote. Joining every
      // quoted line into a single paragraph collapsed the quote on the way
      // back in and lost the break for good on the next save.
      const quoted = collect((candidate) => candidate.startsWith(">"));
      const quotedParagraphs: string[][] = [];
      let gathering: string[] = [];

      for (const entry of quoted.map((candidate) => candidate.replace(/^>\s?/, ""))) {
        if (entry.trim().length === 0) {
          if (gathering.length > 0) quotedParagraphs.push(gathering);
          gathering = [];
          continue;
        }
        gathering.push(entry);
      }
      if (gathering.length > 0) quotedParagraphs.push(gathering);

      content.push({
        type: "blockquote",
        content: (quotedParagraphs.length === 0 ? [[""]] : quotedParagraphs).map(paragraph),
      });
      continue;
    }

    const bullet = /^[-*]\s+/;
    if (bullet.test(line)) {
      const items = collect((candidate) => bullet.test(candidate));
      content.push({
        type: "bulletList",
        content: items.map((item) => ({
          type: "listItem",
          content: [paragraph([item.replace(bullet, "")])],
        })),
      });
      continue;
    }

    const ordered = /^\d+\.\s+/;
    if (ordered.test(line)) {
      const items = collect((candidate) => ordered.test(candidate));
      content.push({
        type: "orderedList",
        content: items.map((item) => ({
          type: "listItem",
          content: [paragraph([item.replace(ordered, "")])],
        })),
      });
      continue;
    }

    const block = collect(
      (candidate) =>
        candidate.trim().length > 0 &&
        !candidate.startsWith(">") &&
        !bullet.test(candidate) &&
        !ordered.test(candidate) &&
        !/^#{2,3}\s/.test(candidate) &&
        !/^-{3,}\s*$/.test(candidate) &&
        !IMAGE_LINE.test(candidate),
    );
    content.push(paragraph(block));
  }

  return content.length === 0 ? EMPTY_DOCUMENT : { type: "doc", content };
};

const inlineMarkdown = (nodes: readonly TipTapNode[] | undefined): string =>
  (nodes ?? [])
    .map((node) => {
      const text = node.text ?? inlineMarkdown(node.content);
      return (node.marks ?? []).reduce((written, mark) => {
        if (mark.type === "bold") return `**${written}**`;
        if (mark.type === "italic") return `*${written}*`;
        if (mark.type === "link") return `[${written}](${mark.attrs?.href ?? ""})`;
        return written;
      }, text);
    })
    .join("");

const blockMarkdown = (node: TipTapNode): string => {
  if (node.type === "heading") {
    return `${node.attrs?.level === 3 ? "###" : "##"} ${inlineMarkdown(node.content)}`;
  }
  if (node.type === "horizontalRule") return "---";
  if (node.type === "blockquote") {
    return (node.content ?? [])
      .map((inner) => `> ${inlineMarkdown(inner.content)}`)
      .join("\n>\n");
  }
  if (node.type === "bulletList" || node.type === "orderedList") {
    return (node.content ?? [])
      .map((item, position) => {
        const body = (item.content ?? []).map((inner) => inlineMarkdown(inner.content)).join(" ");
        return node.type === "bulletList" ? `- ${body}` : `${position + 1}. ${body}`;
      })
      .join("\n");
  }
  if (node.type === "image") {
    return `![${node.attrs?.alt ?? ""}](${node.attrs?.src ?? ""})`;
  }
  return inlineMarkdown(node.content);
};

export const documentToMarkdown = (document: TipTapDocument) =>
  document.content.map(blockMarkdown).join("\n\n");
