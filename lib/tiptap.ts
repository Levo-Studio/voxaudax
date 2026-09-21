import type { TipTapDocument, TipTapMark, TipTapNode } from "@/lib/content";

/**
 * The body is stored as TipTap JSON and never as an HTML string, so what
 * arrives from a browser is parsed against the node and mark types the toolbar
 * can actually produce. Anything else is dropped rather than escaped: a
 * renderer that has to be careful is a renderer one refactor away from not
 * being careful.
 */
const BLOCK_TYPES = [
  "paragraph",
  "heading",
  "bulletList",
  "orderedList",
  "listItem",
  "blockquote",
  "horizontalRule",
  "image",
] as const;

const MARK_TYPES = ["bold", "italic", "link"] as const;

type BlockType = (typeof BLOCK_TYPES)[number];

const isBlockType = (value: unknown): value is BlockType =>
  (BLOCK_TYPES as readonly string[]).includes(value as string);

const asRecord = (value: unknown) =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

/** Only http(s) and same-site paths survive; `javascript:` never becomes a link. */
export const acceptHref = (value: unknown) => {
  if (typeof value !== "string") return null;
  if (value.startsWith("/")) return value;

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
};

/**
 * An image address is not a link address, and it was being taken as any string
 * at all while the `href` beside it went through `acceptHref`. A link is
 * followed on purpose; an image is fetched by every reader's browser the moment
 * the article opens, so an external one hands that host the IP address of
 * everybody who reads it — from a page that was approved as harmless.
 *
 * The only images this installation has are the ones it serves itself, so that
 * is the whole of what an image may point at.
 */
const IMAGE_SOURCE =
  /^\/api\/bilder\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const acceptImageSource = (value: unknown) =>
  typeof value === "string" && IMAGE_SOURCE.test(value) ? value : null;

const parseMarks = (value: unknown): TipTapMark[] => {
  if (!Array.isArray(value)) return [];

  const marks: TipTapMark[] = [];
  for (const entry of value) {
    const mark = asRecord(entry);
    if (mark === null) continue;
    if (!(MARK_TYPES as readonly string[]).includes(mark.type as string)) continue;

    if (mark.type === "link") {
      const href = acceptHref(asRecord(mark.attrs)?.href);
      if (href === null) continue;
      marks.push({ type: "link", attrs: { href } });
      continue;
    }

    marks.push({ type: mark.type as string });
  }
  return marks;
};

const parseNode = (value: unknown): TipTapNode | null => {
  const node = asRecord(value);
  if (node === null) return null;

  if (node.type === "text") {
    const text = typeof node.text === "string" ? node.text : "";
    if (text.length === 0) return null;
    const marks = parseMarks(node.marks);
    return marks.length === 0 ? { type: "text", text } : { type: "text", text, marks };
  }

  if (!isBlockType(node.type)) return null;

  if (node.type === "horizontalRule") return { type: "horizontalRule" };

  if (node.type === "image") {
    const attributes = asRecord(node.attrs);
    const src = acceptImageSource(attributes?.src);
    if (src === null) return null;

    const alt = attributes?.alt;
    return {
      type: "image",
      attrs: { src, alt: typeof alt === "string" ? alt : "" },
    };
  }

  const content = parseContent(node.content);

  if (node.type === "heading") {
    // The toolbar offers H2 and H3; an H1 is the article's title, which is not
    // part of the body, and anything deeper has no style in the layout.
    const level = asRecord(node.attrs)?.level;
    return {
      type: "heading",
      attrs: { level: level === 3 ? 3 : 2 },
      content,
    };
  }

  return { type: node.type, content };
};

const parseContent = (value: unknown): TipTapNode[] => {
  if (!Array.isArray(value)) return [];
  const parsed: TipTapNode[] = [];
  for (const entry of value) {
    const node = parseNode(entry);
    if (node !== null) parsed.push(node);
  }
  return parsed;
};

export const EMPTY_DOCUMENT: TipTapDocument = {
  type: "doc",
  content: [{ type: "paragraph", content: [] }],
};

export const parseDocument = (value: unknown): TipTapDocument => {
  const document = asRecord(value);
  const content = parseContent(document?.content);
  return content.length === 0 ? EMPTY_DOCUMENT : { type: "doc", content };
};

export const parseDocumentJson = (value: string): TipTapDocument => {
  try {
    return parseDocument(JSON.parse(value));
  } catch {
    return EMPTY_DOCUMENT;
  }
};
