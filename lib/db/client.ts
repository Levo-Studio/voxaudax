import "server-only";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "@/lib/db/schema";
import { environment } from "@/lib/env";

/**
 * One pool for the process. Next reloads this module on every edit in
 * development, and a pool per reload would hold connections open until the
 * database refused the next one.
 */
const processScope = globalThis as typeof globalThis & {
  voxAudaxPool?: Pool;
};

const pool = (processScope.voxAudaxPool ??= new Pool({
  connectionString: environment().DATABASE_URL,
}));

// A pooled connection that dies between queries emits on the pool, and an
// unhandled 'error' there takes the process down with it.
pool.on("error", () => undefined);

export const db = drizzle(pool, { schema });
