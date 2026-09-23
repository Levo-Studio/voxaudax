import Link from "next/link";

import { MobileMenu } from "@/components/mobile-menu";
import { ThemeSwitcher } from "@/components/theme-switcher";

const NAV_ITEMS = [
  { key: "home", label: "Home", href: "/" },
  { key: "archiv", label: "Archiv", href: "/archiv" },
  { key: "redaktion", label: "Redaktion", href: "/redaktion" },
  { key: "memes", label: "Memes", href: "/memes" },
  { key: "kontakt", label: "Kontakt", href: "/kontakt" },
] as const;

export type NavKey = (typeof NAV_ITEMS)[number]["key"];

type SiteHeaderProps = {
  current?: NavKey;
};

/**
 * There is no search button: the field lives on the archive, and "Archiv" is
 * already in the navigation, so a second control pointing at the same page only
 * competed with it.
 *
 * On a phone the five destinations are behind the hamburger rather than in a
 * strip under the header. That strip stood on every page and scrolled sideways,
 * so it cost a row of screen before the first headline and hid its own last
 * entry.
 */
export function SiteHeader({
  current,
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
          <MobileMenu items={NAV_ITEMS} current={current} />
        </div>
      </div>
    </header>
  );
}
