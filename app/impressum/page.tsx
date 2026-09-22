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

export const metadata: Metadata = {
  title: "Impressum",
  description: "Angaben nach §5 DDG zur Schülerzeitung Vox Audax.",
  alternates: alternates("/impressum"),
};

export default function ImprintPage() {
  return (
    <DocumentPage trailing={{ label: "Datenschutzerklärung →", href: "/datenschutz" }}>
      <Suspense fallback={<DocumentSkeleton />}>
        <ImprintBody />
      </Suspense>
    </DocumentPage>
  );
}

async function ImprintBody() {
  const page = await orNoneAtBuildTime(pageBySlug("impressum"), undefined);

  return (
    <DocumentBody
      title={page?.title ?? "Impressum"}
      document={page?.body}
      missing={
        <MissingDocument
          what="Die Angaben nach §5 DDG nennen Menschen mit Namen und Anschrift."
          editorialEmail={editorialAddress()}
        />
      }
    />
  );
}
