import { COVER_COLORS } from "../lib/cover.ts";

const MINIMUM_RATIO = 4.5;

const channel = (value: number) => {
  const scaled = value / 255;
  return scaled <= 0.04045 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
};

const luminance = (hex: string) => {
  const [red, green, blue] = [1, 3, 5].map((offset) =>
    channel(Number.parseInt(hex.slice(offset, offset + 2), 16)),
  );
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
};

const contrastRatio = (a: string, b: string) => {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
};

const failures = COVER_COLORS.map((colour) => ({
  id: colour.id,
  ratio: contrastRatio(colour.value, colour.text),
  value: colour.value,
  text: colour.text,
})).filter((colour) => colour.ratio < MINIMUM_RATIO);

for (const colour of failures) {
  console.error(
    `${colour.id}: ${colour.text} on ${colour.value} is ${colour.ratio.toFixed(2)}:1, below ${MINIMUM_RATIO}:1`,
  );
}

if (failures.length > 0) {
  console.error(`\n${failures.length} of ${COVER_COLORS.length} cover colours fail WCAG AA.`);
  process.exit(1);
}

console.log(`All ${COVER_COLORS.length} cover colours meet WCAG AA.`);
