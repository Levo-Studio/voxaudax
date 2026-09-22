import "server-only";
import { sql } from "drizzle-orm";

// The attribute is not decoration: the bundler takes a bare JSON import,
// plain Node does not, and this module is read by both.
import journal from "@/drizzle/meta/_journal.json" with { type: "json" };
import { db } from "@/lib/db/client";
import type { DependencyCheck } from "@/lib/health";

/**
 * Migrations are applied by hand, from a checkout, against a database somebody
 * has decided to point at — that is the rule and this check does not change it.
 * What it changes is that the gap is noticed: nothing else in the running
 * service can tell that the image carries a migration the database has not
 * seen, and until it does, the back office answers 500 over a column that is
 * not there while `select 1` goes through and reports the database as well.
 *
 * The journal is read from the repository and travels in the bundle, so the
 * number it names is the number this image was built with — no `drizzle/` and
 * no drizzle-kit in the runtime image, which is what the Dockerfile intends.
 */
const WRITTEN_AT = journal.entries.map((entry) => entry.when);

/**
 * The same rule the migrator itself applies: it records `folderMillis` as
 * `created_at` and replays everything stamped later than the newest row.
 */
const MIGRATIONS_TABLE = "drizzle.__drizzle_migrations";

const appliedUpTo = async (): Promise<number | null> => {
  // Asked of the catalogue first, because a table that does not exist is a
  // parse error and not an empty answer — and a database nobody has migrated
  // yet is exactly the state this check has to be able to report.
  const present = await db.execute<{ present: boolean }>(
    sql`select to_regclass(${MIGRATIONS_TABLE}) is not null as present`,
  );

  if (present.rows[0]?.present !== true) return null;

  const newest = await db.execute<{ created_at: string | null }>(
    sql`select max(created_at)::text as created_at from drizzle.__drizzle_migrations`,
  );

  const value = newest.rows[0]?.created_at;
  return value === null || value === undefined ? null : Number(value);
};

export const migrationsCheck: DependencyCheck = {
  name: "migrations",
  // Critical: code that is ahead of its schema is not a degraded service, it is
  // a back office that answers every editorial page with an error.
  critical: true,
  inspect: async () => {
    const applied = await appliedUpTo();
    const pending = WRITTEN_AT.filter(
      (when) => applied === null || when > applied,
    ).length;

    return pending === 0
      ? { status: "ok", pending: 0 }
      : { status: "error", error: "migrations pending", pending };
  },
};
