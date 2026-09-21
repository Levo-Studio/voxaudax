import "server-only";
import { Pool } from "pg";

import { environment } from "@/lib/env";

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
      connectionString: environment().DATABASE_URL,
      // `extract(year from …)` and every other date expression reads a
      // timestamptz in the session's zone, and a Postgres server left at its
      // default hands out Etc/UTC. An article published at 00:30 Berlin on the
      // first of January then files under the old year while the page prints
      // the new one. The connection is put in the zone the process itself runs
      // in, so SQL and the formatters answer to the same calendar.
      options: `-c timezone=${environment().TZ}`,
      // Without these a database that accepts no connection, or accepts one and
      // never answers, leaves every request waiting for as long as it takes —
      // during an outage the page hangs instead of failing, and a build with no
      // route to the database is killed by the renderer's own 60s budget rather
      // than falling back to what it can render without content.
      connectionTimeoutMillis: 5_000,
      // statement_timeout is the server's promise and needs a server that is
      // still listening to keep it; query_timeout is this process's own, and is
      // what ends a query whose connection has gone quiet at the TCP level.
      statement_timeout: 15_000,
      query_timeout: 15_000,
    });

    // A pooled connection that dies between queries emits on the pool, and an
    // unhandled 'error' there takes the process down with it.
    created.on("error", () => undefined);

    return created;
  })());
