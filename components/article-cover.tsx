import { resolveCoverColor, type CoverColorId } from "@/lib/cover";

export type ArticleCoverVariant = "hero" | "article" | "card";

type VariantStyles = {
  panel: string;
  eyebrow: string;
  word: string;
  line: string;
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
 * The grid line size is handed down as a custom property because it changes at
 * the md breakpoint and background-size cannot be written twice in one inline
 * style.
 */
const VARIANTS: Record<ArticleCoverVariant, VariantStyles> = {
  hero: {
    panel:
      "aspect-[4/3] rounded-[14px] p-5 [--cover-grid:44px] md:aspect-auto md:h-full md:rounded-none md:p-[34px] md:[--cover-grid:58px]",
    eyebrow:
      "top-4 left-5 text-[10px] tracking-[0.16em] opacity-[0.85] md:top-[22px] md:left-[34px] md:text-[11px] md:opacity-80",
    word: "text-[46px] leading-[0.9] tracking-[-0.05em] md:text-[88px] md:tracking-[-0.055em]",
    line: "mt-2.5 text-[13px] md:mt-3.5 md:text-sm",
    hasGrid: true,
    eyebrowInFlow: false,
  },
  article: {
    panel:
      "aspect-[4/3] p-5 [--cover-grid:44px] md:aspect-[21/8] md:px-10 md:py-[34px] md:[--cover-grid:58px]",
    eyebrow:
      "top-4 left-5 text-[10px] tracking-[0.16em] opacity-[0.85] md:top-[26px] md:left-10 md:text-[11px] md:opacity-80",
    word: "text-[46px] leading-[0.9] tracking-[-0.05em] md:text-[88px] md:tracking-[-0.055em]",
    line: "mt-2.5 text-[13px] md:mt-3 md:text-sm",
    hasGrid: true,
    eyebrowInFlow: false,
  },
  card: {
    panel: "aspect-[16/9] justify-between rounded-[10px] p-5",
    eyebrow: "text-[10.5px] tracking-[0.14em] opacity-[0.85]",
    word: "text-[26px] leading-none tracking-[-0.035em]",
    line: "mt-2.5 text-[13px]",
    hasGrid: false,
    eyebrowInFlow: true,
  },
};

const GRID_OVERLAY =
  "linear-gradient(to right, rgba(255,255,255,.14) 0 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.14) 0 1px, transparent 1px)";

type ArticleCoverProps = {
  /** Feeds the hash that picks the colour when the editor left it alone. */
  title: string;
  colorId?: CoverColorId | null;
  eyebrow: string;
  word: string;
  line?: string;
  variant: ArticleCoverVariant;
};

export function ArticleCover({
  title,
  colorId,
  eyebrow,
  word,
  line,
  variant,
}: ArticleCoverProps) {
  const color = resolveCoverColor(title, colorId);
  const styles = VARIANTS[variant];
  const showLine = line !== undefined && line.length > 0 && !styles.eyebrowInFlow;

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
            backgroundImage: GRID_OVERLAY,
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
        className={`relative font-extrabold whitespace-nowrap ${styles.word}`}
      >
        {word}
      </span>
      {showLine ? (
        <span className={`relative font-semibold opacity-[0.82] ${styles.line}`}>
          {line}
        </span>
      ) : null}
    </div>
  );
}
