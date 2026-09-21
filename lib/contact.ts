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

export type ContactState = {
  status: "idle" | "sent" | "invalid" | "unconfigured" | "rejected";
  problems: string[];
  /**
   * A way to send the same text without this server: on a failure the reader
   * keeps what they wrote instead of being asked to type it again.
   */
  fallback?: string;
};
