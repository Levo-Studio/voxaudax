import "server-only";
import { Resend } from "resend";

import { environment } from "@/lib/env";
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
  /**
   * Where a reply goes. Defaults to the editorial address, which is right for
   * everything this application writes itself; the contact form overrides it
   * with the reader's own address, because a reply there is meant for them.
   */
  replyTo?: string;
};

/**
 * Renders and hands the message to Resend. Recipients are deduplicated because
 * the approval mail goes to every admin and to the person who submitted, and
 * those two sets overlap whenever an admin submits something.
 */
export const sendMail = async ({ to, mail, replyTo }: MailDelivery): Promise<string> => {
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
    replyTo: replyTo ?? configuration.MAIL_TO_EDITORIAL,
    subject,
    html,
    text,
  });

  if (error !== null) throw new MailRejected(`${error.name} — ${error.message}`);
  if (data === null) throw new MailRejected("no message id came back");

  return data.id;
};


/**
 * The one message the public site sends. It goes to the editorial address and
 * nowhere else: no copy to the sender, no list, no analytics hook.
 *
 * It used to post to the Resend API itself, past the templates beside it, and
 * arrived as bare lines of text while every other mail from this newspaper
 * carried its shape. It goes through the same sender as the rest now — the only
 * thing it asks for on its own is the reply address, which is the reader's and
 * not the editors'.
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

/**
 * Returns why it failed rather than throwing, because the caller has to tell
 * the person in front of the form something true. What the log gets is the
 * reason; what the reader gets is a way to reach the editors anyway.
 */
export const sendEditorialMessage = async (
  message: EditorialMessage,
): Promise<SendOutcome> => {
  let to: string;

  try {
    to = environment().MAIL_TO_EDITORIAL;
  } catch (cause) {
    console.error(
      `Contact form: ${cause instanceof Error ? cause.message : "mail is not configured"}`,
    );
    return { sent: false, reason: "unconfigured" };
  }

  try {
    await sendMail({
      to: [to],
      // The sender is a person, so an answer has to reach them by replying.
      replyTo: message.email,
      mail: {
        template: "editorialMessage",
        props: {
          siteUrl: environment().NEXT_PUBLIC_SITE_URL,
          to,
          name: message.name,
          role: message.role,
          email: message.email,
          subject: message.subject,
          body: message.body,
        },
      },
    });

    return { sent: true };
  } catch (cause) {
    if (cause instanceof MailNotConfigured) {
      console.error(`Contact form: ${cause.message}`);
      return { sent: false, reason: "unconfigured" };
    }

    console.error(
      `Contact form: ${cause instanceof Error ? cause.message : "the mail provider could not be reached"}`,
    );
    return { sent: false, reason: "rejected" };
  }
};
