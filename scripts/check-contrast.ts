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

/**
 * The interface palette, both themes, as `app/globals.css` states it. It is
 * repeated here rather than parsed out of the stylesheet because a checker that
 * reads the stylesheet is exactly what missed the disabled states: half an
 * accent on its own ground is a colour that only exists once the browser has
 * composited, and there is no declaration anywhere that names it.
 *
 * Which is why a disabled control is a token pair now, and why the pair is
 * measured here beside the cover colours.
 */
const THEMES = {
  hell: { s1: "#fbfaff", s2: "#efedfa", tx: "#100c1f", tm: "#5f5a78", ac: "#4b34e6", ac2: "#c8410c" },
  dunkel: { s1: "#0e0c16", s2: "#171326", tx: "#f3f1fb", tm: "#a09ab8", ac: "#a99bff", ac2: "#ff8c5e" },
} as const;

type Token = keyof (typeof THEMES)["hell"];

/** Ink on ground, named the way the class list names it. */
const INTERFACE_PAIRS: readonly (readonly [string, Token, Token])[] = [
  ["disabled control", "tm", "s2"],
  ["blocked Freigeben", "tm", "s2"],
  ["secondary text on the page", "tm", "s1"],
  ["secondary text on a panel", "tm", "s2"],
  ["body text", "tx", "s1"],
  ["accent link", "ac", "s1"],
  ["refusal", "ac2", "s1"],
  ["ink on the accent", "s1", "ac"],
];

type Failure = { readonly what: string; readonly ratio: number; readonly ink: string; readonly ground: string };

const failures: Failure[] = [];

for (const colour of COVER_COLORS) {
  const ratio = contrastRatio(colour.value, colour.text);
  if (ratio < MINIMUM_RATIO) {
    failures.push({ what: `Aufmacher ${colour.id}`, ratio, ink: colour.text, ground: colour.value });
  }
}

for (const [theme, palette] of Object.entries(THEMES)) {
  for (const [what, ink, ground] of INTERFACE_PAIRS) {
    const ratio = contrastRatio(palette[ink], palette[ground]);
    if (ratio < MINIMUM_RATIO) {
      failures.push({
        what: `${what} (${theme}, ${ink} auf ${ground})`,
        ratio,
        ink: palette[ink],
        ground: palette[ground],
      });
    }
  }
}

for (const failure of failures) {
  console.error(
    `${failure.what}: ${failure.ink} on ${failure.ground} is ${failure.ratio.toFixed(2)}:1, below ${MINIMUM_RATIO}:1`,
  );
}

const checked = COVER_COLORS.length + Object.keys(THEMES).length * INTERFACE_PAIRS.length;

if (failures.length > 0) {
  console.error(`\n${failures.length} of ${checked} colour pairs fail WCAG AA.`);
  process.exit(1);
}

console.log(`All ${checked} colour pairs meet WCAG AA.`);
