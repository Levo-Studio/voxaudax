import "server-only";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";

import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { may, type Capability, type Form, type Role } from "@/lib/roles";
import { resolveSession } from "@/lib/session";

export type Member = {
  readonly id: string;
  readonly velveUserId: string;
  readonly email: string;
  readonly name: string;
  readonly initials: string;
  readonly role: Role;
  readonly form: Form;
  readonly bio: string | null;
  readonly mustChangePassword: boolean;
};

/**
 * The whole of the back office reads its caller from here. A page or an action
 * that wants a row asks for a `Member` first, and every query below takes one,
 * so there is no path to editorial data that has not been through this file.
 */
export const currentMember = cache(async (): Promise<Member | null> => {
  const resolved = await resolveSession();
  if (resolved === null) return null;

  const [member] = await db
    .select({
      id: users.id,
      velveUserId: users.velveUserId,
      email: users.email,
      name: users.name,
      initials: users.initials,
      role: users.role,
      form: users.form,
      bio: users.bio,
      mustChangePassword: users.mustChangePassword,
    })
    .from(users)
    .where(eq(users.velveUserId, resolved.user.id));

  // An account in the `velve` schema with no editorial row is not a member of
  // the editorial team, whatever it can sign in as.
  if (member === undefined || member.velveUserId === null) return null;

  return { ...member, velveUserId: member.velveUserId };
});

export const ACCOUNT_PATH = "/admin/konto";

/**
 * Everything behind the login goes through this. A caller with no session is
 * sent to the login; one whose password was set for them by an admin gets no
 * further than the account page until they have replaced it (screen 12a).
 */
export const requireMember = async (
  options: { readonly allowForcedPasswordChange?: boolean } = {},
): Promise<Member> => {
  const member = await currentMember();
  if (member === null) redirect("/admin");

  if (member.mustChangePassword && options.allowForcedPasswordChange !== true) {
    redirect(ACCOUNT_PATH);
  }

  return member;
};

/**
 * A refusal is `notFound`, never a message. Screen 7c promises that another
 * author's draft is "weder sichtbar noch aufrufbar", and a 403 that names the
 * article would still be an answer about it.
 */
export const requireCapability = async (
  capability: Capability,
): Promise<Member> => {
  const member = await requireMember();
  if (!may(member.role, capability)) notFound();
  return member;
};

export const refuse = (): never => notFound();
