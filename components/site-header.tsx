import Link from "next/link";

import { ThemeSwitcher } from "@/components/theme-switcher";
import { CategoryBar } from "@/components/category-bar";

const NAV_ITEMS = [
  { key: "home", label: "Home", href: "/" },
  { key: "archiv", label: "Archiv", href: "/archiv" },
  { key: "redaktion", label: "Redaktion", href: "/redaktion" },
  { key: "memes", label: "Memes", href: "/memes" },
  { key: "kontakt", label: "Kontakt", href: "/kontakt" },
] as const;

export type NavKey = (typeof NAV_ITEMS)[number]["key"];

const MOBILE_NAV_ID = "hauptnavigation";

type SiteHeaderProps = {
  current?: NavKey;
  showCategoryBar?: boolean;
  activeCategory?: string;
};

/**
 * There is no search button: the field lives on the archive, and "Archiv" is
 * already in the navigation, so a second control pointing at the same page only
 * competed with it.
 */
export function SiteHeader({
  current,
  showCategoryBar = false,
  activeCategory,
}: SiteHeaderProps) {
  const navLinks = NAV_ITEMS.map((item) => (
    <Link
      key={item.key}
      href={item.href}
      aria-current={item.key === current ? "page" : undefined}
      className={`inline-flex min-h-11 items-center transition-colors hover:text-tx md:min-h-0 ${
        item.key === current ? "text-tx" : "text-tm"
      }`}
    >
      <span
        className={
          item.key === current ? "shadow-[inset_0_-3px_0_var(--ac)]" : undefined
        }
      >
        {item.label}
      </span>
    </Link>
  ));

  return (
    <header className="border-b border-bd">
      {/* 3px, not the template's 14px: the 44px touch targets inside supply the
          rest of the row height, so raising this would overshoot it. */}
      <div className="flex items-center gap-[18px] px-[18px] py-[3px] md:gap-[30px] md:px-10 md:pt-[18px] md:pb-4">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center text-[18px] font-extrabold tracking-[-0.04em] text-ac md:min-h-0 md:text-2xl"
        >
          VOX AUDAX
        </Link>

        <nav
          aria-label="Hauptnavigation"
          className="hidden gap-[22px] text-sm font-bold md:flex"
        >
          {navLinks}
        </nav>

        <div className="ml-auto flex items-center gap-2 text-[12.5px] font-bold md:gap-3.5">
          <ThemeSwitcher />
          <a
            href={`#${MOBILE_NAV_ID}`}
            className="inline-flex min-h-11 items-center text-tm transition-colors hover:text-tx md:hidden"
          >
            Menü
          </a>
        </div>
      </div>

      <nav
        id={MOBILE_NAV_ID}
        aria-label="Hauptnavigation"
        className="flex gap-5 overflow-x-auto px-[18px] pb-3 text-sm font-bold whitespace-nowrap md:hidden"
      >
        {navLinks}
      </nav>

      {showCategoryBar ? <CategoryBar active={activeCategory} /> : null}
    </header>
  );
}
