import "server-only";

import { environment, mailEnvironment } from "@/lib/env";

/**
 * The one message the public site sends. It goes to the editorial address and
 * nowhere else: no copy to the sender, no list, no analytics hook.
 */
export type EditorialMessage = {
  name: string;
  role: string;
  email: string;
  subject: string;
  body: string;
};

export type SendOutcome =
  | { sent: true }
  | { sent: false; reason: "unconfigured" | "rejected" };

const RESEND_ENDPOINT = "https://api.resend.com/emails";

const plainText = (message: EditorialMessage) =>
  [
    `Name: ${message.name}`,
    message.role.length === 0 ? undefined : `Klasse oder Rolle: ${message.role}`,
    `E-Mail: ${message.email}`,
    `Anliegen: ${message.subject}`,
    "",
    message.body,
  ]
    .filter((line) => line !== undefined)
    .join("\n");

/**
 * Returns why it failed rather than throwing, because the caller has to tell
 * the person in front of the form something true. What the log gets is the
 * reason; what the reader gets is a way to reach the editors anyway.
 */
export const sendEditorialMessage = async (
  message: EditorialMessage,
): Promise<SendOutcome> => {
  let credentials: ReturnType<typeof mailEnvironment>;

  try {
    credentials = mailEnvironment();
  } catch (cause) {
    console.error(
      `Contact form: ${cause instanceof Error ? cause.message : "mail is not configured"}`,
    );
    return { sent: false, reason: "unconfigured" };
  }

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        authorization: `Bearer ${credentials.RESEND_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: credentials.MAIL_FROM,
        to: [environment().MAIL_TO_EDITORIAL],
        // The sender is a person, so an answer has to reach them by replying.
        reply_to: message.email,
        subject: `${message.subject}: ${message.name}`,
        text: plainText(message),
      }),
    });

    if (!response.ok) {
      console.error(`Contact form: the mail provider answered ${response.status}`);
      return { sent: false, reason: "rejected" };
    }

    return { sent: true };
  } catch {
    console.error("Contact form: the mail provider could not be reached");
    return { sent: false, reason: "rejected" };
  }
};
