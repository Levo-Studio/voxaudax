import "server-only";
import { revalidatePath } from "next/cache";

/**
 * Which public pages a change in the back office reaches.
 *
 * The public pages are rendered once and served from cache for five minutes,
 * which is right for readers and wrong for the person who just changed
 * something and goes to look. Each action says here what it touched, and the
 * pages that show it are rebuilt at once.
 *
 * Named in one place because the back office edits one thing and a reader sees
 * it in several: a sponsor is on the home page, an article is on four pages and
 * in two feeds. A list kept beside each action drifts the moment a second
 * action changes the same thing.
 */
export const refreshPublic = {
  sponsors: () => {
    revalidatePath("/");
  },

  memes: () => {
    revalidatePath("/memes");
  },

  /**
   * Every article page at once, rather than the one that changed: the slug is
   * not always at hand, an article appears on pages that name other articles,
   * and rebuilding twelve pages costs less than getting the one wrong.
   */
  articles: () => {
    revalidatePath("/");
    revalidatePath("/archiv");
    revalidatePath("/artikel/[slug]", "page");
    revalidatePath("/rss.xml");
    revalidatePath("/sitemap.xml");
  },

  editorial: () => {
    revalidatePath("/");
    revalidatePath("/redaktion");
    revalidatePath("/kontakt");
  },
};
