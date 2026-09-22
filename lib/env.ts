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

/**
 * The two keys that carry no secret: both stand in `.env.example` with their
 * real value, and every public page prints one or the other. Read on their own
 * because `environment()` validates the whole core schema, so a page that needs
 * nothing but an address would otherwise demand the database, the storage
 * credentials and the root key as well — none of which a build is given.
 *
 * Read out of the environment as a whole rather than as
 * `process.env.NEXT_PUBLIC_SITE_URL`: Next replaces a literal access to a
 * NEXT_PUBLIC_ key with its value at build time, which would freeze the address
 * the image was built with into the bundle and never read the one the container
 * is started with.
 */
const siteSchema = environmentSchema.pick({ NEXT_PUBLIC_SITE_URL: true });
const editorialSchema = environmentSchema.pick({ MAIL_TO_EDITORIAL: true });

export const siteUrl = () =>
  read(
    siteSchema,
    "The public address of this site is unusable, so no absolute link can be written",
  ).NEXT_PUBLIC_SITE_URL;

export const editorialAddress = () =>
  read(
    editorialSchema,
    "The editorial address is unusable, so no page can name one",
  ).MAIL_TO_EDITORIAL;

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

/** Read on its own for the same reason `databaseUrl` is: the pool needs it. */
export const timeZone = () =>
  environmentSchema.shape.TZ.parse(process.env.TZ);
