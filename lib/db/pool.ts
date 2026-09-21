import "server-only";
import { Pool } from "pg";

import { databaseUrl, timeZone } from "@/lib/env";

/**
 * One pool for the process, shared by Drizzle and by the Velve Auth driver.
 * Next reloads these modules on every edit in development, and a pool per
 * reload would hold connections open until the database refused the next one.
 */
const processScope = globalThis as typeof globalThis & {
  voxAudaxPool?: Pool;
};

export const pool = () =>
  (processScope.voxAudaxPool ??= (() => {
    const created = new Pool({
      // Read narrowly rather than through the whole environment: the pool is
      // built while the module graph is evaluated, and validating everything
      // there would make an unusable mail key a reason the database cannot be
      // reached.
      connectionString: databaseUrl(),
      // Every date expression reads a timestamptz in the session's zone, and a
      // server left at its default hands out Etc/UTC. An article published at
      // 00:30 Berlin on the first of January then files under the old year
      // while the page prints the new one, so SQL and the formatters are put on
      // the same calendar.
      options: `-c timezone=${timeZone()}`,
      // Without these a database that accepts no connection, or accepts one and
      // never answers, leaves every request waiting for as long as it takes.
      connectionTimeoutMillis: 5_000,
      // statement_timeout is the server's promise and needs a server still
      // listening to keep it; query_timeout is this process's own, and is what
      // ends a query whose connection has gone quiet at the TCP level.
      statement_timeout: 15_000,
      query_timeout: 15_000,
    });

    // A pooled connection that dies between queries emits on the pool, and an
    // unhandled 'error' there takes the process down with it.
    created.on("error", () => undefined);

    return created;
  })());
