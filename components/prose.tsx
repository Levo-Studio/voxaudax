import { Fragment, type ReactNode } from "react";

import type { TipTapDocument, TipTapNode } from "@/lib/content";
import { safeHref } from "@/lib/links";

/**
 * Renders what the editor stores. Two shapes of prose exist on the public site
 * and they are not variations of one stylesheet: an article (13a) reads as a
 * newspaper column, a legal page (5c) as a register of labelled sections.
 */

const attribute = (
  attrs: Readonly<Record<string, unknown>> | undefined,
  key: string,
) => {
  const value = attrs?.[key];
  return typeof value === "string" ? value : undefined;
};

const headingLevel = (node: TipTapNode) => {
  const level = node.attrs?.level;
  return typeof level === "number" ? level : 2;
};

/**
 * A link the editor wrote points anywhere, so it is opened in the same tab and
 * carries no referrer of its own beyond what the origin policy already sends —
 * and only if `safeHref` recognises the address as one a link may lead to.
 */
const withMarks = (node: TipTapNode, text: ReactNode): ReactNode =>
  (node.marks ?? []).reduce<ReactNode>((wrapped, mark) => {
    if (mark.type === "bold") return <strong className="font-extrabold">{wrapped}</strong>;
    if (mark.type === "italic") return <em>{wrapped}</em>;
    if (mark.type === "code")
      return <code className="font-mono text-[0.9em]">{wrapped}</code>;
    if (mark.type === "link") {
      const href = safeHref(attribute(mark.attrs, "href"));
      return href === undefined ? (
        wrapped
      ) : (
        <a href={href} className="text-ac underline underline-offset-2">
          {wrapped}
        </a>
      );
    }
    return wrapped;
  }, text);

const inline = (nodes: readonly TipTapNode[] | undefined): ReactNode =>
  (nodes ?? []).map((node, index) => (
    <Fragment key={index}>
      {node.type === "hardBreak" ? (
        <br />
      ) : (
        withMarks(node, node.text ?? inline(node.content))
      )}
    </Fragment>
  ));

/**
 * One node's text with its marks, for a page that sets the type itself — the
 * editorial page styles its introduction and its closing note differently from
 * both an article and a legal register.
 */
export const Inline = ({ node }: { node: TipTapNode }) => (
  <>{inline(node.content)}</>
);

const listItems = (node: TipTapNode) =>
  (node.content ?? []).map((item, index) => (
    <li key={index} className="mt-1.5">
      {(item.content ?? []).map((child, childIndex) => (
        <Fragment key={childIndex}>{inline(child.content)}</Fragment>
      ))}
    </li>
  ));

/**
 * A quotation is a paragraph of speech and, usually, a paragraph naming who
 * said it. 13a sets the second one as the attribution line under the quote.
 */
const Quotation = ({ node }: { node: TipTapNode }) => {
  const [speech, ...attribution] = node.content ?? [];

  return (
    <blockquote className="mt-[22px] rounded-r-xl border-l-4 border-ac bg-s2 px-[18px] py-4 md:mt-[30px] md:px-6 md:py-5">
      <p className="text-[18px] leading-[1.5] font-bold tracking-[-0.02em] md:text-[21px]">
        {inline(speech?.content)}
      </p>
      {attribution.map((line, index) => (
        <p
          key={index}
          className="mt-2 text-xs font-bold text-tm md:mt-2.5 md:text-[12.5px]"
        >
          {inline(line.content)}
        </p>
      ))}
    </blockquote>
  );
};

const ArticleBlock = ({
  node,
  isLead,
}: {
  node: TipTapNode;
  isLead: boolean;
}) => {
  if (node.type === "heading") {
    return headingLevel(node) >= 3 ? (
      <h3 className="mt-[26px] text-[19px] font-extrabold tracking-[-0.025em] md:mt-[30px] md:text-[21px]">
        {inline(node.content)}
      </h3>
    ) : (
      <h2 className="mt-[26px] text-[23px] leading-[1.16] font-extrabold tracking-[-0.03em] md:mt-[34px] md:text-[28px] md:leading-[1.15] md:tracking-[-0.032em]">
        {inline(node.content)}
      </h2>
    );
  }

  if (node.type === "bulletList") {
    return (
      <ul className="mt-3 list-disc pl-5 text-[17px] leading-[1.72] font-medium md:mt-3.5 md:pl-[22px] md:text-[18px]">
        {listItems(node)}
      </ul>
    );
  }

  if (node.type === "blockquote") return <Quotation node={node} />;

  // The opening paragraph carries the reader in and is set a step larger.
  return (
    <p
      className={`text-[17px] leading-[1.72] font-medium md:text-[18px] ${
        isLead ? "md:text-[19px]" : "mt-4"
      }`}
    >
      {inline(node.content)}
    </p>
  );
};

/**
 * 13a's label reads "Fließtext auf 65 Zeichen" while its markup sets no
 * maximum. The label wins: a line of 140 characters is not a newspaper column.
 */
export const ArticleProse = ({ document }: { document: TipTapDocument }) => (
  <div>
    {document.content.map((node, index) => (
      <ArticleBlock key={index} node={node} isLead={index === 0} />
    ))}
  </div>
);

type Section = { heading?: TipTapNode; body: TipTapNode[] };

/** 5c gives every heading its own ruled section; a run of text opens one. */
const intoSections = (document: TipTapDocument) =>
  document.content.reduce<Section[]>((sections, node) => {
    if (node.type === "heading" || sections.length === 0) {
      return [...sections, node.type === "heading" ? { heading: node, body: [] } : { body: [node] }];
    }

    const previous = sections[sections.length - 1];
    return [...sections.slice(0, -1), { ...previous, body: [...previous.body, node] }];
  }, []);

const DocumentBlock = ({ node }: { node: TipTapNode }) => {
  if (node.type === "bulletList") {
    return (
      <ul className="mt-2.5 list-disc pl-5 text-[17px] leading-[1.7] font-medium">
        {listItems(node)}
      </ul>
    );
  }

  if (node.type === "blockquote") return <Quotation node={node} />;

  return (
    <p className="mt-2.5 text-[17px] leading-[1.7] font-medium">
      {inline(node.content)}
    </p>
  );
};

export const DocumentProse = ({ document }: { document: TipTapDocument }) => {
  const sections = intoSections(document);

  return (
    <div className="mt-8 flex flex-col">
      {sections.map((section, index) => (
        <section
          key={index}
          className={`border-t border-bd py-5 ${
            index === sections.length - 1 ? "border-b" : ""
          }`}
        >
          {section.heading === undefined ? null : (
            <h2 className="text-[11px] font-bold tracking-[0.12em] text-tm uppercase">
              {inline(section.heading.content)}
            </h2>
          )}
          {section.body.map((node, bodyIndex) => (
            <DocumentBlock key={bodyIndex} node={node} />
          ))}
        </section>
      ))}
    </div>
  );
};
