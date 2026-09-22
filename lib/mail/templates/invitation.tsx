import type { MailTemplate } from "@/lib/mail/template";
import { SIGNATURE, plainText } from "@/lib/mail/text";
import {
  ActionButton,
  Note,
  Paragraph,
} from "@/lib/mail/ui";

/** How long the invitation stays usable, as the admin chose when sending it. */
export type InvitationValidity = "24-hours" | "7-days";

export type InvitationProps = {
  siteUrl: string;
  firstName: string;
  invitedBy: string;
  roleLabel: string;
  passwordUrl: string;
  validity: InvitationValidity;
};

const validityLabel = (validity: InvitationValidity) =>
  validity === "24-hours" ? "24 Stunden" : "7 Tage";

const invitationSentence = ({ invitedBy, roleLabel }: InvitationProps) =>
  `${invitedBy} hat dich als ${roleLabel} zur Redaktion eingeladen. Über den Button setzt du dein Passwort.`;

const validitySentence = (props: InvitationProps) =>
  `Der Link gilt ${validityLabel(props.validity)} und lässt sich nur einmal verwenden. Wenn du nichts damit anfangen kannst, ignorier die Mail einfach.`;

/**
 * 8b draws this line **below** the mail card, next to it in the design
 * document — a note about how invitations work, in the same place and the same
 * grey as "Die E-Mail, die ankommt". It is not a line of the message, so it is
 * not rendered into one. The plaintext part keeps the address itself, because
 * a text mail has no button to carry it.
 */

export const invitationMail: MailTemplate<InvitationProps> = {
  subject: () => "Dein Zugang zur Vox-Audax-Redaktion",

  preheader: (props) =>
    `${props.invitedBy} hat dich als ${props.roleLabel} eingeladen. Der Link gilt ${validityLabel(props.validity)}.`,

  body: (props) => (
    <>
      <Paragraph spaced={false}>
        {`Hallo ${props.firstName},`}
        <br />
        {invitationSentence(props)}
      </Paragraph>
      <ActionButton href={props.passwordUrl} label="Passwort setzen" />
      <Note>{validitySentence(props)}</Note>
    </>
  ),

  text: (props) =>
    plainText([
      `Hallo ${props.firstName},`,
      invitationSentence(props),
      ["Passwort setzen:", props.passwordUrl],
      validitySentence(props),
      SIGNATURE,
    ]),
};
