"use client";

import { useEffect, useState } from "react";

import {
  THEME_LABELS,
  THEME_STORAGE_KEY,
  type ThemeChoice,
  applyThemeChoice,
  readStoredThemeChoice,
} from "@/lib/theme";

/** System first, so a reader who never touches it keeps their own setting. */
const NEXT_CHOICE: Record<ThemeChoice, ThemeChoice> = {
  system: "light",
  light: "dark",
  dark: "system",
};

const Sun = () => (
  <svg viewBox="0 0 24 24" aria-hidden className="size-[18px]">
    <circle cx="12" cy="12" r="4.4" fill="currentColor" />
    {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
      <line
        key={angle}
        x1="12"
        y1="2.6"
        x2="12"
        y2="5.2"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        transform={`rotate(${angle} 12 12)`}
      />
    ))}
  </svg>
);

const Moon = () => (
  <svg viewBox="0 0 24 24" aria-hidden className="size-[18px]">
    <path
      d="M20.2 14.6A8.6 8.6 0 0 1 9.4 3.8a8.6 8.6 0 1 0 10.8 10.8Z"
      fill="currentColor"
    />
  </svg>
);

/** Half lit, half dark: the setting is neither, it follows the machine. */
const Automatic = () => (
  <svg viewBox="0 0 24 24" aria-hidden className="size-[18px]">
    <circle
      cx="12"
      cy="12"
      r="7.6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
    />
    <path d="M12 4.4a7.6 7.6 0 0 1 0 15.2Z" fill="currentColor" />
  </svg>
);

const ICONS: Record<ThemeChoice, () => React.JSX.Element> = {
  system: Automatic,
  light: Sun,
  dark: Moon,
};

/**
 * Renders "system" on the server because the stored choice lives in the
 * browser, then corrects itself on mount. The page is already showing the right
 * colours by then — the boot script in <head> saw to that before the first
 * paint — so this only catches up which icon is drawn.
 */
export function ThemeSwitcher() {
  const [choice, setChoice] = useState<ThemeChoice>("system");

  useEffect(() => {
    setChoice(readStoredThemeChoice());
  }, []);

  const advance = () => {
    const next = NEXT_CHOICE[choice];
    setChoice(next);
    applyThemeChoice(next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // A browser with storage blocked still gets the change for this page.
    }
  };

  const Icon = ICONS[choice];

  return (
    <button
      type="button"
      onClick={advance}
      // The label says the state, not the action: a reader arriving with a
      // screen reader needs to know what is set before what a press would do.
      aria-label={`Farbschema: ${THEME_LABELS[choice]}`}
      title={`Farbschema: ${THEME_LABELS[choice]}`}
      className="inline-flex size-11 cursor-pointer items-center justify-center rounded-full text-tm transition-colors hover:text-tx md:size-9"
    >
      <Icon />
    </button>
  );
}
