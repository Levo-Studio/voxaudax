import { germanMoment } from "@/lib/mail/format";
import type { MailTemplate } from "@/lib/mail/template";
import { SIGNATURE, labelled, plainText } from "@/lib/mail/text";
import {
  ActionButton,
  Emphasis,
  type Fact,
  FactList,
  BannerImage,
  Paragraph,
  type PreviewImage,
  SpelledOutLink,
} from "@/lib/mail/ui";

type Reviewer = { name: string; roleLabel: string };

type ApprovedArticle = {
  kind: "article";
  title: string;
  category: string;
  author: string;
  url: string;
};

type ApprovedMeme = {
  kind: "meme";
  uploader: string;
  url: string;
  preview: PreviewImage;
};

/**
 * Article and meme share everything but three lines, so they are one template
 * with a discriminated union rather than two files that would drift apart:
 * the same reviewer sentence, the same summary box, the same button, the same
 * spelled-out link. What differs — the noun, the labels of the summary and the
 * preview a meme carries — reads better next to its counterpart than it would
 * duplicated.
 */
export type ApprovalProps = {
  siteUrl: string;
  /** The address of the person who submitted it; 11b names them in the line. */
  submitterEmail: string;
  reviewer: Reviewer;
  approvedAt: Date;
  item: ApprovedArticle | ApprovedMeme;
};

const reviewerFact = (reviewer: Reviewer): Fact => ({
  label: "Geprüft",
  value: `${reviewer.name} · ${reviewer.roleLabel}`,
});

const facts = ({ reviewer, item }: ApprovalProps): readonly Fact[] =>
  item.kind === "article"
    ? [
        { label: "Geschrieben", value: item.author },
        reviewerFact(reviewer),
        { label: "Kategorie", value: item.category },
      ]
    : [
        { label: "Hochgeladen", value: item.uploader },
        reviewerFact(reviewer),
      ];

/**
 * Split so that the markup can set the reviewer's name in bold and the
 * plaintext part can write the very same sentence without a second copy of it.
 */
const announcement = ({ reviewer, approvedAt, item }: ApprovalProps) => ({
  actor: reviewer.name,
  rest:
    item.kind === "article"
      ? ` hat den Artikel freigegeben. Er ist seit ${germanMoment(approvedAt)} öffentlich.`
      : ` hat das Meme freigegeben. Es steht seit ${germanMoment(approvedAt)} in der Galerie.`,
});

const buttonLabel = (item: ApprovalProps["item"]) =>
  item.kind === "article" ? "Artikel ansehen" : "Galerie öffnen";

export const approvalMail: MailTemplate<ApprovalProps> = {
  subject: ({ item }) =>
    item.kind === "article"
      ? `Online: „${item.title}“`
      : "Online: neues Meme in der Galerie",

  // 11b: "An alle Admins und jonas.weidmann@voxaudax.de".
  addressLine: (props) => `An alle Admins und ${props.submitterEmail}`,

  preheader: (props) =>
    props.item.kind === "article"
      ? `Freigegeben von ${props.reviewer.name} · ${props.reviewer.roleLabel} · ${props.item.category}`
      : `Freigegeben von ${props.reviewer.name} · ${props.reviewer.roleLabel} · hochgeladen von ${props.item.uploader}`,

  banner: ({ item }) =>
    item.kind === "meme" ? <BannerImage image={item.preview} /> : null,

  body: (props) => {
    const { item } = props;
    const { actor, rest } = announcement(props);

    return (
      <>
        <Paragraph spaced={false}>
          <Emphasis>{actor}</Emphasis>
          {rest}
        </Paragraph>
        {/* 74px on the article, 96px on the meme — the design measures the
            label column per screen so the values line up under one another. */}
        <FactList facts={facts(props)} labelWidth={item.kind === "article" ? 74 : 96} />
        <ActionButton href={item.url} label={buttonLabel(item)} />
        <SpelledOutLink href={item.url} />
      </>
    );
  },

  text: (props) => {
    const { actor, rest } = announcement(props);

    return plainText([
      `${actor}${rest}`,
      facts(props).map((fact) => labelled(fact.label, fact.value)),
      [`${buttonLabel(props.item)}:`, props.item.url],
      SIGNATURE,
    ]);
  },
};
