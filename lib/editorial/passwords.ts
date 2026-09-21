import "server-only";

import { velveAuth } from "@/lib/auth";
import { tokenOf, withCapturedMail } from "@/lib/auth-mail";

type Call = {
  readonly origin: string;
  readonly ipAddress?: string | null;
  readonly userAgent?: string | null;
};

/**
 * Screen 12a: an admin sets a password directly and hands it over in person.
 *
 * @velve/auth has no method for setting somebody else's password — `password.set`
 * and `password.change` both act on the caller's own account — so this is built
 * from the two documented calls that do reach a foreign account: the reset is
 * requested, its artefact is captured instead of mailed, and it is spent in the
 * same request. Nothing writes the credential table directly, so the Argon2id
 * parameters, the length policy and `set_by_session_id` are still the library's.
 *
 * `redeemReset` revokes every session of the account and that is not an option
 * the library offers to turn off, so screen 12a's "Alle offenen Sitzungen
 * beenden" is always true rather than a switch.
 */
export const setPasswordFor = async (input: {
  readonly email: string;
  readonly newPassword: string;
  readonly call: Call;
}) => {
  const auth = velveAuth();

  const { messages } = await withCapturedMail(() =>
    auth.password.requestReset({ email: input.email, origin: input.call.origin }),
  );

  const token = tokenOf(messages, "password_reset");

  // An address with no account is answered with `request_for_unknown_address`,
  // which carries no token. Every member row an admin can act on has one, so
  // this is a state that should not happen rather than a case to report.
  if (token === undefined) return "no_account" as const;

  const result = await auth.password.redeemReset({
    token,
    newPassword: input.newPassword,
    ...input.call,
  });

  return { revokedSessions: result.revokedOtherSessionsCount } as const;
};

/**
 * Screen 12b: "Aus Sicherheitsgründen sagen wir nicht, ob es das Konto gibt."
 *
 * The library already answers both branches identically. What this adds is that
 * an outbound mail that fails is also not allowed to become an answer — a
 * request that errors for a known address and succeeds for an unknown one would
 * be the enumeration channel the copy promises there is not.
 */
export const requestOwnReset = async (email: string, call: Call) => {
  try {
    await velveAuth().password.requestReset({ email, ...call });
  } catch (cause) {
    console.error("error", "password reset request did not complete", { cause });
  }
};

export const redeemOwnReset = (input: {
  readonly token: string;
  readonly newPassword: string;
  readonly call: Call;
}) =>
  velveAuth().password.redeemReset({
    token: input.token,
    newPassword: input.newPassword,
    ...input.call,
  });
