import type { ReactElement } from "react";

/**
 * One mail, in the pieces a mail actually consists of. The plaintext part is a
 * sibling of the body rather than something derived from it, so a template
 * cannot be finished without writing it.
 *
 * `addressLine` is the grey line the design draws above the subject — "An
 * mira.oezkan@voxaudax.de" on a personal message, "An alle Admins und …" on
 * the approval. Who a mail is addressed to in words is a property of the
 * message and not of the envelope the sender builds, so the template writes it.
 */
export type MailTemplate<Props> = {
  subject: (props: Props) => string;
  /** The line the inbox shows after the subject. */
  preheader: (props: Props) => string;
  addressLine: (props: Props) => string;
  /**
   * Drawn flush between the header and the body, edge to edge — 11b puts the
   * approved meme there, above the first sentence and outside its padding.
   */
  banner?: (props: Props) => ReactElement | null;
  body: (props: Props) => ReactElement;
  text: (props: Props) => string;
};
