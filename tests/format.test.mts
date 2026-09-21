import assert from "node:assert/strict";
import { test } from "node:test";

import { relativeDays } from "../lib/format.ts";

/**
 * The formatter reads the zone the process runs in, which is the zone TZ names.
 * Without one the run would be measuring UTC and proving nothing about Berlin.
 */
const skip = process.env.TZ === undefined ? "no TZ" : false;

const at = (text: string) => new Date(text);

test("last night counts as yesterday, not as today", { skip }, () => {
  // 23:00 Berlin, read at 08:00 the next morning: nine hours apart.
  assert.equal(
    relativeDays(at("2026-09-20T21:00:00Z"), at("2026-09-21T06:00:00Z")),
    "gestern",
  );
});

test("the same calendar day is today however many hours apart", { skip }, () => {
  assert.equal(
    relativeDays(at("2026-09-21T00:30:00Z"), at("2026-09-21T21:30:00Z")),
    "heute",
  );
});

test("counts calendar days across the start of summer time", { skip }, () => {
  // 23:30 on 28 March and 23:30 on 29 March: one day apart on the calendar and
  // 23 hours apart on the clock, because that night in Berlin is 23 hours long.
  assert.equal(
    relativeDays(at("2026-03-28T22:30:00Z"), at("2026-03-29T21:30:00Z")),
    "gestern",
  );
});

test("counts whole days back", { skip }, () => {
  assert.equal(
    relativeDays(at("2026-09-16T10:00:00Z"), at("2026-09-21T06:00:00Z")),
    "vor 5 Tagen",
  );
});
