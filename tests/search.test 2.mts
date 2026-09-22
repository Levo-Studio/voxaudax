import assert from "node:assert/strict";
import { test } from "node:test";

import { LIKE_ESCAPE, likeContains } from "../lib/search.ts";
import { databaseUrl, withPool } from "./database.mts";

test("escapes the three characters the pattern language reads", () => {
  assert.equal(likeContains("50%"), "%50\\%%");
  assert.equal(likeContains("AG_Sport"), "%AG\\_Sport%");
  assert.equal(likeContains("a\\b"), "%a\\\\b%");
  assert.equal(likeContains("Schule"), "%Schule%");
});

test(
  "a search for % matches a literal percent sign and nothing else",
  { skip: databaseUrl === undefined && "no DATABASE_URL" },
  async () => {
    const matches = async (query: string) =>
      withPool({}, async (pool) => {
        const { rows } = await pool.query<{ line: string }>(
          `select line from (values ('50% weniger Papier'), ('AG_Sport startet'), ('Ganz ohne Zeichen')) as t(line)
             where line ilike $1 escape $2`,
          [likeContains(query), LIKE_ESCAPE],
        );
        return rows.map((row) => row.line);
      });

    assert.deepEqual(await matches("%"), ["50% weniger Papier"]);
    assert.deepEqual(await matches("_"), ["AG_Sport startet"]);
    assert.deepEqual(await matches("50%"), ["50% weniger Papier"]);
    assert.deepEqual(await matches("ohne"), ["Ganz ohne Zeichen"]);
    assert.deepEqual(await matches("%%%"), []);
  },
);
