/**
 * Screen 7b prints one error and one only, and names the lockout in it. The
 * library already answers every refusal with `invalid_credentials` — an unknown
 * address, a wrong password, an account with no credential and a disabled
 * account are one answer — and this keeps it that way on our side of the call:
 * there is a single string, and the true reason goes to the configured log.
 *
 * It lives beside the action rather than in it because a "use server" file may
 * export nothing but async functions.
 */
export const SIGN_IN_ERROR =
  "E-Mail oder Passwort stimmt nicht. Nach drei Fehlversuchen wird deine IP-Adresse für drei Minuten für alle Anmeldeversuche gesperrt.";

export type SignInState = { readonly failed: boolean; readonly email: string };
