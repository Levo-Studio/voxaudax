import "server-only";
import type { z } from "zod";

import { environmentSchema } from "@/lib/env-schema";

const describeFailure = (error: z.ZodError) =>
  error.issues
    .map((issue) => `  ${issue.path.join(".")} — ${issue.message}`)
    .join("\n");

const readEnvironment = () => {
  const result = environmentSchema.safeParse(process.env);

  if (!result.success) {
    throw new Error(
      `Environment is unusable, so the process is stopping before it serves anything:\n${describeFailure(result.error)}\n\nSee .env.example for the keys this application needs.`,
    );
  }

  return result.data;
};

let validatedOnce: z.infer<typeof environmentSchema> | undefined;

export const environment = () => (validatedOnce ??= readEnvironment());

export type Environment = ReturnType<typeof environment>;

/**
 * The connection string on its own, validated on its own.
 *
 * The pool is built while the module graph is being evaluated, and validating
 * the whole environment there makes every unrelated key a reason the database
 * cannot be reached — an unusable mail key would stop the build of a page that
 * sends nothing. This is the same argument `scripts/check-connections.mts`
 * already makes for its own reads; everything that actually needs a mail key or
 * a root key still asks `environment()` and still fails without one.
 */
export const databaseUrl = () =>
  environmentSchema.shape.DATABASE_URL.parse(process.env.DATABASE_URL);
