import "server-only";
import {
  createVelveAuth,
  rootKeyProvider,
  type EmailMessage,
  type KeyProvider,
  type VelveAuth,
} from "@velve/auth";
import { createNodePostgresDriver } from "@velve/auth/pg";

import { captureInProgress } from "@/lib/auth-mail";
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
  const captured = captureInProgress();

  // A captured message is one the back office redeems itself in the same
  // request; sending it would put a live link to that account in a mailbox.
  if (captured !== undefined) {
    captured.push(message);
    return;
  }

  throw new Error(
    `Outbound mail is not wired yet, so the "${message.kind}" message was not sent. ` +
      "RESEND_API_KEY and MAIL_FROM have no value in this environment.",
  );
};

/**
 * Screen 7b states the lockout in words, so the numbers are read off it: three
 * attempts, then the address waits three minutes. `capacity` is the burst and
 * `refillPerSecond` is 1/180, which is one token back every three minutes.
 *
 * The bucket is keyed by route name and address prefix, so this is "alle
 * Anmeldeversuche" from that address against `signIn.password` — not per
 * account, which is a second and separate counter left at the library's
 * default of five attempts refilling at 0.01/s.
 */
const SIGN_IN_LOCKOUT = { capacity: 3, refillPerSecond: 1 / 180 } as const;

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
    rateLimit: { perIpAddress: SIGN_IN_LOCKOUT },
    // Screens 8b, 8c and 12b all say "Mindestens 10 Zeichen"; the library's own
    // floor is eight, and raising a floor is the only direction it allows.
    password: { minimumLength: 10 },
    log: (level, message, fields) => console.error(level, message, fields),
  }));
