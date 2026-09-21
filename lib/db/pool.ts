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
    });

    // A pooled connection that dies between queries emits on the pool, and an
    // unhandled 'error' there takes the process down with it.
    created.on("error", () => undefined);

    return created;
  })());
