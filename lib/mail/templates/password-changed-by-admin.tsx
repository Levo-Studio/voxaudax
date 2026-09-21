import { germanDate, germanTime } from "@/lib/mail/format";
import type { MailTemplate } from "@/lib/mail/template";
import { SIGNATURE, labelled, plainText } from "@/lib/mail/text";
import {
  ActionButton,
  type Fact,
  FactList,
  Note,
  Paragraph,
  PartingRule,
  SpelledOutLink,
} from "@/lib/mail/ui";

/**
 * The closing sentence of the design says the new password comes "persönlich
 * von ihr", so the admin's pronoun is part of the message and cannot be
 * guessed from a name.
 */
type ChangingAdmin = { name: string; pronoun: "ihr" | "ihm" };

export type PasswordChangedByAdminProps = {
  siteUrl: string;
  firstName: string;
  changedBy: ChangingAdmin;
  changedAt: Date;
  loginUrl: string;
};

const changeSentence = ({
  changedBy,
  changedAt,
}: PasswordChangedByAdminProps) =>
  `${changedBy.name} hat am ${germanDate(changedAt)} um ${germanTime(changedAt)} ein neues Passwort für deinen Zugang gesetzt. Du bekommst es persönlich von ${changedBy.pronoun}.`;

const facts = ({ changedBy }: PasswordChangedByAdminProps): readonly Fact[] => [
  { label: "Geändert von", value: changedBy.name },
  { label: "Sitzungen", value: "alle beendet" },
  { label: "Nächster Login", value: "Passwort ändern" },
];

const WARNING =
  "Das warst nicht du und du hast auch nichts vereinbart? Melde dich sofort bei der Chefredaktion. In dieser Mail steht nie ein Passwort.";

export const passwordChangedByAdminMail: MailTemplate<PasswordChangedByAdminProps> =
  {
    subject: () => "Dein Passwort wurde geändert",

    preheader: (props) =>
      `${props.changedBy.name} hat es am ${germanDate(props.changedAt)} um ${germanTime(props.changedAt)} gesetzt. Alle Sitzungen sind beendet.`,

    body: (props) => (
      <>
        <Paragraph spaced={false}>
          {`Hallo ${props.firstName},`}
          <br />
          {changeSentence(props)}
        </Paragraph>
        <FactList facts={facts(props)} />
        <ActionButton href={props.loginUrl} label="Zur Anmeldung" />
        <SpelledOutLink href={props.loginUrl} />
        <PartingRule />
        <Note>{WARNING}</Note>
      </>
    ),

    text: (props) =>
      plainText([
        `Hallo ${props.firstName},`,
        changeSentence(props),
        facts(props).map((fact) => labelled(fact.label, fact.value)),
        ["Zur Anmeldung:", props.loginUrl],
        WARNING,
        SIGNATURE,
      ]),
  };
