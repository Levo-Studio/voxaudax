import "server-only";
import { Client } from "pg";

import { environment } from "@/lib/env";
import type { DependencyCheck } from "@/lib/health";

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
      connectionTimeoutMillis: 1_500,
    });

    try {
      await client.connect();
      await client.query("select 1");
      return { status: "ok" };
    } finally {
      await client.end().catch(() => undefined);
    }
  },
};
