import type { TipTapDocument, TipTapNode } from "../lib/content.ts";

export type Block =
  | { readonly h2: string }
  | { readonly p: string }
  | { readonly quote: string; readonly source?: string }
  | { readonly ul: readonly string[] };

const paragraph = (text: string): TipTapNode => ({
  type: "paragraph",
  content: [{ type: "text", text }],
});

const toNode = (block: Block): TipTapNode => {
  if ("h2" in block)
    return {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: block.h2 }],
    };

  if ("p" in block) return paragraph(block.p);

  if ("ul" in block)
    return {
      type: "bulletList",
      content: block.ul.map((item) => ({
        type: "listItem",
        content: [paragraph(item)],
      })),
    };

  return {
    type: "blockquote",
    content:
      block.source === undefined
        ? [paragraph(`„${block.quote}"`)]
        : [paragraph(`„${block.quote}"`), paragraph(block.source)],
  };
};

export const document = (blocks: readonly Block[]): TipTapDocument => ({
  type: "doc",
  content: blocks.map(toNode),
});
