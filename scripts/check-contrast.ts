import { readFileSync } from "node:fs";

import { COVER_COLORS } from "../lib/cover.ts";

/**
 * A cover's ink is picked to clear AA against its panel exactly, so a cover
 * that renders that ink at less than full strength is not the cover this
 * palette was measured for. Reading the ratios off `lib/cover.ts` alone passed
 * all fourteen while the component faded the category to .85 and the cover line
 * to .82 — composited, half the palette fell under 4.5:1 on 10px type.
 *
 * So the component is read too: every opacity it sets is composited onto every
 * panel, and the result is what has to clear AA. A fade reintroduced later
 * fails here rather than on the homepage.
 */
const COMPONENT = new URL("../components/article-cover.tsx", import.meta.url);

const MINIMUM_RATIO = 4.5;

const channel = (value: number) => {
  const scaled = value / 255;
  return scaled <= 0.04045 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
};

const parts = (hex: string) =>
  [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16));

const luminance = (hex: string) => {
  const [red, green, blue] = parts(hex).map(channel);
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
};

const contrastRatio = (a: string, b: string) => {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
};

/**
 * What the compositor does: CSS opacity blends the element's own colour into
 * what is behind it, in the same non-linear sRGB the two hex values are written
 * in. The reader never sees the ink, only this.
 */
const composite = (ink: string, panel: string, opacity: number) => {
  const behind = parts(panel);
  const blended = parts(ink).map((value, index) =>
    Math.round(opacity * value + (1 - opacity) * behind[index]),
  );

  return `#${blended.map((value) => value.toString(16).padStart(2, "0")).join("")}`;
};

/** `opacity-[0.82]` and `opacity-80`, the two spellings Tailwind takes. */
const ARBITRARY_OPACITY = /opacity-\[(\d*\.?\d+)\]/g;
const SCALE_OPACITY = /opacity-(\d{1,3})(?![\w.[-])/g;

const renderedOpacities = () => {
  const source = readFileSync(COMPONENT, "utf8");
  const found = [
    ...[...source.matchAll(ARBITRARY_OPACITY)].map((match) =>
      Number(match[1]),
    ),
    ...[...source.matchAll(SCALE_OPACITY)].map((match) => Number(match[1]) / 100),
  ];

  // Full strength is always measured: it is what an unfaded cover renders at.
  return [...new Set([1, ...found])].sort((a, b) => b - a);
};

const opacities = renderedOpacities();

const failures = opacities.flatMap((opacity) =>
  COVER_COLORS.map((colour) => ({
    id: colour.id,
    opacity,
    ratio: contrastRatio(
      composite(colour.text, colour.value, opacity),
      colour.value,
    ),
  })).filter((colour) => colour.ratio < MINIMUM_RATIO),
);

for (const colour of failures) {
  console.error(
    `${colour.id} at opacity ${colour.opacity}: ${colour.ratio.toFixed(2)}:1, below ${MINIMUM_RATIO}:1`,
  );
}

const measured = opacities.length * COVER_COLORS.length;

if (failures.length > 0) {
  console.error(
    `\n${failures.length} of ${measured} cover ink measurements fail WCAG AA.`,
  );
  process.exit(1);
}

console.log(
  `All ${COVER_COLORS.length} cover colours meet WCAG AA at every strength the cover renders them (${opacities.join(", ")}).`,
);
