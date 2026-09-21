import type { ReactElement } from "react";

/**
 * One mail, in the four pieces a mail actually consists of. The plaintext part
 * is a sibling of the body rather than something derived from it, so a template
 * cannot be finished without writing it.
 */
export type MailTemplate<Props> = {
  subject: (props: Props) => string;
  /** The line the inbox shows after the subject. */
  preheader: (props: Props) => string;
  body: (props: Props) => ReactElement;
  text: (props: Props) => string;
};
