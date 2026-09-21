import type { Metadata } from "next";

import { DocumentPage, MissingDocument } from "@/components/document-page";
import { environment } from "@/lib/env";
import { pageBySlug } from "@/lib/queries";

export const revalidate = 300;

/**
 * The template never drew this page, so it is built like the imprint in 5c —
 * same column, same sections, same type. The text is not invented here: a
 * Datenschutzerklärung states what an operator actually does with data and is
 * binding, so the page exists and says it is empty until the operator fills it.
 */
export const generateMetadata = async (): Promise<Metadata> => {
  const page = await pageBySlug("datenschutz");

  return {
    title: "Datenschutz",
    description: "Datenschutzerklärung der Schülerzeitung Vox Audax.",
    robots: page === undefined ? { index: false, follow: true } : undefined,
  };
};

export default async function PrivacyPage() {
  const page = await pageBySlug("datenschutz");

  return (
    <DocumentPage
      title={page?.title ?? "Datenschutz"}
      document={page?.body}
      missing={
        <MissingDocument
          what="Eine Datenschutzerklärung ist eine rechtsverbindliche Erklärung darüber, was mit den Daten der Leserinnen und Leser geschieht, und kann deshalb nicht aus der Anwendung heraus erzeugt werden."
          editorialEmail={environment().MAIL_TO_EDITORIAL}
        />
      }
      trailing={{ label: "Impressum →", href: "/impressum" }}
    />
  );
}
