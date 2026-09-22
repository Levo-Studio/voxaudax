import type { MailTemplate } from "@/lib/mail/template";
import { SIGNATURE, labelled, plainText } from "@/lib/mail/text";
import { ClosingNote, type Fact, FactList, Paragraph } from "@/lib/mail/ui";

/**
 * The one message the public site sends, and the only one whose sender is not
 * this application but a reader. It went out as bare text for a while, past the
 * six templates standing beside it — so the editors got a wall of lines where
 * every other mail from the same newspaper carried its shape.
 *
 * What it does not carry is a button. Every other template ends in one action;
 * this one ends in a reply, and the reply address is the envelope's, not a link
 * in the body.
 */
export type EditorialMessageProps = {
  siteUrl: string;
  to: string;
  name: string;
  /** Class or role — the form leaves it optional, so it may be empty. */
  role: string;
  email: string;
  subject: string;
  body: string;
};

const facts = (props: EditorialMessageProps): readonly Fact[] => [
  { label: "Name", value: props.name },
  ...(props.role.trim().length === 0
    ? []
    : [{ label: "Klasse oder Rolle", value: props.role }]),
  { label: "E-Mail", value: props.email },
  { label: "Anliegen", value: props.subject },
];

const OPENING = "über das Kontaktformular ist eine Nachricht gekommen.";

const REPLY =
  "Eine Antwort auf diese Mail geht an die Adresse oben — sie steht als Antwortadresse im Umschlag, ohne dass jemand sie abtippen muss.";

export const editorialMessageMail: MailTemplate<EditorialMessageProps> = {
  subject: (props) => `${props.subject}: ${props.name}`,

  addressLine: (props) => `An ${props.to}`,

  preheader: (props) => `${props.name} schreibt: ${props.subject}`,

  body: (props) => (
    <>
      <Paragraph spaced={false}>{`Hallo, `}{OPENING}</Paragraph>

      {/* "Klasse oder Rolle" is the longest label this box can carry. */}
      <FactList facts={facts(props)} labelWidth={130} />

      {/* Whatever was typed, line for line. Never markup: this text comes from
          the open web, and the one place it is allowed to be is text. */}
      <Paragraph>
        <span style={{ whiteSpace: "pre-wrap" }}>{props.body}</span>
      </Paragraph>

      <ClosingNote>{REPLY}</ClosingNote>
    </>
  ),

  text: (props) =>
    plainText([
      "Hallo,",
      OPENING,
      facts(props).map((fact) => labelled(fact.label, fact.value)),
      props.body,
      REPLY,
      SIGNATURE,
    ]),
};
