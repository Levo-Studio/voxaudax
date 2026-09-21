import "server-only";
import { Client } from "pg";

import { environment } from "@/lib/env";
import type { DependencyCheck } from "@/lib/health";

/** Below the two second race in lib/health.ts, so the check ends itself. */
const DATABASE_DEADLINE_MS = 1_500;

/**
 * Connects rather than borrowing from the pool on purpose: the question this
 * check answers is whether the database is reachable right now, which a warm
 * pooled connection would not prove.
 */
export const databaseCheck: DependencyCheck = {
  name: "database",
  critical: true,
  inspect: async () => {
    const client = new Client({
      connectionString: environment().DATABASE_URL,
      connectionTimeoutMillis: DATABASE_DEADLINE_MS,
      query_timeout: DATABASE_DEADLINE_MS,
      statement_timeout: DATABASE_DEADLINE_MS,
    });

    // pg's Client is an EventEmitter that emits 'error' when the socket dies
    // after connecting. Unhandled, that is an uncaught exception and the whole
    // process goes down — and this check runs against the database precisely
    // when the database is unwell. The awaited calls below report the failure;
    // this listener only keeps it from becoming fatal.
    client.on("error", () => undefined);

    try {
      await client.connect();
      await client.query("select 1");
      return { status: "ok" };
    } finally {
      await client.end().catch(() => undefined);
    }
  },
};
