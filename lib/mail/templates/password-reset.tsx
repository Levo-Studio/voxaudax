import type { MailTemplate } from "@/lib/mail/template";
import { SIGNATURE, plainText } from "@/lib/mail/text";
import {
  ActionButton,
  Note,
  Paragraph,
  PartingRule,
  SpelledOutLink,
} from "@/lib/mail/ui";

export type PasswordResetProps = {
  siteUrl: string;
  firstName: string;
  resetUrl: string;
};

const REQUEST =
  "du hast ein neues Passwort angefordert. Über den Button vergibst du es.";

const VALIDITY =
  "Der Link gilt eine Stunde und lässt sich nur einmal verwenden. Dein bisheriges Passwort bleibt gültig, bis du ein neues gesetzt hast.";

const UNREQUESTED =
  "Du hast das nicht angefordert? Dann ignorier die Mail — ohne den Link ändert sich nichts.";

export const passwordResetMail: MailTemplate<PasswordResetProps> = {
  subject: () => "Neues Passwort für deinen Redaktionszugang",

  preheader: () =>
    "Der Link gilt eine Stunde und lässt sich nur einmal verwenden.",

  body: (props) => (
    <>
      <Paragraph spaced={false}>
        {`Hallo ${props.firstName},`}
        <br />
        {REQUEST}
      </Paragraph>
      <ActionButton href={props.resetUrl} label="Neues Passwort setzen" />
      <SpelledOutLink href={props.resetUrl} />
      <Note>{VALIDITY}</Note>
      <PartingRule />
      <Note>{UNREQUESTED}</Note>
    </>
  ),

  text: (props) =>
    plainText([
      `Hallo ${props.firstName},`,
      REQUEST,
      ["Neues Passwort setzen:", props.resetUrl],
      VALIDITY,
      UNREQUESTED,
      SIGNATURE,
    ]),
};
