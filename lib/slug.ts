const GERMAN_LETTERS: Record<string, string> = {
  ä: "ae",
  ö: "oe",
  ü: "ue",
  ß: "ss",
};

/**
 * "SMV setzt Handykompromiss durch" becomes "smv-setzt-handykompromiss-durch".
 *
 * The umlauts are spelled out before the diacritics are stripped, because
 * decomposing "ü" and dropping the mark gives "u" — which turns "Grüße" into
 * "grusse" and "Bär" into "bar". German readers expect "gruesse" and "baer".
 */
export const slugify = (title: string) =>
  title
    .normalize("NFC")
    .toLowerCase()
    .replace(/[äöüß]/g, (letter) => GERMAN_LETTERS[letter]!)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96)
    .replace(/-+$/g, "");

export const isSlug = (value: string) => value.length > 0 && slugify(value) === value;

/** Appends the smallest suffix that is free, so two articles never collide. */
export const freeSlug = (wanted: string, taken: ReadonlySet<string>) => {
  const base = slugify(wanted) || "artikel";
  if (!taken.has(base)) return base;

  for (let suffix = 2; ; suffix += 1) {
    const candidate = `${base}-${suffix}`;
    if (!taken.has(candidate)) return candidate;
  }
};
