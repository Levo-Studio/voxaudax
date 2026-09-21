import { resolveCoverColor, type CoverColorId } from "@/lib/cover";

export type ArticleCoverVariant = "hero" | "article" | "card";

/**
 * The grid line size is handed down as a custom property because it changes at
 * the md breakpoint and background-size cannot be written twice in one inline
 * style.
 */
const VARIANTS: Record<
  ArticleCoverVariant,
  { panel: string; eyebrow: string; word: string; line: string }
> = {
  hero: {
    panel:
      "aspect-[4/3] rounded-[14px] p-5 [--cover-grid:44px] md:aspect-auto md:h-full md:rounded-none md:p-[34px] md:[--cover-grid:58px]",
    eyebrow:
      "top-4 left-5 text-[10px] tracking-[0.16em] opacity-[0.85] md:top-[22px] md:left-[34px] md:text-[11px] md:opacity-80",
    word: "text-[46px] leading-[0.9] tracking-[-0.05em] md:text-[88px] md:tracking-[-0.055em]",
    line: "mt-2.5 text-[13px] md:mt-3.5 md:text-sm",
  },
  article: {
    panel:
      "aspect-[4/3] p-5 [--cover-grid:44px] md:aspect-[21/8] md:px-10 md:py-[34px] md:[--cover-grid:58px]",
    eyebrow:
      "top-4 left-5 text-[10px] tracking-[0.16em] opacity-[0.85] md:top-[26px] md:left-10 md:text-[11px] md:opacity-80",
    word: "text-[46px] leading-[0.9] tracking-[-0.05em] md:text-[88px] md:tracking-[-0.055em]",
    line: "mt-2.5 text-[13px] md:mt-3 md:text-sm",
  },
  card: {
    panel: "aspect-[16/9] rounded-[10px] p-5 [--cover-grid:34px]",
    eyebrow: "top-5 left-5 text-[10.5px] tracking-[0.14em] opacity-[0.85]",
    word: "text-[26px] leading-none tracking-[-0.035em]",
    line: "mt-2.5 text-[13px]",
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

  return (
    <div
      className={`relative flex flex-col justify-end overflow-hidden ${styles.panel}`}
      style={{ background: color.value, color: color.text }}
    >
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage: GRID_OVERLAY,
          backgroundSize: "var(--cover-grid) 100%, 100% var(--cover-grid)",
        }}
      />
      <span className={`absolute font-bold uppercase ${styles.eyebrow}`}>
        {eyebrow}
      </span>
      <span
        className={`relative font-extrabold whitespace-nowrap ${styles.word}`}
      >
        {word}
      </span>
      {line ? (
        <span
          className={`relative font-semibold opacity-[0.82] ${styles.line}`}
        >
          {line}
        </span>
      ) : null}
    </div>
  );
}
