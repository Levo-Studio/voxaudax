import { createNodePostgresDriver } from "@velve/auth/pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

import {
  assertAuthSchemaUpToDate,
  migrateAuthSchema,
} from "../lib/db/migrations.ts";
import { environmentSchema } from "../lib/env-schema.ts";

/**
 * Brings both schemas forward, in the only order that works: `velve` first,
 * because a table in `public` references `velve.user`.
 *
 * Run it as: node --env-file=.env scripts/migrate.mts
 */

const connection = environmentSchema
  .pick({ DATABASE_URL: true })
  .safeParse(process.env);

if (!connection.success) {
  console.error("DATABASE_URL is missing or is not a URL.");
  process.exit(1);
}

const pool = new Pool({ connectionString: connection.data.DATABASE_URL });
pool.on("error", () => undefined);

try {
  const auth = await migrateAuthSchema(createNodePostgresDriver(pool));
  console.log(
    auth.appliedVersions.length === 0
      ? `velve  already at version ${auth.currentVersion}`
      : `velve  applied ${auth.appliedVersions.join(", ")}, now at version ${auth.currentVersion}`,
  );

  await assertAuthSchemaUpToDate(createNodePostgresDriver(pool));

  await migrate(drizzle(pool), { migrationsFolder: "drizzle" });
  console.log("public applied every pending migration in drizzle/");
} finally {
  await pool.end();
}
