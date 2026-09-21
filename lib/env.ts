import "server-only";
import type { z } from "zod";

import { environmentSchema } from "@/lib/env-schema";

/**
 * The keys only the outgoing mail path needs. They are validated where a
 * message is actually sent, not at start-up, because a newspaper that cannot
 * send a contact form is still a newspaper: without this split a missing or
 * unattended sender address takes down every article, the archive and the feed
 * along with the form.
 */
const MAIL_KEYS = { RESEND_API_KEY: true, MAIL_FROM: true } as const;

const coreSchema = environmentSchema.omit(MAIL_KEYS);
const mailSchema = environmentSchema.pick(MAIL_KEYS);

const describeFailure = (error: z.ZodError) =>
  error.issues
    .map((issue) => `  ${issue.path.join(".")} — ${issue.message}`)
    .join("\n");

const read = <Schema extends z.ZodType>(schema: Schema, whatBreaks: string) => {
  const result = schema.safeParse(process.env);

  if (!result.success) {
    throw new Error(
      `${whatBreaks}:\n${describeFailure(result.error)}\n\nSee .env.example for the keys this application needs.`,
    );
  }

  return result.data;
};

let core: z.infer<typeof coreSchema> | undefined;

export const environment = () =>
  (core ??= read(
    coreSchema,
    "Environment is unusable, so the process is stopping before it serves anything",
  ));

export type Environment = ReturnType<typeof environment>;

/**
 * Throws rather than returning a failure, so a caller cannot send a message
 * into a half-configured transport by ignoring a return value. The message
 * names the keys and nothing else — never the values.
 */
export const mailEnvironment = () =>
  read(
    mailSchema,
    "Mail is not configured on this server, so nothing was sent",
  );
