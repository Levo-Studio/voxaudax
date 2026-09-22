/**
 * Shared by the form and by the action that receives it. It cannot live in the
 * action module: a "use server" file may export nothing but async functions, so
 * an array exported from there arrives in the browser as a reference to a
 * function it cannot call.
 */
export const CONCERNS = [
  "Themenvorschlag",
  "Korrektur",
  "Leserbrief",
  "Mitmachen",
] as const;

export type Concern = (typeof CONCERNS)[number];

/**
 * What the server insists on, stated here rather than in the action, because a
 * "use server" module may export nothing but async functions — so the form
 * could not read these and would have had a second copy of every number to
 * drift from. Both ends of the check now count to the same figure.
 */
export const MIN_NAME_LENGTH = 2;
export const MIN_MESSAGE_LENGTH = 10;

/**
 * The longest a name and a message may be. Both are also set on the fields
 * themselves, so the browser stops a long paste before the server has to.
 */
export const MAX_NAME_LENGTH = 120;
export const MAX_ROLE_LENGTH = 80;
export const MAX_EMAIL_LENGTH = 254;
export const MAX_MESSAGE_LENGTH = 5_000;

export type ContactState = {
  status: "idle" | "sent" | "invalid" | "throttled" | "unconfigured" | "rejected";
  problems: string[];
  /**
   * A way to send the same text without this server: on a failure the reader
   * keeps what they wrote instead of being asked to type it again.
   */
  fallback?: string;
};
