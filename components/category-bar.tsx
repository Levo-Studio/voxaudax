export const CATEGORIES = [
  { slug: "schulpolitik", label: "Schulpolitik" },
  { slug: "veranstaltungen", label: "Veranstaltungen" },
  { slug: "politik", label: "Politik" },
  { slug: "kultur", label: "Kultur" },
  { slug: "sport", label: "Sport" },
  { slug: "vermischtes", label: "Vermischtes" },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

/** A category is a filter on the archive, not a page of its own. */
export const categoryHref = (slug: CategorySlug) => `/archiv?kategorie=${slug}`;

/**
 * Scrolls horizontally below md because six pills cannot fit 375px and the
 * template's own mobile bar resorts to cutting the last label off mid-word.
 */
export function CategoryBar({ active }: { active?: CategorySlug }) {
  return (
    <nav
      aria-label="Kategorien"
      className="flex gap-[7px] overflow-x-auto px-[18px] pb-3.5 text-xs font-bold md:flex-wrap md:gap-2 md:overflow-x-visible md:px-10 md:text-[12.5px] md:font-semibold"
    >
      {CATEGORIES.map((category) => (
        <a
          key={category.slug}
          href={categoryHref(category.slug)}
          aria-current={category.slug === active ? "page" : undefined}
          className={`inline-flex min-h-11 items-center rounded-full px-[11px] whitespace-nowrap md:min-h-0 md:px-3 md:py-1.5 ${
            category.slug === active
              ? "bg-ac text-white"
              : "border border-bd text-tx"
          }`}
        >
          {category.label}
        </a>
      ))}
    </nav>
  );
}
