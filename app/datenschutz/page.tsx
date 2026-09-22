import type { Metadata } from "next";

import { Suspense } from "react";

import { DocumentBody, DocumentPage, MissingDocument } from "@/components/document-page";
import { DocumentSkeleton } from "@/components/skeleton";
import { editorialAddress } from "@/lib/env";
import { alternates } from "@/lib/metadata";
import { orNoneAtBuildTime, pageBySlug } from "@/lib/queries";

/**
 * Rendered for every request. Prerendering built this page inside an image with
 * no route to the database, so what got baked in was its empty state — the note
 * on `app/page.tsx` has the whole of it. The shell goes out first and the query
 * follows into a skeleton.
 */
export const dynamic = "force-dynamic";

/**
 * The template never drew this page, so it is built like the imprint in 5c —
 * same column, same sections, same type. The text is not invented here: a
 * Datenschutzerklärung states what an operator actually does with data and is
 * binding, so the page exists and says it is empty until the operator fills it.
 */
export const generateMetadata = async (): Promise<Metadata> => {
  const page = await orNoneAtBuildTime(pageBySlug("datenschutz"), undefined);

  return {
    title: "Datenschutz",
    description: "Datenschutzerklärung der Schülerzeitung Vox Audax.",
    robots: page === undefined ? { index: false, follow: true } : undefined,
    alternates: alternates("/datenschutz"),
  };
};

export default function PrivacyPage() {
  return (
    <DocumentPage trailing={{ label: "Impressum →", href: "/impressum" }}>
      <Suspense fallback={<DocumentSkeleton />}>
        <PrivacyBody />
      </Suspense>
    </DocumentPage>
  );
}

async function PrivacyBody() {
  const page = await orNoneAtBuildTime(pageBySlug("datenschutz"), undefined);

  return (
    <DocumentBody
      title={page?.title ?? "Datenschutz"}
      document={page?.body}
      missing={
        <MissingDocument
          what="Eine Datenschutzerklärung ist eine rechtsverbindliche Erklärung darüber, was mit den Daten der Leserinnen und Leser geschieht, und kann deshalb nicht aus der Anwendung heraus erzeugt werden."
          editorialEmail={editorialAddress()}
        />
      }
    />
  );
}
