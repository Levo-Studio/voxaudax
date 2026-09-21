import localFont from "next/font/local";

/**
 * Self-hosted and subset to latin and latin-ext, so no request leaves the
 * server at run time and German, Turkish and Polish names all render in the
 * same face rather than falling back mid-word.
 *
 * They live outside public/ deliberately: next/font serves them under a hashed,
 * immutable URL, and a copy in public/ would ship the same bytes twice.
 */

export const displayFont = localFont({
  src: "../assets/fonts/bricolage-grotesque.woff2",
  variable: "--font-bricolage",
  weight: "200 800",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

export const controlFont = localFont({
  src: "../assets/fonts/inter-tight.woff2",
  variable: "--font-inter-tight",
  weight: "100 900",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

export const codeFont = localFont({
  src: "../assets/fonts/jetbrains-mono.woff2",
  variable: "--font-jetbrains",
  weight: "100 800",
  display: "swap",
  // Only slugs and code reach for it, and neither exists on a public page yet.
  preload: false,
  fallback: ["ui-monospace", "monospace"],
});

export const fontVariables = [
  displayFont.variable,
  controlFont.variable,
  codeFont.variable,
].join(" ");
