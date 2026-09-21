"use client";

import { useRef, type ClipboardEvent, type KeyboardEvent } from "react";

import {
  emptyBlock,
  htmlToInline,
  inlineToHtml,
  type Block,
  type BlockKind,
} from "@/lib/editor-blocks";

/**
 * The rich text half of screen 3b. Each block is its own editable line, so the
 * toolbar can change what a line *is* — heading, quote, list item — without
 * having to understand a selection that spans two of them.
 *
 * What the browser leaves in the element is never stored: `htmlToInline` walks
 * it and keeps the three marks the toolbar offers, and the server parses the
 * document again before it writes. `execCommand` is deprecated and is still the
 * only thing every browser implements for applying a mark to a selection; since
 * nothing downstream reads its HTML, what it produces does not matter.
 */

const BLOCK_CLASS: Record<BlockKind, string> = {
  paragraph: "text-[17.5px] leading-[1.7] font-medium",
  heading2: "text-2xl font-extrabold tracking-[-0.03em]",
  heading3: "text-xl font-extrabold tracking-[-0.03em]",
  blockquote: "border-l-[3px] border-ac pl-[18px] text-[19px] leading-[1.55] font-semibold",
  bulletItem: "text-[17.5px] leading-[1.7] font-medium before:mr-2 before:content-['•']",
  orderedItem: "text-[17.5px] leading-[1.7] font-medium before:mr-2 before:content-['1.']",
  horizontalRule: "",
  image: "",
};

const TOOL_CLASS =
  "cursor-pointer rounded-[7px] border-none bg-transparent px-[11px] py-[7px] font-control text-[13px] font-semibold text-tx transition-colors duration-200 ease-out hover:bg-s2";

export type BlockEditorHandle = {
  readonly blocks: readonly Block[];
};

export function BlockEditor({
  blocks,
  onChange,
}: {
  blocks: readonly Block[];
  onChange: (blocks: readonly Block[]) => void;
}) {
  const focused = useRef<number>(0);

  const replace = (index: number, patch: Partial<Block>) =>
    onChange(blocks.map((block, position) => (position === index ? { ...block, ...patch } : block)));

  const applyKind = (kind: BlockKind) => {
    const index = Math.min(focused.current, blocks.length - 1);
    if (kind === "horizontalRule" || kind === "image") {
      onChange([
        ...blocks.slice(0, index + 1),
        { ...emptyBlock(kind), src: "", alt: "" },
        ...blocks.slice(index + 1),
      ]);
      return;
    }
    replace(index, { kind });
  };

  const applyMark = (command: "bold" | "italic") => {
    document.execCommand(command);
  };

  const applyLink = () => {
    const href = window.prompt("Wohin soll der Link führen?", "https://");
    if (href === null || href.trim().length === 0) return;
    document.execCommand("createLink", false, href.trim());
  };

  /**
   * The clipboard is not a trusted source of markup. A block's `html` is handed
   * to `dangerouslySetInnerHTML`, so a copied `<img onerror=…>` would run in
   * the author's own signed-in session — and the server re-parsing the document
   * on save is no help, because the script has already run by then.
   *
   * So the paste is put through the same walk everything else in this editor
   * goes through: what survives is text, bold, italic and a link the server
   * would accept.
   */
  const onPaste = (event: ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();

    const html = event.clipboardData.getData("text/html");
    if (html.length === 0) {
      document.execCommand("insertText", false, event.clipboardData.getData("text/plain"));
      return;
    }

    document.execCommand("insertHTML", false, inlineToHtml(htmlToInline(html)));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>, index: number) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      const current = blocks[index]!;
      const kind: BlockKind =
        current.kind === "bulletItem" || current.kind === "orderedItem"
          ? current.kind
          : "paragraph";
      onChange([...blocks.slice(0, index + 1), emptyBlock(kind), ...blocks.slice(index + 1)]);
      return;
    }

    if (event.key === "Backspace" && blocks.length > 1) {
      const element = event.currentTarget;
      if (element.textContent?.length === 0) {
        event.preventDefault();
        onChange(blocks.filter((_block, position) => position !== index));
      }
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-1">
        <button type="button" className={`${TOOL_CLASS} font-bold`} onMouseDown={(event) => event.preventDefault()} onClick={() => applyKind("heading2")}>
          H2
        </button>
        <button type="button" className={`${TOOL_CLASS} font-bold`} onMouseDown={(event) => event.preventDefault()} onClick={() => applyKind("heading3")}>
          H3
        </button>
        <span aria-hidden className="mx-[5px] h-5 w-px bg-bd" />
        <button type="button" className={`${TOOL_CLASS} font-extrabold`} onMouseDown={(event) => event.preventDefault()} onClick={() => applyMark("bold")} aria-label="Fett">
          B
        </button>
        <button type="button" className={`${TOOL_CLASS} italic`} onMouseDown={(event) => event.preventDefault()} onClick={() => applyMark("italic")} aria-label="Kursiv">
          I
        </button>
        <button type="button" className={TOOL_CLASS} onMouseDown={(event) => event.preventDefault()} onClick={applyLink}>
          Link
        </button>
        <span aria-hidden className="mx-[5px] h-5 w-px bg-bd" />
        <button type="button" className={TOOL_CLASS} onMouseDown={(event) => event.preventDefault()} onClick={() => applyKind("bulletItem")}>
          Liste
        </button>
        <button type="button" className={TOOL_CLASS} onMouseDown={(event) => event.preventDefault()} onClick={() => applyKind("blockquote")}>
          Zitat
        </button>
        <button type="button" className={TOOL_CLASS} onMouseDown={(event) => event.preventDefault()} onClick={() => applyKind("image")}>
          Bild
        </button>
        <button type="button" className={TOOL_CLASS} onMouseDown={(event) => event.preventDefault()} onClick={() => applyKind("horizontalRule")}>
          Trenner
        </button>
      </div>

      <div className="mt-6 flex max-w-[68ch] flex-col gap-3">
        {blocks.map((block, index) =>
          block.kind === "horizontalRule" ? (
            <div key={block.id} className="flex items-center gap-3">
              <hr className="flex-1 border-0 border-t border-bd" />
              <button
                type="button"
                onClick={() => onChange(blocks.filter((_b, position) => position !== index))}
                className="cursor-pointer rounded-lg border border-bd bg-transparent px-2 py-1 font-control text-[11.5px] font-bold text-tm"
              >
                Entfernen
              </button>
            </div>
          ) : block.kind === "image" ? (
            <div key={block.id} className="flex flex-col gap-2 rounded-[10px] border border-bd p-3">
              <input
                value={block.src ?? ""}
                onChange={(event) => replace(index, { src: event.target.value })}
                placeholder="/api/bilder/… — nur Bilder aus dieser Redaktion"
                aria-label="Bildadresse"
                className="w-full rounded-lg border border-bd bg-s2 px-[11px] py-[9px] font-mono text-xs text-tx outline-ac"
              />
              <input
                value={block.alt ?? ""}
                onChange={(event) => replace(index, { alt: event.target.value })}
                placeholder="Alt-Text · Pflichtfeld"
                aria-label="Alt-Text"
                className="w-full rounded-lg border border-bd bg-s2 px-[11px] py-[9px] font-control text-[13.5px] font-semibold text-tx outline-ac"
              />
            </div>
          ) : (
            <div
              key={block.id}
              contentEditable
              suppressContentEditableWarning
              role="textbox"
              aria-multiline="false"
              tabIndex={0}
              onFocus={() => {
                focused.current = index;
              }}
              onKeyDown={(event) => onKeyDown(event, index)}
              onPaste={onPaste}
              onInput={(event) => {
                // The block's `html` is read back rather than re-rendered: the
                // element owns its own markup while the caret is inside it, and
                // writing it back through React would move the caret to the end
                // on every keystroke. `dangerouslySetInnerHTML` therefore only
                // ever seeds it, because the key never changes while it is
                // being typed in.
                const written = event.currentTarget.innerHTML;
                onChange(
                  blocks.map((candidate, position) =>
                    position === index ? { ...candidate, html: written } : candidate,
                  ),
                );
              }}
              dangerouslySetInnerHTML={{ __html: block.html }}
              className={`min-h-[1.7em] outline-none focus-visible:outline-2 focus-visible:outline-ac ${BLOCK_CLASS[block.kind]}`}
            />
          ),
        )}
      </div>
    </>
  );
}

export const blocksInline = htmlToInline;
