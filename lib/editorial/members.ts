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

/**
 * Whether the row screen 8a shows as "Eingeladen" still has an invitation
 * behind it — without one it reads "Abgelaufen".
 *
 * Asked alongside the row and not once per row: the list already reads every
 * member, and a September that invites twenty-five people turned every render
 * of this page into twenty-five more round trips for a question that is one
 * `exists` on `invitations_open_idx`.
 */
const openInvitation = sql<boolean>`exists (
  select 1 from ${invitations}
  where ${invitations.email} = ${users.email} and ${invitations.acceptedAt} is null
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
      hasOpenInvitation: openInvitation,
    })
    .from(users)
    // People who have left sit at the bottom: they are on the list so that an
    // admin can see whose byline is still out there, not so that they compete
    // for attention with the people who are here.
    .orderBy(sql`${users.status} = 'ehemalig'`, asc(users.name));

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
      admin: sql<number>`count(*) filter (where ${users.role} = 'admin' and ${users.status} <> 'ehemalig')`.mapWith(Number),
      redakteur: sql<number>`count(*) filter (where ${users.role} = 'redakteur' and ${users.status} <> 'ehemalig')`.mapWith(Number),
      autor: sql<number>`count(*) filter (where ${users.role} = 'autor' and ${users.status} <> 'ehemalig')`.mapWith(Number),
      invited: sql<number>`count(*) filter (where ${users.status} = 'eingeladen')`.mapWith(Number),
      former: sql<number>`count(*) filter (where ${users.status} = 'ehemalig')`.mapWith(Number),
    })
    .from(users);

  return row ?? { admin: 0, redakteur: 0, autor: 0, invited: 0, former: 0 };
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

/**
 * Whether anything of this person's is published. Nothing here stops a removal
 * — it decides which of the two removals happens: a row nobody's work points
 * at is deleted outright, and one that carries a byline stays as `ehemalig` so
 * the article keeps an author with a name.
 */
export const hasPublishedWork = async (memberId: string) => {
  const [row] = await db
    .select({
      articles: sql<number>`(select count(*)::int from ${articles} where ${articles.authorId} = ${memberId})`,
      memes: sql<number>`(select count(*)::int from ${memes} where ${memes.createdBy} = ${memberId})`,
    })
    .from(users)
    .where(eq(users.id, memberId));

  return (row?.articles ?? 0) + (row?.memes ?? 0) > 0;
};

/**
 * The invitations this person sent. They reference the row with `on delete
 * restrict` and are operational, not a record worth keeping — left as a
 * blocker they made everybody who had ever invited anybody undeletable.
 */
export const deleteInvitationsFrom = (memberId: string) =>
  db.delete(invitations).where(eq(invitations.invitedBy, memberId));

export const deleteMemberRow = (memberId: string) =>
  db.delete(users).where(eq(users.id, memberId));

/**
 * What is left of somebody who has gone: the name and the initials, because a
 * byline needs both, and nothing else. The address is kept because the column
 * requires one and it is what an invitation would match on if they came back;
 * the biography and the ressorts go, since they describe a person who is no
 * longer here.
 */
export const retireMemberRow = (memberId: string) =>
  db
    .update(users)
    .set({
      status: "ehemalig",
      velveUserId: null,
      bio: null,
      ressorts: [],
      mustChangePassword: false,
    })
    .where(eq(users.id, memberId));
