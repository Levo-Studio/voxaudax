import {
  coverGridOverlay,
  resolveCoverColor,
  type CoverColorId,
} from "@/lib/cover";
import type { CoverPhotograph } from "@/lib/queries";
import { imageHref } from "@/lib/routes";

export type ArticleCoverVariant = "hero" | "article" | "card" | "related";

type VariantStyles = {
  panel: string;
  eyebrow: string;
  word: string;
  line: string;
  /**
   * A word set across the full width never wraps. In the square a phone gets
   * it has to: 4a breaks "MAI 2027" and "40° / 800" over two lines rather than
   * letting either run out of the tile.
   */
  wrap: string;
  /**
   * The template draws the faint grid on the full-bleed covers only. The three
   * cards on the homepage are flat panels, so a card that drew one would be the
   * implementation inventing texture the design does not have.
   */
  hasGrid: boolean;
  /** Cards put the category at the top and the word at the bottom. */
  eyebrowInFlow: boolean;
};

/**
 * 88px is the size the template draws at its own width, and the word never
 * wraps. Holding it fixed makes a seven-letter word wider than the column the
 * hero gets at 768px, which pushes the whole page sideways — so it is tied to
 * the viewport and reaches exactly 88px where the template measured it.
 */
const WIDE_WORD =
  "text-[46px] leading-[0.9] tracking-[-0.05em] md:text-[clamp(46px,6.6vw,88px)] md:tracking-[-0.055em]";

/**
 * The grid line size is handed down as a custom property because it changes at
 * the md breakpoint and background-size cannot be written twice in one inline
 * style.
 */
const VARIANTS: Record<ArticleCoverVariant, VariantStyles> = {
  hero: {
    panel:
      "aspect-[4/3] rounded-[14px] p-5 [--cover-grid:44px] md:aspect-auto md:h-full md:rounded-none md:p-[34px] md:[--cover-grid:58px]",
    eyebrow:
      "top-4 left-5 text-[10px] tracking-[0.16em] md:top-[22px] md:left-[34px] md:text-[11px]",
    word: WIDE_WORD,
    line: "mt-2.5 text-[13px] md:mt-3.5 md:text-sm",
    wrap: "whitespace-nowrap",
    hasGrid: true,
    eyebrowInFlow: false,
  },
  article: {
    panel:
      "aspect-[4/3] p-5 [--cover-grid:44px] md:aspect-[21/8] md:px-10 md:py-[34px] md:[--cover-grid:58px]",
    eyebrow:
      "top-4 left-5 text-[10px] tracking-[0.16em] md:top-[26px] md:left-10 md:text-[11px]",
    word: WIDE_WORD,
    line: "mt-2.5 text-[13px] md:mt-3 md:text-sm",
    wrap: "whitespace-nowrap",
    hasGrid: true,
    eyebrowInFlow: false,
  },
  /**
   * One tile in two shapes: the square a phone sets beside the headline in 4a,
   * and the 16/9 panel above it in 3a. The category rides inside the panel
   * only on the wide one — on the phone it stands over the headline instead.
   */
  card: {
    panel:
      "aspect-square justify-end rounded-[10px] p-[11px] md:aspect-[16/9] md:justify-between md:rounded-[10px] md:p-5",
    eyebrow: "hidden md:block text-[10.5px] tracking-[0.14em]",
    word: "text-base leading-none tracking-[-0.035em] md:text-[26px]",
    line: "mt-2.5 text-[13px]",
    wrap: "whitespace-normal md:whitespace-nowrap",
    hasGrid: false,
    eyebrowInFlow: true,
  },
  related: {
    panel:
      "aspect-square justify-end rounded-[9px] p-2.5 md:aspect-[16/9] md:rounded-[10px] md:justify-between md:p-[18px]",
    eyebrow: "hidden md:block text-[10.5px] tracking-[0.14em]",
    word: "text-sm leading-none tracking-[-0.03em] md:text-2xl md:tracking-[-0.035em]",
    line: "mt-2.5 text-[13px]",
    wrap: "whitespace-normal md:whitespace-nowrap",
    hasGrid: false,
    eyebrowInFlow: true,
  },
};

/**
 * The template writes the grid as white at 14%, which was right while every
 * cover sat on the one dark violet. The palette made the panel variable, so the
 * lines follow the ink instead: on Signalgelb and Bernstein a white grid is
 * 1.03:1 against the panel and simply is not there.
 *
 * The same template faded the category and the cover line to .85 and .82, and
 * for the same reason that is gone: the ink is chosen per panel to clear 4.5:1
 * exactly, so any fade at all drops it under. Both are small type — the
 * category is 10px — and `pnpm check:contrast` now measures what composites.
 */
type ArticleCoverProps = {
  /** Feeds the hash that picks the colour when the editor left it alone. */
  title: string;
  colorId?: CoverColorId | null;
  eyebrow: string;
  word: string;
  line?: string;
  variant: ArticleCoverVariant;
  /**
   * The editor's own photograph. It replaces the whole generated cover rather
   * than sitting behind it: the two lines of type are chosen for a flat panel
   * and are not legible over a picture.
   */
  image?: CoverPhotograph | null;
};

export function ArticleCover({
  title,
  colorId,
  eyebrow,
  word,
  line,
  variant,
  image,
}: ArticleCoverProps) {
  const color = resolveCoverColor(title, colorId);
  const styles = VARIANTS[variant];
  const showLine = line !== undefined && line.length > 0 && !styles.eyebrowInFlow;

  if (image != null) {
    return (
      <div className={`relative overflow-hidden bg-s2 ${styles.panel}`}>
        {/* Not next/image: the bytes come from this application's own route,
            and an optimiser in front of it would only add a second copy. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageHref(image.id)}
          alt={image.alt}
          width={image.width}
          height={image.height}
          className="absolute inset-0 size-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`relative flex flex-col overflow-hidden ${styles.eyebrowInFlow ? "" : "justify-end"} ${styles.panel}`}
      style={{ background: color.value, color: color.text }}
    >
      {styles.hasGrid ? (
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage: coverGridOverlay(color.text),
            backgroundSize: "var(--cover-grid) 100%, 100% var(--cover-grid)",
          }}
        />
      ) : null}
      <span
        className={`font-bold uppercase ${styles.eyebrowInFlow ? "relative" : "absolute"} ${styles.eyebrow}`}
      >
        {eyebrow}
      </span>
      <span
        className={`relative font-extrabold ${styles.wrap} ${styles.word}`}
      >
        {word}
      </span>
      {showLine ? (
        <span className={`relative font-semibold ${styles.line}`}>
          {line}
        </span>
      ) : null}
    </div>
  );
}
