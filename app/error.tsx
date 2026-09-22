"use client";

import { useEffect } from "react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

/**
 * Never drawn either, and built like the 404 beside it: same column, same type,
 * header and footer as on every public page. Without it a failed render falls
 * through to the framework's own page — white, unstyled, in English, with a
 * digest and no way back — which is what a reader of a German school paper saw
 * whenever the database was unreachable on a request-time path.
 *
 * `reset` re-renders the segment rather than reloading, which is the right
 * first offer: the usual cause here is one query that timed out, and a second
 * attempt a moment later often simply works.
 */
export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // The digest is all the reader is shown, so it has to be findable in the
    // log where the stack trace is: the server prints the same one beside it.
    console.error("error", "a public page could not be rendered", {
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <main className="max-w-[760px] flex-1 px-[18px] pt-[22px] pb-7 md:px-10 md:pt-11 md:pb-[52px]">
        <h1 className="text-[30px] leading-[1.02] font-extrabold tracking-[-0.04em] md:text-[46px] md:leading-none">
          Da ist etwas schiefgegangen
        </h1>
        <p className="mt-3 text-[17px] leading-[1.7] font-medium text-tm md:mt-4">
          Diese Seite ließ sich gerade nicht laden. Meistens hilft es, es in
          einem Moment noch einmal zu versuchen.
        </p>
        <div className="mt-5 flex flex-wrap gap-2.5 md:mt-6">
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-11 cursor-pointer items-center rounded-[10px] border-none bg-ac px-[18px] text-[13.5px] font-bold text-s1 md:min-h-0 md:py-[11px]"
          >
            Noch einmal versuchen
          </button>
          {/* A plain anchor, like every other link on the public site: the
              pages are documents, not an application the router keeps alive. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/"
            className="inline-flex min-h-11 items-center rounded-[10px] border border-bd px-[18px] text-[13.5px] font-bold md:min-h-0 md:py-[11px]"
          >
            Zur Startseite
          </a>
        </div>
        {error.digest === undefined ? null : (
          <p className="mt-5 text-[12.5px] font-medium text-tm">
            Kennung für die Redaktion: {error.digest}
          </p>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
