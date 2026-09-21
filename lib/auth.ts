import "server-only";
import {
  createVelveAuth,
  rootKeyProvider,
  type EmailMessage,
  type KeyProvider,
  type VelveAuth,
} from "@velve/auth";
import { createNodePostgresDriver } from "@velve/auth/pg";

import { AUTH_IDENTITY_MODE } from "@/lib/db/migrations";
import { pool } from "@/lib/db/pool";
import { environment } from "@/lib/env";

export const authDriver = () => createNodePostgresDriver(pool());

/**
 * AUTH_SECRET is read as canonical base64url, so thirty-two characters are
 * twenty-four bytes and the library refuses them. The message says what to
 * generate without saying what is there now.
 */
const keys = (): KeyProvider => {
  try {
    return rootKeyProvider({
      currentVersion: 1,
      keysByVersion: { 1: environment().AUTH_SECRET },
    });
  } catch (cause) {
    throw new Error(
      "AUTH_SECRET is not a usable root key. It must be canonical base64url " +
        "decoding to at least 32 bytes, with no surrounding whitespace — " +
        "generate one with: openssl rand -base64 32 | tr '+/' '-_' | tr -d '='",
      { cause },
    );
  }
};

const sendMail = async (message: EmailMessage): Promise<void> => {
  throw new Error(
    `Outbound mail is not wired yet, so the "${message.kind}" message was not sent. ` +
      "RESEND_API_KEY and MAIL_FROM have no value in this environment.",
  );
};

let instance: VelveAuth<typeof AUTH_IDENTITY_MODE> | undefined;

/**
 * Built on first use rather than at import: a module that throws while it is
 * being imported takes down every route that shares the chunk, including the
 * health endpoints that are supposed to report the problem.
 */
export const velveAuth = () =>
  (instance ??= createVelveAuth({
    database: authDriver(),
    identity: { mode: AUTH_IDENTITY_MODE },
    keys: keys(),
    origins: [new URL(environment().NEXT_PUBLIC_SITE_URL).origin],
    email: { send: sendMail },
    log: (level, message, fields) => console.error(level, message, fields),
  }));
