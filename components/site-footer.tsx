import { ThemeSwitcher } from "@/components/theme-switcher";

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
            <a
              key={link.href}
              href={link.href}
              className="inline-flex min-h-11 items-center md:min-h-0"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>

      <div className="mx-[18px] mt-4 flex flex-col border-t border-bd pt-3.5 pb-[26px] text-[13px] md:mx-0 md:mt-0 md:flex-row md:items-baseline md:gap-3.5 md:px-10 md:pt-3.5">
        <span className="font-extrabold tracking-[-0.02em] text-tx">
          Built by{" "}
          <a href="https://levo-studio.com" className="py-[15px] text-ac">
            Levo Studio
          </a>
        </span>
        <span className="font-medium md:hidden">Danke an Julius.</span>
        <span className="hidden font-medium md:inline">
          Konzept, Design und Umsetzung — danke an Julius.
        </span>
        <div className="mt-4 md:mt-0 md:ml-auto">
          <ThemeSwitcher />
        </div>
      </div>
    </footer>
  );
}
