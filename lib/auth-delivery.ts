import "server-only";
import type { EmailMessage } from "@velve/auth";

import { db } from "@/lib/db/client";
import { environment } from "@/lib/env";

/**
 * The bridge between the two halves that were built and never joined: the
 * library hands out a message, `lib/mail.ts` knows how to send one, and until
 * now nothing carried a message from the first to the second. What stood here
 * instead was a throw whose text blamed a missing `RESEND_API_KEY` — a sentence
 * that was wrong with the key set and wrong without it, because the code never
 * looked at the key at all.
 *
 * It is imported dynamically from `lib/auth.ts`, and imports the sender the
 * same way, so that neither the authentication module nor this one drags in
 * React and the mail renderer until a message is actually being sent. The two
 * branches below that send nothing therefore need neither.
 */

/**
 * The templates greet by first name, which is what the person is called and
 * not what the address says. An address with no member row — an account that
 * only exists on the library's side — is greeted by the part before the @,
 * because a mail that opens "Hallo ," is worse than one that opens with a
 * login name.
 */
const firstNameFor = async (email: string) => {
  const member = await db.query.users.findFirst({
    columns: { name: true },
    where: (row, { eq }) => eq(row.email, email),
  });

  const written = member?.name.trim().split(/\s+/)[0];
  return written !== undefined && written.length > 0
    ? written
    : (email.split("@")[0] ?? email);
};

const linkTo = (path: string) =>
  new URL(path, environment().NEXT_PUBLIC_SITE_URL).toString();

export const deliverAuthMail = async (message: EmailMessage): Promise<void> => {
  switch (message.kind) {
    case "password_reset": {
      const { sendMail } = await import("@/lib/mail");

      await sendMail({
        to: [message.to],
        mail: {
          template: "passwordReset",
          props: {
            siteUrl: environment().NEXT_PUBLIC_SITE_URL,
            to: message.to,
            firstName: await firstNameFor(message.to),
            resetUrl: linkTo(`/admin/passwort/${message.token}`),
          },
        },
      });
      return;
    }

    /**
     * Screen 12b promises that a request tells nobody whether the address is
     * known. That promise is kept by both branches costing the same, so this
     * one may not be the branch that throws while the other sends: it returns
     * quietly. Nothing is written to an address with no account — there is no
     * name to greet, no link to offer and nothing the reader could do — and
     * `requestOwnReset` discards the outcome either way, so the caller cannot
     * tell the two apart.
     */
    case "request_for_unknown_address":
      return;

    /**
     * The remaining kinds belong to flows the back office does not offer:
     * signing up happens through an invitation and redeems its own
     * verification in the same request, addresses are not changed by their
     * owner, and there is no magic link. If one ever arrives here, the message
     * says which one and stops — rather than naming an environment variable
     * that has nothing to do with it.
     */
    default:
      throw new Error(
        `No template is wired for the "${message.kind}" message, so it was not sent.`,
      );
  }
};
