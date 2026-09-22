import { defineConfig } from "drizzle-kit";

/**
 * `public` only. The `velve` schema belongs to @velve/auth and is migrated by
 * its own runner; letting drizzle-kit see it would let drizzle-kit drop it.
 */
export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  schemaFilter: ["public"],
  casing: "snake_case",
});
