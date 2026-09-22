import "server-only";
import { and, eq, ne } from "drizzle-orm";

import type { Member } from "@/lib/authorize";
import { db } from "@/lib/db/client";
import { articles, categories, images, memes, users } from "@/lib/db/schema";
import { siteUrl } from "@/lib/env";
import type { MailDelivery } from "@/lib/mail";
import type { InvitationValidity } from "@/lib/mail/templates/invitation";
import { roleLabel } from "@/lib/roles";
import type { Form, Role } from "@/lib/roles";

/**
 * The mails the back office sends about itself. Screens 8b, 11b and 12a all
 * drew one and none of them ever went out: the templates were written, rendered
 * and checked, and nothing called them.
 *
 * Nothing here throws. An invitation that could not be mailed is still an
 * invitation — the link is on screen — and an article that is published stays
 * published whether or not the newsroom heard about it. Every failure is a line
 * in the log and a `false` to the caller, never an exception into an action
 * that has already written to the database.
 */

const link = (path: string) => new URL(path, siteUrl()).toString();

const send = async (what: string, delivery: MailDelivery) => {
  try {
    const sendMail = await loadSender();
    await sendMail(delivery);
    return true;
  } catch (cause) {
    console.error("error", `the ${what} mail did not go out`, { cause });
    return false;
  }
};

/**
 * Loaded when a mail is actually sent, so that importing this module costs
 * neither React nor the mail renderer — the same reason `lib/auth-delivery`
 * does it.
 */
const loadSender = async () => (await import("@/lib/mail")).sendMail;

const firstNameOf = (name: string) => name.trim().split(/\s+/)[0] ?? name;

/** Everybody the back office tells about a freigabe, beside the person who submitted. */
const everyAdmin = async () =>
  (
    await db
      .select({ email: users.email })
      .from(users)
      .where(and(eq(users.role, "admin"), eq(users.status, "aktiv")))
  ).map((row) => row.email);

/* -------------------------------------------------------------------------
 * 8b — the invitation
 * ---------------------------------------------------------------------- */

export const announceInvitation = async (input: {
  readonly invitedBy: Member;
  readonly to: string;
  readonly name: string;
  readonly role: Role;
  readonly form: Form;
  readonly validity: InvitationValidity;
  readonly path: string;
}) =>
  send("invitation", {
    to: [input.to],
    mail: {
      template: "invitation",
      props: {
        siteUrl: siteUrl(),
        to: input.to,
        firstName: firstNameOf(input.name),
        invitedBy: input.invitedBy.name,
        // The role as it will be written on the person, not the enum value:
        // "Autor", "Redakteurin", "Chefredaktion".
        roleLabel: roleLabel(input.role, input.form),
        passwordUrl: link(input.path),
        validity: input.validity,
      },
    },
  });

/* -------------------------------------------------------------------------
 * 11b — the freigabe
 * ---------------------------------------------------------------------- */

const reviewerOf = (approver: Member) => ({
  name: approver.name,
  roleLabel: roleLabel(approver.role, approver.form),
});

export const approvedArticleMail = async (
  approver: Member,
  articleId: string,
): Promise<MailDelivery | null> => {
  const [row] = await db
    .select({
      title: articles.title,
      slug: articles.slug,
      category: categories.name,
      author: users.name,
      authorEmail: users.email,
    })
    .from(articles)
    .innerJoin(categories, eq(categories.id, articles.categoryId))
    .innerJoin(users, eq(users.id, articles.authorId))
    .where(eq(articles.id, articleId));

  if (row === undefined) return null;

  const admins = await everyAdmin();

  return {
    // Deduplicated by `sendMail`, which matters here: the author is usually
    // one of the admins the same mail is going to.
    to: [...admins, row.authorEmail],
    mail: {
      template: "approval",
      props: {
        siteUrl: siteUrl(),
        submitterEmail: row.authorEmail,
        reviewer: reviewerOf(approver),
        approvedAt: new Date(),
        item: {
          kind: "article",
          title: row.title,
          category: row.category,
          author: row.author,
          url: link(`/artikel/${row.slug}`),
        },
      },
    },
  };
};

export const announceApprovedArticle = async (approver: Member, articleId: string) => {
  const delivery = await approvedArticleMail(approver, articleId);
  return delivery === null ? false : send("approval", delivery);
};

export const approvedMemeMail = async (
  approver: Member,
  memeId: string,
): Promise<MailDelivery | null> => {
  const [row] = await db
    .select({
      imageId: memes.imageId,
      alt: images.alt,
      width: images.width,
      height: images.height,
      uploader: users.name,
      uploaderEmail: users.email,
    })
    .from(memes)
    .innerJoin(images, eq(images.id, memes.imageId))
    .innerJoin(users, eq(users.id, memes.createdBy))
    .where(eq(memes.id, memeId));

  if (row === undefined) return null;

  const admins = await everyAdmin();

  return {
    to: [...admins, row.uploaderEmail],
    mail: {
      template: "approval",
      props: {
        siteUrl: siteUrl(),
        submitterEmail: row.uploaderEmail,
        reviewer: reviewerOf(approver),
        approvedAt: new Date(),
        item: {
          kind: "meme",
          uploader: row.uploader,
          url: link("/memes"),
          preview: {
            // Absolute: a mail has no origin to resolve a path against.
            url: link(`/bild/${row.imageId}`),
            alt: row.alt ?? "Freigegebenes Meme",
            width: row.width,
            height: row.height,
          },
        },
      },
    },
  };
};

export const announceApprovedMeme = async (approver: Member, memeId: string) => {
  const delivery = await approvedMemeMail(approver, memeId);
  return delivery === null ? false : send("approval", delivery);
};

/* -------------------------------------------------------------------------
 * 12a — an admin set somebody's password
 * ---------------------------------------------------------------------- */

/**
 * 12a says "Du bekommst es persönlich von ihr". The editorial team also knows a
 * neutral form, which the design does not draw and for which no German pronoun
 * reads cleanly in that sentence — the template says the name there instead.
 */
const PRONOUNS: Record<Form, "ihr" | "ihm" | null> = {
  weiblich: "ihr",
  maennlich: "ihm",
  neutral: null,
};

export const announcePasswordChange = async (input: {
  readonly changedBy: Member;
  readonly memberId: string;
}) => {
  const [row] = await db
    .select({ name: users.name, email: users.email })
    .from(users)
    .where(and(eq(users.id, input.memberId), ne(users.id, input.changedBy.id)));

  // Changing your own password is not news you have to be told.
  if (row === undefined) return false;

  return send("password change", {
    to: [row.email],
    mail: {
      template: "passwordChangedByAdmin",
      props: {
        siteUrl: siteUrl(),
        to: row.email,
        firstName: firstNameOf(row.name),
        changedBy: {
          name: input.changedBy.name,
          pronoun: PRONOUNS[input.changedBy.form],
        },
        changedAt: new Date(),
        loginUrl: link("/admin"),
      },
    },
  });
};
