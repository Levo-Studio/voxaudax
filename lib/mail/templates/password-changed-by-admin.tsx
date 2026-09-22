import { germanDate, germanTime } from "@/lib/mail/format";
import type { MailTemplate } from "@/lib/mail/template";
import { SIGNATURE, labelled, plainText } from "@/lib/mail/text";
import {
  ActionButton,
  type Fact,
  FactList,
  ClosingNote,
  Paragraph,
} from "@/lib/mail/ui";

/**
 * The closing sentence of the design says the new password comes "persönlich
 * von ihr", so the admin's pronoun is part of the message and cannot be
 * guessed from a name.
 */
type ChangingAdmin = { name: string; pronoun: "ihr" | "ihm" | null };

/**
 * 12a writes "Du bekommst es persönlich von ihr." The editorial team also
 * knows a neutral form, which the design does not draw and for which no
 * German pronoun reads cleanly in this sentence — so that one case says the
 * name instead. The two forms the design does cover keep its wording exactly.
 */
const handedOverBy = ({ name, pronoun }: ChangingAdmin) => pronoun ?? name;

export type PasswordChangedByAdminProps = {
  siteUrl: string;
  /** Shown in the grey line above the subject, as 12a and 12b draw it. */
  to: string;
  firstName: string;
  changedBy: ChangingAdmin;
  changedAt: Date;
  loginUrl: string;
};

const changeSentence = ({
  changedBy,
  changedAt,
}: PasswordChangedByAdminProps) =>
  `${changedBy.name} hat am ${germanDate(changedAt)} um ${germanTime(changedAt)} ein neues Passwort für deinen Zugang gesetzt. Du bekommst es persönlich von ${handedOverBy(changedBy)}.`;

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

    addressLine: (props) => `An ${props.to}`,

    preheader: (props) =>
      `${props.changedBy.name} hat es am ${germanDate(props.changedAt)} um ${germanTime(props.changedAt)} gesetzt. Alle Sitzungen sind beendet.`,

    body: (props) => (
      <>
        <Paragraph spaced={false}>
          {`Hallo ${props.firstName},`}
          <br />
          {changeSentence(props)}
        </Paragraph>
        <FactList facts={facts(props)} labelWidth={110} />
        <ActionButton href={props.loginUrl} label="Zur Anmeldung" />
        <ClosingNote>{WARNING}</ClosingNote>
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
