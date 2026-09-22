import { readFileSync } from "node:fs";

import { COVER_COLORS, coverColorById } from "../lib/cover.ts";

const COMPONENT = new URL("../components/article-cover.tsx", import.meta.url);

/**
 * The back office's brand panel wears one cover colour instead of fourteen, and
 * its faded type is spread over two files: the panel draws the wordmark's
 * label, the page that uses it passes the paragraph. Both are read, because a
 * fade added in either place is a fade that renders.
 */
const BRAND_PANEL = [
  new URL("../components/admin/brand-panel.tsx", import.meta.url),
  new URL("../app/admin/page.tsx", import.meta.url),
];

const MINIMUM_RATIO = 4.5;

const channel = (value: number) => {
  const scaled = value / 255;
  return scaled <= 0.04045 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
};

const parts = (hex: string) =>
  [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16));

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

const renderedOpacities = (...sources: readonly URL[]) => {
  const source = sources.map((file) => readFileSync(file, "utf8")).join("\n");
  const found = [
    ...[...source.matchAll(ARBITRARY_OPACITY)].map((match) =>
      Number(match[1]),
    ),
    ...[...source.matchAll(SCALE_OPACITY)].map((match) => Number(match[1]) / 100),
  ];

  // Full strength is always measured: it is what an unfaded cover renders at.
  return [...new Set([1, ...found])].sort((a, b) => b - a);
};

const opacities = renderedOpacities(COMPONENT);
const panelOpacities = renderedOpacities(...BRAND_PANEL);
const panelColour = coverColorById("violett");

type Failure = { readonly what: string; readonly ratio: number; readonly ink: string; readonly ground: string };

const failures: Failure[] = [];

for (const opacity of opacities) {
  for (const colour of COVER_COLORS) {
    const ink = composite(colour.text, colour.value, opacity);
    const ratio = contrastRatio(ink, colour.value);
    if (ratio < MINIMUM_RATIO) {
      failures.push({
        what: `cover ${colour.id}${opacity === 1 ? "" : ` at opacity ${opacity}`}`,
        ratio,
        ink,
        ground: colour.value,
      });
    }
  }
}

for (const opacity of panelOpacities) {
  const ink = composite(panelColour.text, panelColour.value, opacity);
  const ratio = contrastRatio(ink, panelColour.value);
  if (ratio < MINIMUM_RATIO) {
    failures.push({
      what: `brand panel${opacity === 1 ? "" : ` at opacity ${opacity}`}`,
      ratio,
      ink,
      ground: panelColour.value,
    });
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

const checked =
  opacities.length * COVER_COLORS.length +
  panelOpacities.length +
  Object.keys(THEMES).length * INTERFACE_PAIRS.length;

if (failures.length > 0) {
  console.error(`\n${failures.length} of ${checked} colour pairs fail WCAG AA.`);
  process.exit(1);
}

console.log(`All ${checked} colour pairs meet WCAG AA.`);
