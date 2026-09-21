import "server-only";
import { Resend } from "resend";

import { environment, mailEnvironment } from "@/lib/env";
import { environmentSchema } from "@/lib/env-schema";
import { type Mail, renderMail } from "@/lib/mail/render";

/**
 * Only the three keys sending needs, checked when a mail is actually sent. The
 * module therefore imports cleanly in an environment that has no mail
 * credentials — a render or a preview must not need a key — and a send without
 * them fails with a sentence that names what is missing.
 */
const mailSchema = environmentSchema.pick({
  RESEND_API_KEY: true,
  MAIL_FROM: true,
  MAIL_TO_EDITORIAL: true,
});

export class MailNotConfigured extends Error {
  constructor(missing: readonly string[]) {
    super(
      `No mail can be sent: ${missing.join(", ")}. Set the keys in .env; see .env.example.`,
    );
    this.name = "MailNotConfigured";
  }
}

export class MailRejected extends Error {
  constructor(reason: string) {
    super(`Resend rejected the message: ${reason}`);
    this.name = "MailRejected";
  }
}

const mailConfiguration = () => {
  const result = mailSchema.safeParse(process.env);

  if (!result.success) {
    throw new MailNotConfigured(
      result.error.issues.map((issue) => {
        const key = String(issue.path[0]);
        return process.env[key] === undefined
          ? `${key} is not set`
          : `${key} ${issue.message}`;
      }),
    );
  }

  return result.data;
};

let transport: Resend | undefined;

const resend = (apiKey: string) => (transport ??= new Resend(apiKey));

export type MailDelivery = {
  to: readonly string[];
  mail: Mail;
};

/**
 * Renders and hands the message to Resend. Recipients are deduplicated because
 * the approval mail goes to every admin and to the person who submitted, and
 * those two sets overlap whenever an admin submits something.
 */
export const sendMail = async ({ to, mail }: MailDelivery): Promise<string> => {
  const recipients = [...new Set(to)];

  if (recipients.length === 0) {
    throw new MailRejected("no recipient was given");
  }

  const configuration = mailConfiguration();
  const { subject, html, text } = await renderMail(mail);

  const { data, error } = await resend(
    configuration.RESEND_API_KEY,
  ).emails.send({
    from: configuration.MAIL_FROM,
    to: recipients,
    replyTo: configuration.MAIL_TO_EDITORIAL,
    subject,
    html,
    text,
  });

  if (error !== null) throw new MailRejected(`${error.name} — ${error.message}`);
  if (data === null) throw new MailRejected("no message id came back");

  return data.id;
};


/* ---------------------------------------------------------------------------
 * Two transports to the same provider, deliberately left side by side for now.
 * The templates above go through the Resend SDK; the contact form below posts
 * to the API itself, because it predates them and carries its own deadline.
 * Folding the form onto `sendMail` is the obvious next step and is written down
 * in EXTRAPOLATION.md — it is not done here because with no key in this
 * environment the change could not be exercised.
 * ------------------------------------------------------------------------- */

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
      // Undici waits five minutes for headers. A mail host that hangs would
      // hold the contact form open for all five, with the person in front of
      // it watching a spinner rather than being offered the fallback below.
      signal: AbortSignal.timeout(10_000),
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
