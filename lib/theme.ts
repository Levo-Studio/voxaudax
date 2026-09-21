export const THEME_STORAGE_KEY = "voxaudax-theme";

export const THEME_CHOICES = ["system", "light", "dark"] as const;

export type ThemeChoice = (typeof THEME_CHOICES)[number];

export const isThemeChoice = (value: unknown): value is ThemeChoice =>
  typeof value === "string" &&
  (THEME_CHOICES as readonly string[]).includes(value);

export const THEME_LABELS: Record<ThemeChoice, string> = {
  system: "System",
  light: "Hell",
  dark: "Dunkel",
};

/**
 * Stamps an explicit choice onto the document element, and stamps nothing for
 * "system" — the stylesheet reads the system preference on bare :root, so an
 * attribute would be the thing overriding it.
 */
export const applyThemeChoice = (choice: ThemeChoice) => {
  const root = document.documentElement;
  if (choice === "system") {
    delete root.dataset.theme;
  } else {
    root.dataset.theme = choice;
  }
};

export const readStoredThemeChoice = (): ThemeChoice => {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeChoice(stored) ? stored : "system";
  } catch {
    return "system";
  }
};

/**
 * Runs synchronously in <head>, before anything paints, so a reader who chose
 * dark never sees a light frame first. Written as a string because it has to be
 * inline: a fetched script would already be too late.
 *
 * It reads one key and sets one attribute. A browser with storage blocked
 * throws on the read, which is caught and leaves the system preference in
 * charge — the correct answer when nothing is known.
 */
export const THEME_BOOT_SCRIPT = `(function(){try{var c=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});if(c==="light"||c==="dark"){document.documentElement.dataset.theme=c}}catch(e){}})()`;
