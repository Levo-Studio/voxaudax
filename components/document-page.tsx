import { DocumentProse } from "@/components/prose";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import type { TipTapDocument } from "@/lib/content";

/**
 * The narrow reading column of 5c, which the imprint and the privacy statement
 * share. Both are editorial text in the `pages` table, so changing them is an
 * edit and not a deploy.
 */
export function DocumentPage({
  title,
  document,
  missing,
  trailing,
}: {
  title: string;
  document?: TipTapDocument;
  missing: React.ReactNode;
  trailing: { label: string; href: string };
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <main className="max-w-[760px] flex-1 px-[18px] pt-[22px] pb-7 md:px-10 md:pt-11 md:pb-[52px]">
        <h1 className="text-[30px] leading-[1.02] font-extrabold tracking-[-0.04em] md:text-[46px] md:leading-none">
          {title}
        </h1>

        {document === undefined ? missing : <DocumentProse document={document} />}

        <a
          href={trailing.href}
          className="mt-4 inline-flex min-h-11 items-center text-[13.5px] font-bold text-ac md:mt-6 md:min-h-0"
        >
          {trailing.label}
        </a>
      </main>

      <SiteFooter />
    </div>
  );
}

/**
 * What stands in for a page nobody has written yet. It says plainly that the
 * text is missing instead of dressing the gap up as content, because the two
 * documents this shell serves are legal statements: an invented one would be
 * worse than none.
 */
export function MissingDocument({
  what,
  editorialEmail,
}: {
  what: string;
  editorialEmail: string;
}) {
  return (
    <div className="mt-8 rounded-xl border border-dashed border-bd p-5 md:p-6">
      <p className="text-[17px] leading-[1.7] font-semibold">
        Für diese Seite liegt noch kein Text vor.
      </p>
      <p className="mt-2.5 text-[17px] leading-[1.7] font-medium text-tm">
        {what} Die Redaktion trägt den Text im Redaktionssystem unter{" "}
        <span className="font-mono text-[15px]">pages</span> nach; bis dahin
        steht hier absichtlich nichts. Fragen dazu beantwortet{" "}
        <a
          href={`mailto:${editorialEmail}`}
          className="py-[15px] font-bold text-ac"
        >
          {editorialEmail}
        </a>
        .
      </p>
    </div>
  );
}
