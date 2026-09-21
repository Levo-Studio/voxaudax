import type { Metadata } from "next";

import { DocumentPage, MissingDocument } from "@/components/document-page";
import { environment } from "@/lib/env";
import { pageBySlug } from "@/lib/queries";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Impressum",
  description: "Angaben nach §5 DDG zur Schülerzeitung Vox Audax.",
};

export default async function ImprintPage() {
  const page = await pageBySlug("impressum");

  return (
    <DocumentPage
      title={page?.title ?? "Impressum"}
      document={page?.body}
      missing={
        <MissingDocument
          what="Die Angaben nach §5 DDG nennen Menschen mit Namen und Anschrift."
          editorialEmail={environment().MAIL_TO_EDITORIAL}
        />
      }
      trailing={{ label: "Datenschutzerklärung →", href: "/datenschutz" }}
    />
  );
}
