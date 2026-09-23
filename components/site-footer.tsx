import Link from "next/link";

import { SOURCE_URL, outward } from "@/lib/outward";

const LEGAL_LINKS = [
  { label: "Impressum", href: "/impressum" },
  { label: "Datenschutz", href: "/datenschutz" },
  { label: "RSS", href: "/rss.xml" },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-bd text-xs font-semibold text-tm md:text-[12.5px]">
      <div className="flex flex-col px-[18px] pt-5 md:flex-row md:items-baseline md:gap-5 md:px-10 md:pt-6 md:pb-5">
        <span className="text-sm font-extrabold tracking-[-0.03em] text-tx">
          VOX AUDAX
        </span>
        <span className="mt-1 font-medium md:mt-0">
          Schülerzeitung des Uhland-Gymnasiums
        </span>
        <nav
          aria-label="Rechtliches"
          className="mt-3 flex gap-4 md:mt-0 md:ml-auto md:gap-[18px]"
        >
          {LEGAL_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex min-h-11 items-center transition-colors hover:text-tx md:min-h-0"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="mx-[18px] mt-4 flex flex-col border-t border-bd pt-3.5 pb-[26px] text-[13px] md:mx-0 md:mt-0 md:flex-row md:items-baseline md:gap-3.5 md:px-10 md:pt-3.5">
        <span className="font-extrabold tracking-[-0.02em] text-tx">
          Built by{" "}
          <a
            href="https://levo-studio.com"
            {...outward("https://levo-studio.com")}
            className="py-[15px] text-ac transition-opacity hover:opacity-70"
          >
            Levo Studio
          </a>
        </span>
        <span className="font-medium md:hidden">Danke an Julius.</span>
        <span className="hidden font-medium md:inline">
          Konzept, Design und Umsetzung — danke an Julius.
        </span>

        {/* The whole newspaper is open, so it says where. Not in the legal nav
            above: that row is Impressum, Datenschutz and the feed, and a
            source link is none of the three. `rel="me"` because this is the
            project's own repository and not a citation. */}
        <a
          href={SOURCE_URL}
          target="_blank"
          // `me` says this repository is the project's own, not a citation.
          rel="me noopener noreferrer"
          className="mt-2 inline-flex min-h-11 items-center font-medium transition-colors hover:text-tx md:mt-0 md:ml-auto md:min-h-0"
        >
          Quelltext auf GitHub
        </a>
      </div>
    </footer>
  );
}
