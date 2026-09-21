/**
 * The newspaper is read in one place, and a mail is read wherever it lands, so
 * the zone is named here rather than left to the clock of whatever machine
 * happens to render the template.
 */
const EDITORIAL_TIME_ZONE = "Europe/Berlin";

const germanDay = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: EDITORIAL_TIME_ZONE,
});

const germanClock = new Intl.DateTimeFormat("de-DE", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: EDITORIAL_TIME_ZONE,
});

/** "21.09.2026" */
export const germanDate = (moment: Date) => germanDay.format(moment);

/** "18:04 Uhr" */
export const germanTime = (moment: Date) => `${germanClock.format(moment)} Uhr`;

/** "21.09.2026, 18:04 Uhr" */
export const germanMoment = (moment: Date) =>
  `${germanDate(moment)}, ${germanTime(moment)}`;
