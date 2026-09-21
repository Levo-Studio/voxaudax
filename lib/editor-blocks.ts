import type { TipTapDocument, TipTapMark, TipTapNode } from "@/lib/content";
import { acceptHref } from "@/lib/tiptap";

/**
 * The editor edits blocks; the database stores TipTap JSON. This module is the
 * only translation between the two, so the rich text mode, the Markdown mode
 * and the preview all read the same document rather than three shapes that
 * happen to agree today.
 *
 * A list item is its own block rather than a list holding items: consecutive
 * items group into one list on the way out and flatten on the way in, which
 * keeps every block a single editable line and needs no nested editing.
 */
export type BlockKind =
  | "paragraph"
  | "heading2"
  | "heading3"
  | "blockquote"
  | "bulletItem"
  | "orderedItem"
  | "horizontalRule"
  | "image";

export type Block = {
  readonly id: string;
  readonly kind: BlockKind;
  /** Inline HTML limited to `<b>`, `<i>` and `<a href>`; empty for a rule. */
  readonly html: string;
  readonly src?: string;
  readonly alt?: string;
};

const escapeText = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const escapeAttribute = (value: string) => escapeText(value).replace(/"/g, "&quot;");

export const inlineToHtml = (nodes: readonly TipTapNode[] | undefined): string =>
  (nodes ?? [])
    .map((node) => {
      const text = escapeText(node.text ?? "");
      return (node.marks ?? []).reduce((written, mark) => {
        if (mark.type === "bold") return `<b>${written}</b>`;
        if (mark.type === "italic") return `<i>${written}</i>`;
        if (mark.type === "link") {
          return `<a href="${escapeAttribute(String(mark.attrs?.href ?? ""))}">${written}</a>`;
        }
        return written;
      }, text);
    })
    .join("");

const MARK_BY_TAG: Record<string, TipTapMark["type"]> = {
  B: "bold",
  STRONG: "bold",
  I: "italic",
  EM: "italic",
};

/**
 * Walks what `contentEditable` left behind and keeps only the three marks the
 * toolbar offers. The browser is free to produce `<strong>` where the toolbar
 * asked for `<b>`, or to nest a span it decided it needed — none of that
 * reaches the row, because the row is built from this walk and never from the
 * element's `innerHTML`.
 *
 * It is also what a paste is put through before it is inserted. The block's
 * `html` is handed to `dangerouslySetInnerHTML`, so anything that reaches it
 * runs in the author's own signed-in session — which the server re-parsing the
 * document on save does nothing about.
 *
 * Runs in the browser only, because it needs a DOM to walk.
 */
export const htmlToInline = (html: string): TipTapNode[] => {
  const holder = document.createElement("div");
  holder.innerHTML = html;

  const nodes: TipTapNode[] = [];

  const walk = (element: Node, marks: readonly TipTapMark[]) => {
    for (const child of Array.from(element.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent ?? "";
        if (text.length === 0) continue;
        nodes.push(marks.length === 0 ? { type: "text", text } : { type: "text", text, marks });
        continue;
      }

      if (child.nodeType !== Node.ELEMENT_NODE) continue;
      const tag = (child as Element).tagName;

      if (tag === "BR") {
        nodes.push({ type: "text", text: " " });
        continue;
      }

      if (tag === "A") {
        // The same rule the server applies when it parses the document back:
        // a `javascript:` href does not become a link here either, so what the
        // editor shows and what the row would hold cannot disagree while the
        // author is still looking at it.
        const href = acceptHref((child as HTMLAnchorElement).getAttribute("href"));
        walk(child, href === null ? marks : [...marks, { type: "link", attrs: { href } }]);
        continue;
      }

      const mark = MARK_BY_TAG[tag];
      walk(child, mark === undefined || marks.some((existing) => existing.type === mark)
        ? marks
        : [...marks, { type: mark }]);
    }
  };

  walk(holder, []);
  return nodes;
};

let counter = 0;
const nextId = () => {
  counter += 1;
  return `b${counter}`;
};

export const emptyBlock = (kind: BlockKind = "paragraph"): Block => ({
  id: nextId(),
  kind,
  html: "",
});

export const documentToBlocks = (document: TipTapDocument): Block[] => {
  const blocks: Block[] = [];

  for (const node of document.content) {
    if (node.type === "horizontalRule") {
      blocks.push({ id: nextId(), kind: "horizontalRule", html: "" });
      continue;
    }

    if (node.type === "image") {
      blocks.push({
        id: nextId(),
        kind: "image",
        html: "",
        src: String(node.attrs?.src ?? ""),
        alt: String(node.attrs?.alt ?? ""),
      });
      continue;
    }

    if (node.type === "bulletList" || node.type === "orderedList") {
      const kind = node.type === "bulletList" ? "bulletItem" : "orderedItem";
      for (const item of node.content ?? []) {
        blocks.push({
          id: nextId(),
          kind,
          html: (item.content ?? []).map((inner) => inlineToHtml(inner.content)).join(" "),
        });
      }
      continue;
    }

    if (node.type === "blockquote") {
      blocks.push({
        id: nextId(),
        kind: "blockquote",
        html: (node.content ?? []).map((inner) => inlineToHtml(inner.content)).join(" "),
      });
      continue;
    }

    if (node.type === "heading") {
      blocks.push({
        id: nextId(),
        kind: node.attrs?.level === 3 ? "heading3" : "heading2",
        html: inlineToHtml(node.content),
      });
      continue;
    }

    blocks.push({ id: nextId(), kind: "paragraph", html: inlineToHtml(node.content) });
  }

  return blocks.length === 0 ? [emptyBlock()] : blocks;
};

export const blocksToDocument = (
  blocks: readonly Block[],
  inline: (html: string) => TipTapNode[],
): TipTapDocument => {
  const content: TipTapNode[] = [];
  let index = 0;

  while (index < blocks.length) {
    const block = blocks[index]!;

    if (block.kind === "horizontalRule") {
      content.push({ type: "horizontalRule" });
      index += 1;
      continue;
    }

    if (block.kind === "image") {
      content.push({ type: "image", attrs: { src: block.src ?? "", alt: block.alt ?? "" } });
      index += 1;
      continue;
    }

    if (block.kind === "bulletItem" || block.kind === "orderedItem") {
      const items: TipTapNode[] = [];
      while (index < blocks.length && blocks[index]!.kind === block.kind) {
        items.push({
          type: "listItem",
          content: [{ type: "paragraph", content: inline(blocks[index]!.html) }],
        });
        index += 1;
      }
      content.push({
        type: block.kind === "bulletItem" ? "bulletList" : "orderedList",
        content: items,
      });
      continue;
    }

    if (block.kind === "blockquote") {
      content.push({
        type: "blockquote",
        content: [{ type: "paragraph", content: inline(block.html) }],
      });
      index += 1;
      continue;
    }

    if (block.kind === "heading2" || block.kind === "heading3") {
      content.push({
        type: "heading",
        attrs: { level: block.kind === "heading3" ? 3 : 2 },
        content: inline(block.html),
      });
      index += 1;
      continue;
    }

    content.push({ type: "paragraph", content: inline(block.html) });
    index += 1;
  }

  return content.length === 0
    ? { type: "doc", content: [{ type: "paragraph", content: [] }] }
    : { type: "doc", content };
};
