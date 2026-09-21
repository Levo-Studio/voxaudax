/**
 * German formatting for everything the reader sees. The process runs in the
 * time zone `TZ` names — Europe/Berlin — so a publication time set to the
 * minute reads the same here as it did in the editor.
 */

const SHORT_DATE = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const LONG_DATE = new Intl.DateTimeFormat("de-DE", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const NUMBER = new Intl.NumberFormat("de-DE");

export const shortDate = (moment: Date) => SHORT_DATE.format(moment);

export const longDate = (moment: Date) => LONG_DATE.format(moment);

/** What the `datetime` attribute of a <time> element needs. */
export const machineDate = (moment: Date) =>
  `${moment.getFullYear()}-${String(moment.getMonth() + 1).padStart(2, "0")}-${String(
    moment.getDate(),
  ).padStart(2, "0")}`;

export const formatNumber = (value: number) => NUMBER.format(value);

/**
 * 200 words a minute, the figure German readability research settles on for
 * continuous prose, and never less than a minute so a short notice does not
 * claim to take no time at all.
 */
export const readingMinutes = (wordCount: number) =>
  Math.max(1, Math.round(wordCount / 200));

const TRANSLITERATIONS: Readonly<Record<string, string>> = {
  ä: "ae",
  ö: "oe",
  ü: "ue",
  ß: "ss",
};

/**
 * Turns a person's name into the token that identifies them in an archive URL.
 * The umlauts are spelled out rather than stripped, because "Ozkan" is a
 * different name and "Mira Özkan" has to survive being written down.
 */
export const toSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[äöüß]/g, (letter) => TRANSLITERATIONS[letter])
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
