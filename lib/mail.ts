import "server-only";
import { Resend } from "resend";

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
      result.error.issues.map(
        (issue) => `${issue.path.join(".")} ${issue.message}`,
      ),
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
