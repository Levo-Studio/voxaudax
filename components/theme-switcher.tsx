"use client";

import { useEffect, useState } from "react";

import {
  THEME_CHOICES,
  THEME_LABELS,
  THEME_STORAGE_KEY,
  type ThemeChoice,
  applyThemeChoice,
  readStoredThemeChoice,
} from "@/lib/theme";

/**
 * Renders "system" on the server because the stored choice lives in the
 * browser, then corrects itself on mount. The page is already showing the right
 * colours by then — the boot script in <head> saw to that before the first
 * paint — so this only catches up which of the three buttons reads as pressed.
 */
export function ThemeSwitcher() {
  const [choice, setChoice] = useState<ThemeChoice>("system");

  useEffect(() => {
    setChoice(readStoredThemeChoice());
  }, []);

  const choose = (next: ThemeChoice) => {
    setChoice(next);
    applyThemeChoice(next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // A browser with storage blocked still gets the change for this page.
    }
  };

  return (
    <div
      role="group"
      aria-label="Farbschema"
      className="inline-flex gap-0.5 rounded-[7px] border border-bd p-0.5"
    >
      {THEME_CHOICES.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => choose(option)}
          aria-pressed={choice === option}
          className={`min-h-11 cursor-pointer rounded-[5px] px-2.5 py-1 md:min-h-0 font-control text-[11.5px] font-semibold transition-colors ${
            choice === option
              ? "bg-ac text-s1"
              : "text-tm hover:text-tx"
          }`}
        >
          {THEME_LABELS[option]}
        </button>
      ))}
    </div>
  );
}
