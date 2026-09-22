import { Fragment, type ReactNode } from "react";

import type { TipTapDocument, TipTapNode } from "@/lib/content";
import { FIGURE_WORD, figureNumbers } from "@/lib/figures";

/**
 * The article as screen 3a and 3b's preview draw it. Everything the editor can
 * write has a case here, and a node type with no case renders nothing — the
 * document was already narrowed to the allowed types when it was stored, so a
 * fallback that guessed would only be guessing about a bug.
 */
const inline = (nodes: readonly TipTapNode[] | undefined): ReactNode =>
  (nodes ?? []).map((node, index) => {
    let rendered: ReactNode = node.text ?? "";

    for (const mark of node.marks ?? []) {
      if (mark.type === "bold") rendered = <strong className="font-bold">{rendered}</strong>;
      if (mark.type === "italic") rendered = <em>{rendered}</em>;
      if (mark.type === "link") {
        rendered = (
          <a className="text-ac underline underline-offset-2" href={String(mark.attrs?.href ?? "")}>
            {rendered}
          </a>
        );
      }
    }

    return <Fragment key={index}>{rendered}</Fragment>;
  });

const block = (node: TipTapNode, key: number, figure?: string | null): ReactNode => {
  if (node.type === "heading") {
    return node.attrs?.level === 3 ? (
      <h3 key={key} className="mt-6 text-xl font-extrabold tracking-[-0.03em]">
        {inline(node.content)}
      </h3>
    ) : (
      <h2 key={key} className="mt-[26px] text-2xl font-extrabold tracking-[-0.03em]">
        {inline(node.content)}
      </h2>
    );
  }

  if (node.type === "blockquote") {
    return (
      <blockquote
        key={key}
        className="mt-[22px] border-l-[3px] border-ac pl-[18px] text-[19px] leading-[1.55] font-semibold tracking-[-0.015em]"
      >
        {(node.content ?? []).map((inner, index) => (
          <Fragment key={index}>{inline(inner.content)}</Fragment>
        ))}
      </blockquote>
    );
  }

  if (node.type === "bulletList" || node.type === "orderedList") {
    const items = (node.content ?? []).map((item, index) => (
      <li key={index}>
        {(item.content ?? []).map((inner, position) => (
          <Fragment key={position}>{inline(inner.content)}</Fragment>
        ))}
      </li>
    ));

    return node.type === "bulletList" ? (
      <ul key={key} className="mt-4 list-disc pl-5 text-[17.5px] leading-[1.7] font-medium">
        {items}
      </ul>
    ) : (
      <ol key={key} className="mt-4 list-decimal pl-5 text-[17.5px] leading-[1.7] font-medium">
        {items}
      </ol>
    );
  }

  if (node.type === "horizontalRule") {
    return <hr key={key} className="mt-[22px] border-0 border-t border-bd" />;
  }

  if (node.type === "image") {
    const source = String(node.attrs?.src ?? "");
    const alt = String(node.attrs?.alt ?? "");
    return (
      <figure key={key} className="m-0 mt-[22px]">
        {/* The bytes come from the application's own image route, whose size is
            not known here; next/image would need one and would inline a guess. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={source} alt={alt} className="max-w-full rounded-[10px]" />
        {figure === null || figure === undefined ? null : (
          <figcaption className="mt-2 text-[12.5px] font-semibold text-tm">
            {FIGURE_WORD} {figure}
            {alt.length === 0 ? "" : ` · ${alt}`}
          </figcaption>
        )}
      </figure>
    );
  }

  return (
    <p key={key} className="mt-[22px] text-[17.5px] leading-[1.7] font-medium first:mt-0">
      {inline(node.content)}
    </p>
  );
};

/**
 * The same counting the editor does, over the document's own node types: a
 * level-2 heading opens a section, and a picture is the next number in it. Both
 * sides read `lib/figures`, so the caption under a picture here and the one in
 * the editor cannot drift apart.
 */
const asKinds = (nodes: readonly TipTapNode[]) =>
  nodes.map((node) => ({
    kind:
      node.type === "heading" && Number(node.attrs?.level ?? 0) === 2
        ? "heading2"
        : node.type,
  }));

export function ArticleBody({ document }: { document: TipTapDocument }) {
  const numbers = figureNumbers(asKinds(document.content));

  return (
    <div>
      {document.content.map((node, index) => block(node, index, numbers[index]))}
    </div>
  );
}
