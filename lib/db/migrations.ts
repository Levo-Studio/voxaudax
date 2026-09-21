import {
  assertSchemaUpToDate,
  coreMigrations,
  runMigrations,
  type Driver,
} from "@velve/auth/schema";

/**
 * Sign-in is by e-mail address, so the mode decides which of the three
 * version-2 constraints the `velve` schema carries. Changing it later is a
 * schema change of its own, not a configuration switch.
 */
export const AUTH_IDENTITY_MODE = "email" as const;

const plan = () => ({ migrations: coreMigrations(AUTH_IDENTITY_MODE) });

/**
 * Needs no root key: the runner only reads and writes the `velve` schema, so
 * the schema can be brought up to date on a database whose AUTH_SECRET is not
 * yet usable.
 */
export const migrateAuthSchema = (driver: Driver) =>
  runMigrations({ driver, ...plan() });

export const assertAuthSchemaUpToDate = (driver: Driver) =>
  assertSchemaUpToDate({ driver, ...plan() });
