/**
 * "1.204 Wörter · 6 Min Lesezeit" — 1204 divided by 200 rounds to six, which is
 * the figure the template prints, so 200 words a minute is the rate it was
 * written at. A text shorter than that still reads as one minute rather than
 * zero.
 */
const WORDS_PER_MINUTE = 200;

export const readingTimeMinutes = (wordCount: number) =>
  Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE));

const GERMAN = new Intl.NumberFormat("de-DE");

export const formatWordCount = (wordCount: number) => GERMAN.format(wordCount);
