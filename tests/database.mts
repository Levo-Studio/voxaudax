import { Pool, type PoolConfig } from "pg";

/**
 * The checks that matter here are about what Postgres does with what the
 * application sends it, so they talk to a real database. Without a DATABASE_URL
 * — a checkout that has not been set up, or a CI job that has no route to it —
 * they report as skipped rather than failing for the wrong reason.
 */
export const databaseUrl = process.env.DATABASE_URL;

export async function withPool<Result>(
  config: Omit<PoolConfig, "connectionString">,
  ask: (pool: Pool) => Promise<Result>,
): Promise<Result> {
  const pool = new Pool({ ...config, connectionString: databaseUrl, max: 1 });

  try {
    return await ask(pool);
  } finally {
    await pool.end();
  }
}
