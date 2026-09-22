import {
  ARCHIVE_CEILING,
  FEED_LENGTH,
  HOMEPAGE_ARTICLES,
  HOMEPAGE_MEMBERS,
  MEME_PAGE_SIZE,
  RELATED_COUNT,
} from "@/lib/limits";

/**
 * Where a published article actually turns up, and in what order.
 *
 * Nobody writing here can read the queries, and the answer is not guessable: a
 * piece can be published, correct and nowhere in sight because eleven newer
 * ones are in front of it. Folded away rather than standing open — it is read
 * once, when somebody wonders, and never again.
 *
 * The numbers come from `lib/limits`, the same module the queries read, so this
 * cannot fall out of step with what the pages do. Typed a second time they
 * would drift, and an explanation that drifts is worse than none: somebody
 * counts on it and is wrong.
 */
const PLACES: ReadonlyArray<{ where: string; what: string }> = [
  {
    where: "Startseite",
    what: `Die ${HOMEPAGE_ARTICLES} neuesten Artikel: einer groß oben, drei als Karten, der Rest als Zeilen. Was älter ist, steht im Archiv.`,
  },
  {
    where: "Archiv",
    what: `Alles Veröffentlichte, das Neueste zuerst, bis zu ${ARCHIVE_CEILING} Stück. Suche, Kategorie, Jahr und Autor schränken ein, ändern aber die Reihenfolge nicht.`,
  },
  {
    where: "Weiterlesen",
    what: `${RELATED_COUNT} unter jedem Artikel — zuerst aus derselben Kategorie, dann die neuesten.`,
  },
  {
    where: "RSS-Feed",
    what: `Die ${FEED_LENGTH} neuesten Artikel.`,
  },
  {
    where: "Redaktion auf der Startseite",
    what: `${HOMEPAGE_MEMBERS} Namen, danach eine Pille „+ N weitere“ zur Redaktionsseite. Wer auf „ehemalig“ steht, ist nicht dabei.`,
  },
  {
    where: "Meme-Wand",
    what: `${MEME_PAGE_SIZE} je Seite, das Neueste zuerst.`,
  },
];

export function PlacementNote() {
  return (
    <details className="rounded-xl border border-bd bg-s1">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-[12.5px] font-bold text-tm transition-colors hover:text-tx md:px-[22px] [&::-webkit-details-marker]:hidden">
        Wo ein Artikel erscheint — und in welcher Reihenfolge
        <span aria-hidden className="ml-auto text-[10px] transition-transform [details[open]_&]:rotate-180">
          ▾
        </span>
      </summary>

      <dl className="border-t border-bd px-4 py-3.5 md:px-[22px]">
        {PLACES.map((place) => (
          <div key={place.where} className="flex flex-col gap-0.5 py-1.5 md:flex-row md:gap-4 md:py-[7px]">
            <dt className="text-[12.5px] font-bold md:w-[210px] md:flex-none">{place.where}</dt>
            <dd className="m-0 text-[12.5px] leading-[1.55] font-medium text-tm md:max-w-[62ch]">
              {place.what}
            </dd>
          </div>
        ))}

        <p className="mt-2.5 border-t border-bd pt-2.5 text-[12px] leading-[1.55] font-medium text-tm md:max-w-[62ch]">
          „Veröffentlicht“ heißt zweierlei: der Status steht auf veröffentlicht{" "}
          <strong className="font-bold text-tx">und</strong> der Zeitpunkt ist erreicht. Ein
          Artikel mit einem Datum in der Zukunft trägt den Status schon, ist aber bis dahin
          für niemanden zu sehen — auch nicht im Archiv oder im Feed.
        </p>
      </dl>
    </details>
  );
}
