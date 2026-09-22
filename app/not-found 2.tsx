import type { Metadata } from "next";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Seite nicht gefunden",
  robots: { index: false, follow: true },
};

/**
 * Never drawn. Header and footer as on every public page, one sentence, and
 * the two ways on that make sense here: the front page and the archive, where
 * a moved article can actually be found again.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <main className="max-w-[760px] flex-1 px-[18px] pt-[22px] pb-7 md:px-10 md:pt-11 md:pb-[52px]">
        <h1 className="text-[30px] leading-[1.02] font-extrabold tracking-[-0.04em] md:text-[46px] md:leading-none">
          Nicht gefunden
        </h1>
        <p className="mt-3 text-[17px] leading-[1.7] font-medium text-tm md:mt-4">
          Diese Seite gibt es nicht — vielleicht ist der Beitrag umbenannt
          worden oder die Adresse hat sich verschrieben.
        </p>
        <div className="mt-5 flex flex-wrap gap-2.5 md:mt-6">
          {/* A plain anchor, like every other link on the public site: the
              pages are documents, not an application the router keeps alive. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/"
            className="inline-flex min-h-11 items-center rounded-[10px] bg-ac px-[18px] text-[13.5px] font-bold text-s1 md:min-h-0 md:py-[11px]"
          >
            Zur Startseite
          </a>
          <a
            href="/archiv"
            className="inline-flex min-h-11 items-center rounded-[10px] border border-bd px-[18px] text-[13.5px] font-bold md:min-h-0 md:py-[11px]"
          >
            Im Archiv suchen
          </a>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
