import Link from "next/link";
import { publishedCategories } from "@/lib/queries";
import { archiveHref } from "@/lib/routes";

/**
 * The bar shows the categories articles have actually been published in, read
 * from the table an article is joined to — so a category the editors add shows
 * up as soon as the first article in it goes live, and one nobody has written
 * in yet does not offer a chip that leads to an empty archive. The
 * request-level cache makes this the same read the archive's filter does.
 */

/**
 * Scrolls horizontally below md because six pills cannot fit 375px and the
 * template's own mobile bar resorts to cutting the last label off mid-word.
 */
export async function CategoryBar({ active }: { active?: string }) {
  const categories = await publishedCategories();

  return (
    <nav
      aria-label="Kategorien"
      className="flex gap-[7px] overflow-x-auto px-[18px] pb-3.5 text-xs font-bold md:flex-wrap md:gap-2 md:overflow-x-visible md:px-10 md:text-[12.5px] md:font-semibold"
    >
      {categories.map((category) => (
        <Link
          key={category.slug}
          href={archiveHref({ category: category.slug })}
          aria-current={category.slug === active ? "page" : undefined}
          className={`inline-flex min-h-11 items-center rounded-full px-[11px] whitespace-nowrap md:min-h-0 md:px-3 md:py-1.5 ${
            category.slug === active
              ? "bg-ac text-s1"
              : "border border-bd text-tx"
          }`}
        >
          {category.name}
        </Link>
      ))}
    </nav>
  );
}
