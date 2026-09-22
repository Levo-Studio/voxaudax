"use client";

import {
  memo,
  useCallback,
  useEffect,
  useRef,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";

import {
  emptyBlock,
  htmlToInline,
  linkedHtml,
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

/**
 * One editable line, and the reason it is a component of its own: React writes
 * `dangerouslySetInnerHTML` to the DOM whenever the string differs from the one
 * it last rendered, and assigning `innerHTML` throws away the nodes the caret
 * is sitting in. With the html in state, every keystroke therefore put the
 * caret back at position 0 and the next letter landed in front of the last —
 * the text came out reversed.
 *
 * So the comparison below deliberately ignores `html`. While a line is being
 * typed in, the element owns its own markup and React is told nothing changed;
 * `html` reaches React again only when the line becomes something else — a
 * heading, a quote — and then the caret may move, which is what a toolbar press
 * does anyway.
 *
 * Every handler it is given reads through a ref, because this component keeps
 * whichever one it was mounted with.
 */
const EditableLine = memo(
  function EditableLine({
    block,
    index,
    className,
    onFocusLine,
    onKeyDown,
    onPaste,
    onInput,
  }: {
    block: Block;
    index: number;
    className: string;
    onFocusLine: (index: number) => void;
    onKeyDown: (event: KeyboardEvent<HTMLDivElement>, index: number) => void;
    onPaste: (event: ClipboardEvent<HTMLDivElement>) => void;
    onInput: (id: string, html: string) => void;
  }) {
    return (
      <div
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="false"
        tabIndex={0}
        onFocus={() => onFocusLine(index)}
        onKeyDown={(event) => onKeyDown(event, index)}
        onPaste={onPaste}
        onInput={(event) => onInput(block.id, event.currentTarget.innerHTML)}
        data-block-id={block.id}
        dangerouslySetInnerHTML={{ __html: block.html }}
        className={className}
      />
    );
  },
  (before, after) =>
    before.block.id === after.block.id &&
    before.block.kind === after.block.kind &&
    before.index === after.index &&
    before.className === after.className,
);

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

  // The editable lines keep the handlers they were mounted with, so those read
  // the current blocks through here rather than through a closure.
  const latest = useRef(blocks);
  latest.current = blocks;
  const report = useRef(onChange);
  report.current = onChange;

  const onFocusLine = useCallback((index: number) => {
    focused.current = index;
  }, []);

  const lines = useRef<HTMLDivElement>(null);

  /**
   * Which line the caret belongs in once React has drawn the new list. Enter
   * and Backspace change how many lines there are, and the browser leaves the
   * caret wherever the old element was — so the line that should have it is
   * named here and claimed in the effect below.
   */
  const wanted = useRef<{ id: string; atEnd: boolean } | null>(null);

  useEffect(() => {
    const claim = wanted.current;
    if (claim === null) return;
    wanted.current = null;

    const line = lines.current?.querySelector<HTMLElement>(
      `[data-block-id="${claim.id}"]`,
    );
    if (line === null || line === undefined) return;

    line.focus();

    const range = document.createRange();
    range.selectNodeContents(line);
    range.collapse(!claim.atEnd);

    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  });

  const onInput = useCallback((id: string, html: string) => {
    report.current(
      latest.current.map((block) => (block.id === id ? { ...block, html } : block)),
    );
  }, []);

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
      // Plain text, so any address in it is still bare: it is turned into a
      // link here rather than through a button that asks for one. The same
      // walk as below decides what an href may be, so nothing reaches the
      // document that the server would not accept.
      const text = event.clipboardData.getData("text/plain");
      const linked = inlineToHtml(htmlToInline(linkedHtml(text)));
      document.execCommand("insertHTML", false, linked);
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
      const fresh = emptyBlock(kind);
      wanted.current = { id: fresh.id, atEnd: false };
      onChange([...blocks.slice(0, index + 1), fresh, ...blocks.slice(index + 1)]);
      return;
    }

    if (event.key === "Backspace" && blocks.length > 1) {
      const element = event.currentTarget;
      if (element.textContent?.length === 0) {
        event.preventDefault();
        // The caret goes to the end of the line above, where it would be if the
        // two had been one line all along — so holding Backspace keeps deleting
        // instead of stopping at every empty line.
        const before = blocks[index - 1] ?? blocks[index + 1];
        if (before !== undefined) wanted.current = { id: before.id, atEnd: true };
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

      <div ref={lines} className="mt-6 flex max-w-[68ch] flex-col gap-3">
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
            <EditableLine
              key={block.id}
              block={block}
              index={index}
              onFocusLine={onFocusLine}
              onKeyDown={onKeyDown}
              onPaste={onPaste}
              onInput={onInput}
              className={`min-h-[1.7em] outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ac ${BLOCK_CLASS[block.kind]}`}
            />
          ),
        )}
      </div>
    </>
  );
}

export const blocksInline = htmlToInline;
