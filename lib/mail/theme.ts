/**
 * The palette of direction C2 from the design, spelled out as literals rather
 * than read from the Tailwind theme: a mail client has no custom properties, no
 * cascade worth relying on and no access to this application's stylesheet, so
 * every colour has to end up inline in the markup.
 */

export const palette = {
  light: {
    surface: "#fbfaff",
    surfaceSunken: "#efedfa",
    text: "#100c1f",
    textMuted: "#5f5a78",
    border: "#dcd8ef",
    accent: "#4b34e6",
    onAccent: "#ffffff",
  },
  dark: {
    surface: "#0e0c16",
    surfaceSunken: "#171326",
    text: "#f3f1fb",
    textMuted: "#a09ab8",
    border: "#2a2440",
    accent: "#a99bff",
    onAccent: "#100c1f",
  },
} as const;

/**
 * Websafe families carry the design; the two brand faces are named first and
 * are used only where a client happens to have them. Nothing is fetched — the
 * newspaper self-hosts its fonts and a mail cannot reach them, so a webfont
 * here would only mean a blocked request and a fallback anyway.
 */
export const fontStack =
  "'Inter Tight', 'Bricolage Grotesque', 'Helvetica Neue', Helvetica, Arial, sans-serif";

export const monoStack =
  "'JetBrains Mono', ui-monospace, SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace";

export const MAIL_WIDTH_PX = 600;

export const CONTENT_WIDTH_PX = 536;
