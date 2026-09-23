"use server";

import { ARCHIVE_PAGE } from "@/lib/limits";
import { archivePage, type ArchiveFilters } from "@/lib/queries";

/**
 * The next page of the archive.
 *
 * It reads nothing that is not already public — `archivePage` asks only for
 * published articles whose moment has passed, the same condition the page
 * itself uses — so there is no session to check and none to take.
 *
 * Returns null rather than throwing: the reader already has twenty articles in
 * front of them, and an exception here would replace all of them with an error
 * page over a button that can simply be pressed again.
 */
export const moreArchiveAction = async (filters: ArchiveFilters, skip: number) => {
  try {
    return await archivePage(filters, skip, ARCHIVE_PAGE);
  } catch (cause) {
    console.error("error", "a further page of the archive could not be read", { cause });
    return null;
  }
};
