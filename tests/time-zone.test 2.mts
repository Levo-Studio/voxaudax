import assert from "node:assert/strict";
import { test } from "node:test";

import { databaseUrl, withPool } from "./database.mts";

/** 1 January 2026, 00:30 in Europe/Berlin — the last half hour of 2025 in UTC. */
const BOUNDARY = "2025-12-31T23:30:00Z";

const zone = process.env.TZ;

const skip =
  databaseUrl === undefined
    ? "no DATABASE_URL"
    : zone === undefined
      ? "no TZ"
      : false;

const yearInSession = (sessionZone: string) =>
  withPool({ options: `-c timezone=${sessionZone}` }, async (pool) => {
    const { rows } = await pool.query<{ year: number }>(
      "select extract(year from $1::timestamptz)::int as year",
      [BOUNDARY],
    );
    return rows[0].year;
  });

const yearOnThePage = (readerZone: string) =>
  Number(
    new Intl.DateTimeFormat("de-DE", {
      timeZone: readerZone,
      year: "numeric",
    }).format(new Date(BOUNDARY)),
  );

test("the year the archive filters on is the year the page prints", { skip }, async () => {
  const configured = zone as string;
  assert.equal(await yearInSession(configured), yearOnThePage(configured));
});

test("a session left in UTC would file it under the year before", { skip }, async () => {
  assert.equal(await yearInSession("Etc/UTC"), 2025);
  assert.equal(yearOnThePage("Europe/Berlin"), 2026);
});
