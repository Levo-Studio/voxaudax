import { readFileSync } from "node:fs";

import { environmentSchema } from "../lib/env-schema.ts";

/**
 * Catches the two ways .env.example goes wrong, both of which otherwise surface
 * as a container that will not start: a key the application needs that the
 * example never mentions, and a value written into the example that the schema
 * would reject.
 */

const parseExample = (contents: string) => {
  const entries = new Map<string, string>();

  for (const line of contents.split("\n")) {
    const match = /^([A-Z][A-Z0-9_]*)=(.*)$/.exec(line.trim());
    if (match !== null) entries.set(match[1], match[2]);
  }

  return entries;
};

const example = parseExample(readFileSync(".env.example", "utf8"));
const expected = new Set(Object.keys(environmentSchema.shape));

const missing = [...expected].filter((key) => !example.has(key));
const unexpected = [...example.keys()].filter((key) => !expected.has(key));

const rejected = [...example]
  .filter(([, value]) => value !== "")
  .flatMap(([key, value]) => {
    const field = environmentSchema.shape[key as keyof typeof environmentSchema.shape];
    const result = field.safeParse(value);
    return result.success
      ? []
      : [`${key}=${value} — ${result.error.issues[0].message}`];
  });

for (const key of missing) {
  console.error(`missing from .env.example: ${key}`);
}
for (const key of unexpected) {
  console.error(`in .env.example but not in the schema: ${key}`);
}
for (const problem of rejected) {
  console.error(`the schema rejects this example value: ${problem}`);
}

if (missing.length + unexpected.length + rejected.length > 0) {
  process.exit(1);
}

const filled = [...example.values()].filter((value) => value !== "").length;
console.log(
  `.env.example matches the schema: ${expected.size} keys, ${filled} with a settled value.`,
);
