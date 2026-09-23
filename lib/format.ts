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

const RELATIVE = new Intl.RelativeTimeFormat("de-DE", { numeric: "auto" });

const DAY_IN_MS = 86_400_000;

/** en-CA writes a date as YYYY-MM-DD, in the zone the process runs in. */
const CALENDAR_DAY = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/**
 * "gestern" means the calendar day before this one, not the twenty-four hours
 * before this moment. Counting elapsed milliseconds says "heute" about
 * something posted at 23:00 and read at 08:00 the next morning — and, across
 * the two nights a year the clocks move, disagrees with the calendar by a whole
 * day. Both dates are reduced to the day they fall on first.
 */
const dayNumber = (moment: Date) => {
  const [year, month, day] = CALENDAR_DAY.format(moment).split("-").map(Number);
  return Date.UTC(year, month - 1, day) / DAY_IN_MS;
};

/** "heute", "gestern", "vor 5 Tagen" — what a gallery says about its last entry. */
export const relativeDays = (moment: Date, now: Date = new Date()) =>
  RELATIVE.format(dayNumber(moment) - dayNumber(now), "day");

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

/**
 * The two letters on an avatar. Two copies of this stood side by side — one in
 * `bootstrap-admin`, one in the invitation action — and a third was about to be
 * written for a guest byline, which is where a rule stops being a detail and
 * becomes something that has to agree with itself.
 *
 * First letters of the first two words. A name of one word gives one letter,
 * and an empty name gives nothing rather than throwing: the caller decides what
 * to do with a person who has no name, and it is not this function's business.
 */
export const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter((part) => part.length > 0)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
