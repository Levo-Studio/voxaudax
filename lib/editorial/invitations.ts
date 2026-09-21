import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

import { and, eq, isNull, sql } from "drizzle-orm";

import type { Member } from "@/lib/authorize";
import { tokenOf, withCapturedMail } from "@/lib/auth-mail";
import { velveAuth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { invitations, users } from "@/lib/db/schema";
import type { Form, Role } from "@/lib/roles";
import type { LinkLifetimeHours } from "@/lib/editorial/vocabulary";

export { LINK_LIFETIMES, isLinkLifetime, type LinkLifetimeHours } from "@/lib/editorial/vocabulary";

const digest = (token: string) => createHash("sha256").update(token, "utf8").digest();

export const invitationPath = (token: string) => `/admin/einladung/${token}`;

export const issueInvitation = async (input: {
  readonly invitedBy: Member;
  readonly email: string;
  readonly name: string;
  readonly initials: string;
  readonly role: Role;
  readonly form: Form;
  readonly hours: LinkLifetimeHours;
}) => {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + input.hours * 60 * 60 * 1000);

  await db.transaction(async (tx) => {
    // Issuing again supersedes the open link rather than adding a second one,
    // which is what makes "Erneut senden" invalidate what was sent before.
    await tx
      .delete(invitations)
      .where(and(eq(invitations.email, input.email), isNull(invitations.acceptedAt)));

    await tx.insert(invitations).values({
      email: input.email,
      name: input.name,
      role: input.role,
      form: input.form,
      tokenSha256: digest(token),
      expiresAt,
      invitedBy: input.invitedBy.id,
    });

    await tx
      .insert(users)
      .values({
        email: input.email,
        name: input.name,
        initials: input.initials,
        role: input.role,
        form: input.form,
        status: "eingeladen",
        invitedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: users.email,
        // An account that already exists keeps its role: an invitation is not a
        // way to promote somebody who is already signed in somewhere.
        set: {
          name: sql`case when ${users.status} = 'eingeladen' then excluded.name else ${users.name} end`,
          role: sql`case when ${users.status} = 'eingeladen' then excluded.role else ${users.role} end`,
          form: sql`case when ${users.status} = 'eingeladen' then excluded.form else ${users.form} end`,
          invitedAt: sql`excluded.invited_at`,
        },
      });
  });

  return { token, expiresAt };
};

export type OpenInvitation = {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly role: Role;
  readonly form: Form;
  readonly invitedByName: string;
};

/**
 * The stored digest is compared in constant time, so the time an answer takes
 * says nothing about how many leading bytes of a guess were right.
 */
export const openInvitation = async (token: string): Promise<OpenInvitation | null> => {
  const wanted = digest(token);

  const rows = await db
    .select({
      id: invitations.id,
      email: invitations.email,
      name: invitations.name,
      role: invitations.role,
      form: invitations.form,
      tokenSha256: invitations.tokenSha256,
      invitedByName: users.name,
    })
    .from(invitations)
    .innerJoin(users, eq(users.id, invitations.invitedBy))
    .where(
      and(
        isNull(invitations.acceptedAt),
        sql`${invitations.expiresAt} > now()`,
        eq(invitations.tokenSha256, wanted),
      ),
    );

  const row = rows.find((candidate) => timingSafeEqual(candidate.tokenSha256, wanted));
  if (row === undefined) return null;

  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    form: row.form,
    invitedByName: row.invitedByName,
  };
};

export type RedemptionOutcome =
  | { readonly accepted: true; readonly sessionToken: string; readonly lifetimeSeconds: number }
  | { readonly accepted: false; readonly reason: "unusable_link" | "address_in_use" };

/**
 * Setting the password for the first time, which is also where the account in
 * the `velve` schema comes into existence.
 *
 * Two things the library is explicit about and that are handled here rather
 * than assumed away:
 *
 *  - A registration on an address that already has an account answers
 *    byte-identically to a success and is rolled back, so `user.id` and the
 *    session token would name nothing. The session is resolved before a single
 *    row of ours is written, and a session that resolves to nothing is that
 *    case and not a success.
 *
 *  - Sign-up mints an `email_verify` artefact. Under S-LINK-4 an address
 *    confirmed for the first time *without* the session that wrote the password
 *    deletes that password and revokes every session — so the artefact is
 *    redeemed here, in that very session, rather than left live for somebody to
 *    click weeks later on a device where they are not signed in.
 */
export const redeemInvitation = async (input: {
  readonly token: string;
  readonly password: string;
  readonly call: { readonly origin: string; readonly ipAddress?: string | null; readonly userAgent?: string | null };
}): Promise<RedemptionOutcome> => {
  const invitation = await openInvitation(input.token);
  if (invitation === null) return { accepted: false, reason: "unusable_link" };

  const auth = velveAuth();

  const { result, messages } = await withCapturedMail(() =>
    auth.signUp.withPassword({
      email: invitation.email,
      password: input.password,
      ...input.call,
    }),
  );

  const resolved = await auth.session.resolve({
    sessionToken: result.sessionToken,
    origin: input.call.origin,
  });

  if (resolved === null) return { accepted: false, reason: "address_in_use" };

  const verification = tokenOf(messages, "email_verification");
  if (verification !== undefined) {
    await auth.email.redeemVerification({
      token: verification,
      sessionToken: result.sessionToken,
      ...input.call,
    });
  }

  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({
        velveUserId: resolved.user.id,
        status: "aktiv",
        role: invitation.role,
        form: invitation.form,
        mustChangePassword: false,
      })
      .where(eq(users.email, invitation.email));

    await tx
      .update(invitations)
      .set({ acceptedAt: new Date() })
      .where(eq(invitations.id, invitation.id));
  });

  return {
    accepted: true,
    sessionToken: result.sessionToken,
    lifetimeSeconds: Math.max(
      1,
      Math.floor((result.session.absoluteExpiresAt.getTime() - Date.now()) / 1000),
    ),
  };
};
