import Link from "next/link";
import { articleCategories } from "@/lib/queries";
import { archiveHref } from "@/lib/routes";

/**
 * The six categories live in the `categories` table, which is also what the
 * archive's filter menu reads and what an article is joined to. A copy of them
 * here was a second place to change when the editors add a seventh — so the bar
 * asks for them, and the request-level cache makes it the same read the archive
 * already does.
 */

/**
 * Scrolls horizontally below md because six pills cannot fit 375px and the
 * template's own mobile bar resorts to cutting the last label off mid-word.
 */
export async function CategoryBar({ active }: { active?: string }) {
  const categories = await articleCategories();

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
