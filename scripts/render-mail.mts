import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { type Mail, renderMail } from "../lib/mail/render.tsx";

/**
 * Renders every mail to out/mail as HTML and as text, so the templates can be
 * opened, measured and read without a key and without sending anything, and
 * fails the moment one of them breaks a rule that only shows up in an inbox.
 *
 * Run it as: pnpm mail:preview
 */

/** Gmail truncates a message above this and hides the rest behind a link. */
const GMAIL_CLIP_LIMIT_BYTES = 102 * 1024;

const SITE_URL = "https://voxaudax.de";

/**
 * Strings that would mean a template had leaked a credential. None of them is
 * reachable through any template's props; the check is here so that stays true.
 */
const NEVER_IN_A_MAIL = ["Herbst-Ausgabe-2026", "re_", "RESEND_API_KEY"];

const approvedAt = new Date("2026-09-21T16:04:00Z");

const previews: ReadonlyArray<{ name: string; mail: Mail }> = [
  {
    name: "approval-article",
    mail: {
      template: "approval",
      props: {
        siteUrl: SITE_URL,
        reviewer: { name: "Mira Özkan", roleLabel: "Redakteurin" },
        approvedAt,
        item: {
          kind: "article",
          title: "Was die Wahlrechtsreform für Erstwähler bedeutet",
          category: "Politik & Gesellschaft",
          author: "Jonas Weidmann",
          url: `${SITE_URL}/artikel/wahlrechtsreform-erstwaehler`,
        },
      },
    },
  },
  {
    name: "approval-meme",
    mail: {
      template: "approval",
      props: {
        siteUrl: SITE_URL,
        reviewer: { name: "Lina Brenner", roleLabel: "Chefredakteurin" },
        approvedAt: new Date("2026-09-21T16:11:00Z"),
        item: {
          kind: "meme",
          uploader: "Tom Kessler",
          url: `${SITE_URL}/memes`,
          preview: {
            url: `${SITE_URL}/medien/memes/vertretungsplan.png`,
            alt: "Freigegebenes Meme über den Vertretungsplan",
            width: 1080,
            height: 1350,
          },
        },
      },
    },
  },
  {
    name: "invitation-7-days",
    mail: {
      template: "invitation",
      props: {
        siteUrl: SITE_URL,
        firstName: "Tom",
        invitedBy: "Lina Brenner",
        roleLabel: "Autor",
        passwordUrl: `${SITE_URL}/admin/einladung/8f3a1c2d4e5b6a7c`,
        validity: "7-days",
      },
    },
  },
  {
    name: "invitation-24-hours",
    mail: {
      template: "invitation",
      props: {
        siteUrl: SITE_URL,
        firstName: "Mira",
        invitedBy: "Lina Brenner",
        roleLabel: "Redakteurin",
        passwordUrl: `${SITE_URL}/admin/einladung/1b9d3f7a5c2e4086`,
        validity: "24-hours",
      },
    },
  },
  {
    name: "password-changed-by-admin",
    mail: {
      template: "passwordChangedByAdmin",
      props: {
        siteUrl: SITE_URL,
        firstName: "Mira",
        changedBy: { name: "Lina Brenner", pronoun: "ihr" },
        changedAt: new Date("2026-09-21T16:22:00Z"),
        loginUrl: `${SITE_URL}/admin`,
      },
    },
  },
  {
    name: "password-reset",
    mail: {
      template: "passwordReset",
      props: {
        siteUrl: SITE_URL,
        firstName: "Mira",
        resetUrl: `${SITE_URL}/admin/passwort/8f3ac41d7b25e690`,
      },
    },
  },
];

const escapeForMarkup = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#x27;");

const linkIn = (mail: Mail) => {
  switch (mail.template) {
    case "approval":
      return mail.props.item.url;
    case "invitation":
      return mail.props.passwordUrl;
    case "passwordChangedByAdmin":
      return mail.props.loginUrl;
    case "passwordReset":
      return mail.props.resetUrl;
  }
};

const problemsWith = (
  mail: Mail,
  rendered: Awaited<ReturnType<typeof renderMail>>,
  bytes: number,
) => {
  const problems: string[] = [];

  if (bytes >= GMAIL_CLIP_LIMIT_BYTES) {
    problems.push(`${bytes} bytes — Gmail would clip this`);
  }
  if (!rendered.html.includes(escapeForMarkup(rendered.preheader))) {
    problems.push("the preheader is missing from the markup");
  }
  if (rendered.text.trim() === "") {
    problems.push("the plaintext part is empty");
  }
  if (!rendered.text.includes(linkIn(mail))) {
    problems.push("the plaintext part does not spell out the link");
  }
  // The subject and the preheader are the two places a leak would be most
  // visible and the only two that never reach the rendered files, so they are
  // scanned from the rendered object rather than from what was written out.
  const everythingTheRecipientSees = [
    rendered.html,
    rendered.text,
    rendered.subject,
    rendered.preheader,
  ];

  for (const secret of NEVER_IN_A_MAIL) {
    const where = ["the markup", "the plaintext", "the subject", "the preheader"]
      .filter((_, index) => everythingTheRecipientSees[index].includes(secret));

    if (where.length > 0) {
      problems.push(`it contains "${secret}" in ${where.join(" and ")}`);
    }
  }

  return problems;
};

const outputDirectory = join("out", "mail");
await mkdir(outputDirectory, { recursive: true });

const failures: string[] = [];

for (const { name, mail } of previews) {
  const rendered = await renderMail(mail);
  const bytes = Buffer.byteLength(rendered.html, "utf8");

  await writeFile(join(outputDirectory, `${name}.html`), rendered.html, "utf8");
  await writeFile(join(outputDirectory, `${name}.txt`), rendered.text, "utf8");

  const problems = problemsWith(mail, rendered, bytes);
  const percentOfLimit = ((bytes / GMAIL_CLIP_LIMIT_BYTES) * 100).toFixed(1);

  console.log(
    `${name.padEnd(26)} ${String(bytes).padStart(6)} bytes  ${percentOfLimit.padStart(5)}% of the Gmail limit  ${problems.length === 0 ? "ok" : "FAILED"}`,
  );
  console.log(`${" ".repeat(28)}subject: ${rendered.subject}`);

  for (const problem of problems) {
    console.error(`${" ".repeat(28)}${problem}`);
    failures.push(`${name}: ${problem}`);
  }
}

console.log(`\nWritten to ${outputDirectory}/`);

if (failures.length > 0) process.exit(1);
