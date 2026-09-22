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

  // Imported here rather than at the top so that this module still loads in a
  // script or a test without the mail renderer, React and a database client
  // coming with it. Everything below the import decides what to send; a
  // missing key is reported by `lib/mail.ts`, which is the half that reads it.
  const { deliverAuthMail } = await import("@/lib/auth-delivery");
  await deliverAuthMail(message);
};

/**
 * The canonical origin, plus the local one while developing. Without it nobody
 * can sign in on their own machine: the origin check refuses the request before
 * it ever reaches a password, which reads like a broken login rather than a
 * working guard. Gated on NODE_ENV so a production build never carries it.
 */
const allowedOrigins = () => {
  const canonical = new URL(environment().NEXT_PUBLIC_SITE_URL).origin;

  return process.env.NODE_ENV === "production"
    ? [canonical]
    : [canonical, "http://localhost:7896", "http://127.0.0.1:7896"];
};

/**
 * Screen 7b states the lockout in words: three attempts, then a wait of three
 * minutes. Which bucket carries that is the whole question, and the first
 * answer was wrong.
 *
 * `rateLimit` here is the instance's configuration and **replaces the default
 * for every route**, not for the one the screen is about. With the address
 * bucket set to three, reloading the account page a fourth time inside three
 * minutes was refused — it reads `session.list` — and so was redeeming an
 * invitation. On a school network, where everybody shares one address, the
 * three would have been shared by the whole school.
 *
 * So the address bucket keeps the library's own figure, which is a flood guard
 * and not a lockout, and the three attempts sit on the account bucket, which a
 * route spends once it knows whose account is being tried. That is also what
 * the sentence on 7b is really about: somebody guessing at one account.
 */
const PER_ACCOUNT_LOCKOUT = { capacity: 3, refillPerSecond: 1 / 180 } as const;

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
    origins: allowedOrigins(),
    email: { send: sendMail },
    rateLimit: { perAccount: PER_ACCOUNT_LOCKOUT },
    // Screens 8b, 8c and 12b all say "Mindestens 10 Zeichen"; the library's own
    // floor is eight, and raising a floor is the only direction it allows.
    password: { minimumLength: 10 },
    // The level the library chose, on the console channel that matches it: a
    // rate-limited request is a warning, and printing it as an error put a red
    // overlay in front of a developer over something working as designed.
    log: (level, message, fields) => {
      const write =
        level === "error" ? console.error : level === "warn" ? console.warn : console.info;
      write(level, message, fields);
    },
  }));
