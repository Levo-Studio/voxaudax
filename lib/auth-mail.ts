import "server-only";
import { AsyncLocalStorage } from "node:async_hooks";

import type { EmailMessage } from "@velve/auth";

/**
 * Two flows need the token @velve/auth mints rather than a message about it:
 * redeeming an invitation has to spend the sign-up's own `email_verify`
 * artefact in the session that just wrote the password (S-LINK-4, L-12), and an
 * admin setting a password directly (screen 12a) has to spend the reset
 * artefact it asked for. The library hands both to `email.send` and offers no
 * other way to reach them.
 *
 * The capture is scoped to one call rather than kept in a module variable: two
 * requests run concurrently in the same process, and a shared buffer would hand
 * one caller's reset token to the other.
 */
const capture = new AsyncLocalStorage<EmailMessage[]>();

export const withCapturedMail = async <T>(
  run: () => Promise<T>,
): Promise<{ readonly result: T; readonly messages: readonly EmailMessage[] }> => {
  const messages: EmailMessage[] = [];
  const result = await capture.run(messages, run);
  return { result, messages };
};

/** Returns the buffer when a capture is in progress, and undefined otherwise. */
export const captureInProgress = () => capture.getStore();

/**
 * The two captured kinds both carry a token. Narrowing on `kind` rather than
 * reading an optional field is what keeps the two message kinds that carry none
 * — the enumeration covers — from silently answering undefined.
 */
export const tokenOf = (
  messages: readonly EmailMessage[],
  kind: "email_verification" | "password_reset",
) => {
  for (const message of messages) {
    if (message.kind === kind) return message.token;
  }
  return undefined;
};
