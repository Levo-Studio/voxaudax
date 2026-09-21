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
