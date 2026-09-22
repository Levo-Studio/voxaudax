import type { Metadata } from "next";

import { DocumentPage, MissingDocument } from "@/components/document-page";
import { editorialAddress } from "@/lib/env";
import { alternates } from "@/lib/metadata";
import { orNoneAtBuildTime, pageBySlug } from "@/lib/queries";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Impressum",
  description: "Angaben nach §5 DDG zur Schülerzeitung Vox Audax.",
  alternates: alternates("/impressum"),
};

export default async function ImprintPage() {
  const page = await orNoneAtBuildTime(pageBySlug("impressum"), undefined);

  return (
    <DocumentPage
      title={page?.title ?? "Impressum"}
      document={page?.body}
      missing={
        <MissingDocument
          what="Die Angaben nach §5 DDG nennen Menschen mit Namen und Anschrift."
          editorialEmail={editorialAddress()}
        />
      }
      trailing={{ label: "Datenschutzerklärung →", href: "/datenschutz" }}
    />
  );
}
