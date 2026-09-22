export type Supporter = {
  name: string;
  initials: string;
  url: string | null;
  logoImageId: string | null;
  logoAlt: string | null;
};

/**
 * Screen 6b is explicit: with nothing active the section is not rendered at
 * all — no empty frame, no placeholder row, no leftover spacing. Returning
 * nothing from here is what makes that true, because the <section> and its
 * margins live inside the component rather than around it.
 */
export function Supporters({ supporters }: { supporters: readonly Supporter[] }) {
  if (supporters.length === 0) return null;

  return (
    <section
      aria-label="Unterstützer"
      className="border-t border-bd px-[18px] py-5 md:px-10 md:pt-[26px] md:pb-[30px]"
    >
      <div className="flex items-baseline gap-3">
        <h2 className="text-[11px] font-bold tracking-[0.14em] text-tm uppercase md:text-xs">
          Unterstützt durch
        </h2>
        <span className="hidden text-xs font-medium text-tm md:inline">
          Druck, Material und Technik dieser Ausgabe
        </span>
      </div>

      <div className="mt-3 flex flex-col gap-[9px] md:mt-4 md:flex-row md:flex-wrap md:gap-3">
        {supporters.map((supporter) => {
          /**
           * The same box either way — 6b draws one tile, and a logo goes inside
           * it rather than in place of it. `object-contain` keeps a wide
           * wordmark and a square emblem both whole; the sunken background
           * stands behind a picture with no transparency of its own.
           *
           * The initials are what a supporter has before a logo is uploaded and
           * what stays when the upload is turned down, so they are the fallback
           * and not a second design.
           */
          const tileClass =
            "size-[34px] flex-none rounded-[9px] border border-bd bg-s2 md:size-[38px]";

          const tile = (
            <>
              {supporter.logoImageId === null ? (
                <span
                  className={`${tileClass} grid place-items-center text-[11px] font-extrabold tracking-[-0.02em] text-tm md:text-xs`}
                >
                  {supporter.initials}
                </span>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/bild/${supporter.logoImageId}`}
                  alt={supporter.logoAlt ?? supporter.name}
                  loading="lazy"
                  decoding="async"
                  className={`${tileClass} object-contain p-1`}
                />
              )}
              <span>
                <span className="block text-sm font-bold tracking-[-0.02em] md:text-[14.5px]">
                  {supporter.name}
                </span>
              </span>
            </>
          );

          const shared =
            "flex items-center gap-[11px] rounded-xl border border-bd py-2.5 pr-3.5 pl-2.5 md:gap-3 md:py-3 md:pr-[18px] md:pl-3";

          return supporter.url === null ? (
            <span key={supporter.name} className={shared}>
              {tile}
            </span>
          ) : (
            <a
              key={supporter.name}
              href={supporter.url}
              rel="nofollow sponsored noopener"
              className={shared}
            >
              {tile}
            </a>
          );
        })}
      </div>

      {/* Paid placement has to say so, and it says so wherever it appears —
          4a crops the sentence off, which a phone screen may not do here. */}
      <p className="mt-3.5 text-xs font-medium text-tm">
        Bezahlte Platzierung, redaktionell unabhängig. Die Redaktion entscheidet
        allein über Inhalte.
      </p>
    </section>
  );
}
