import "server-only";
import { asc, eq, sql } from "drizzle-orm";

import type { Member } from "@/lib/authorize";
import { db } from "@/lib/db/client";
import { articles, invitations, memes, users } from "@/lib/db/schema";
import type { Form, Role } from "@/lib/roles";

/**
 * Screen 8a's "Zuletzt heute" column. The session rows belong to @velve/auth
 * and are read and never written here; `auth.session.list` answers for the
 * caller's own account only, which is the right shape for screen 8c and the
 * wrong one for a list of everybody.
 *
 * Typed as the text it is. Drizzle decodes a column it knows from the schema,
 * but a raw expression it hands back exactly as the driver produced it — and
 * the driver is told to leave `timestamptz` as the string Postgres sent. A
 * `sql<Date>` here would have been an assertion and not a conversion, and the
 * page calling `getTime()` on it threw the moment any member had ever signed
 * in. `listMembers` converts instead, which is also the only place that knows
 * the row may have no session at all.
 */
const lastSeen = sql<string | null>`(
  select max(s.last_used_at) from velve.session s where s.user_id = ${users.velveUserId}
)`;

export const listMembers = async () => {
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      initials: users.initials,
      role: users.role,
      form: users.form,
      status: users.status,
      invitedAt: users.invitedAt,
      velveUserId: users.velveUserId,
      lastSeenAt: lastSeen,
    })
    .from(users)
    .orderBy(asc(users.name));

  return rows.map((row) => ({
    ...row,
    lastSeenAt: row.lastSeenAt === null ? null : new Date(row.lastSeenAt),
  }));
};

export type MemberRow = Awaited<ReturnType<typeof listMembers>>[number];

export const findMemberById = async (memberId: string) => {
  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      initials: users.initials,
      role: users.role,
      form: users.form,
      status: users.status,
      velveUserId: users.velveUserId,
    })
    .from(users)
    .where(eq(users.id, memberId));

  return row ?? null;
};

export const countMembers = async () => {
  const [row] = await db
    .select({
      admin: sql<number>`count(*) filter (where ${users.role} = 'admin')`.mapWith(Number),
      redakteur: sql<number>`count(*) filter (where ${users.role} = 'redakteur')`.mapWith(Number),
      autor: sql<number>`count(*) filter (where ${users.role} = 'autor')`.mapWith(Number),
      invited: sql<number>`count(*) filter (where ${users.status} = 'eingeladen')`.mapWith(Number),
    })
    .from(users);

  return row ?? { admin: 0, redakteur: 0, autor: 0, invited: 0 };
};

export const updateOwnProfile = (member: Member, input: {
  readonly name: string;
  readonly bio: string | null;
}) =>
  db
    .update(users)
    .set({ name: input.name, bio: input.bio })
    .where(eq(users.id, member.id));

export const setRoleAndForm = (memberId: string, role: Role, form: Form) =>
  db.update(users).set({ role, form }).where(eq(users.id, memberId));

export const setMustChangePassword = (memberId: string, mustChange: boolean) =>
  db.update(users).set({ mustChangePassword: mustChange }).where(eq(users.id, memberId));

/** The open invitation behind a row screen 8a shows as "Eingeladen" or "Abgelaufen". */
export const openInvitationFor = async (email: string) => {
  const [row] = await db
    .select({
      id: invitations.id,
      expiresAt: invitations.expiresAt,
      createdAt: invitations.createdAt,
    })
    .from(invitations)
    .where(sql`${invitations.email} = ${email} and ${invitations.acceptedAt} is null`)
    .orderBy(sql`${invitations.createdAt} desc`)
    .limit(1);

  return row ?? null;
};

/**
 * What would stop this person's row from being deleted. Articles and memes
 * reference `users` with `on delete restrict`, and that is right: a byline and
 * a credit are things an application should not be able to lose by accident.
 *
 * Invitations reference it the same way but are not a blocker. They are
 * operational rows, not a record worth keeping — and treating them as one made
 * every admin who had ever invited anybody permanently undeletable, which is
 * every admin after a term. They are removed with the person instead, and the
 * dialog says so before it is confirmed.
 *
 * Asked before the delete rather than after: a foreign key violation names a
 * constraint and nothing a person can act on.
 */
export const deletionBlockers = async (memberId: string) => {
  const [row] = await db
    .select({
      articles: sql<number>`(select count(*)::int from ${articles} where ${articles.authorId} = ${memberId})`,
      memes: sql<number>`(select count(*)::int from ${memes} where ${memes.createdBy} = ${memberId})`,
    })
    .from(users)
    .where(eq(users.id, memberId));

  return row ?? { articles: 0, memes: 0 };
};

/**
 * The editorial row and the invitations this person sent, together or not at
 * all. The account in the `velve` schema is the library's to remove and
 * removing it cascades this row away — so a caller with an account deletes the
 * invitations here first and the account afterwards.
 */
export const deleteInvitationsFrom = (memberId: string) =>
  db.delete(invitations).where(eq(invitations.invitedBy, memberId));

export const deleteMemberRow = (memberId: string) =>
  db.delete(users).where(eq(users.id, memberId));
