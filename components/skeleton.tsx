/**
 * What stands in a page's place while the database answers.
 *
 * Every public page streams: the header, the footer and the headings are in the
 * first response, and the part that needs a query follows. Without something in
 * that gap the page would jump from an empty frame to a full one; these are the
 * shapes it jumps from, drawn at the size of what replaces them so nothing
 * moves when it arrives.
 *
 * `aria-hidden` throughout, with one `role="status"` around each group: a
 * screen reader should hear "Wird geladen" once, not read twenty grey boxes.
 */

const Bar = ({
  className,
  style,
}: {
  className: string;
  style?: React.CSSProperties;
}) => (
  <span aria-hidden style={style} className={`block rounded-[5px] va-shimmer ${className}`} />
);

const Group = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div role="status" aria-live="polite" aria-busy="true">
    <span className="sr-only">{label}</span>
    {children}
  </div>
);

/** The lead article and the cards under it — screens 3a and 4a. */
export const HomeSkeleton = () => (
  <Group label="Die Startseite wird geladen">
    <div className="grid md:min-h-[404px] md:grid-cols-[1.15fr_1fr]">
      <div className="flex flex-col justify-between px-[18px] pb-[26px] md:px-11 md:py-12">
        <Bar className="hidden h-[26px] w-[130px] md:block" />
        <div>
          <Bar className="mt-2 h-[38px] w-full md:mt-[18px] md:h-[58px]" />
          <Bar className="mt-2.5 h-[38px] w-[85%] md:h-[58px]" />
          <Bar className="mt-3 h-[22px] w-full md:mt-[18px] md:max-w-[50ch]" />
          <Bar className="mt-2 h-[22px] w-[70%] md:max-w-[50ch]" />
        </div>
        <Bar className="mt-5 h-[18px] w-[190px]" />
      </div>
      <Bar className="aspect-[4/3] w-full rounded-none md:aspect-auto" />
    </div>

    <div className="grid border-t border-bd md:grid-cols-3">
      {[0, 1, 2].map((card) => (
        <div key={card} className="border-b border-bd px-[18px] py-6 last:border-b-0 md:border-r md:border-b-0 md:px-7 md:py-8">
          <Bar className="h-4 w-[110px]" />
          <Bar className="mt-3 h-[21px] w-full" />
          <Bar className="mt-2 h-[21px] w-[75%]" />
          <Bar className="mt-3.5 h-[17px] w-[140px]" />
        </div>
      ))}
    </div>
  </Group>
);

/** The archive: the search field and its filters, then the results under them. */
export const ArchiveSkeleton = () => (
  <Group label="Das Archiv wird geladen">
    <Bar className="mt-4 h-[46px] w-full rounded-[10px] md:mt-6" />
    <div className="mt-3 flex flex-wrap gap-2">
      {/* Four filters of unequal width, because that is what the words make
          them: Kategorie, Jahr, Autor, Zurücksetzen. */}
      {[112, 88, 128, 104].map((width) => (
        <Bar key={width} className="h-[34px] rounded-[9px]" style={{ width }} />
      ))}
    </div>
    <div className="mt-5 border-t border-bd md:mt-7">
      <ArticleListSkeleton rows={8} />
    </div>
  </Group>
);

/** A list of article rows — the archive and "Weiterlesen". */
export const ArticleListSkeleton = ({ rows = 6 }: { rows?: number }) => (
  <Group label="Artikel werden geladen">
    {Array.from({ length: rows }, (_, row) => (
      <div key={row} className="border-b border-bd px-[18px] py-[18px] md:px-10 md:py-5">
        <Bar className="h-[15px] w-[150px]" />
        <Bar className="mt-2.5 h-[23px] w-full md:max-w-[62ch]" />
        <Bar className="mt-2 h-[15px] w-[180px]" />
      </div>
    ))}
  </Group>
);

/** The editorial team, as pills on the homepage or cards on 9a. */
export const MembersSkeleton = ({ count = 6 }: { count?: number }) => (
  <Group label="Die Redaktion wird geladen">
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: count }, (_, pill) => (
        <Bar key={pill} className="h-[38px] w-[150px] rounded-[10px]" />
      ))}
    </div>
  </Group>
);

/** The meme wall — a grid of pictures whose heights are not known yet. */
export const MemeWallSkeleton = ({ count = 6 }: { count?: number }) => (
  <Group label="Die Galerie wird geladen">
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, tile) => (
        <Bar key={tile} className="aspect-[4/5] w-full rounded-xl" />
      ))}
    </div>
  </Group>
);

/** A written page: the heading, then the text. 5c and everything it serves. */
export const DocumentSkeleton = () => (
  <Group label="Die Seite wird geladen">
    <Bar className="h-[34px] w-[60%] md:h-[48px]" />
    <div className="mt-5 md:mt-7">
      <ProseSkeleton lines={10} />
    </div>
  </Group>
);

/** A page of running text — the article body, the legal pages. */
export const ProseSkeleton = ({ lines = 8 }: { lines?: number }) => (
  <Group label="Der Text wird geladen">
    {Array.from({ length: lines }, (_, line) => (
      <Bar
        key={line}
        className={`mt-3 h-[19px] ${line % 4 === 3 ? "w-[62%]" : "w-full"}`}
      />
    ))}
  </Group>
);
