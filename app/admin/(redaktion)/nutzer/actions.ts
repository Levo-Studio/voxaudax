"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { velveAuth } from "@/lib/auth";
import { requireCapability } from "@/lib/authorize";
import { issueInvitation, invitationPath, isLinkLifetime } from "@/lib/editorial/invitations";
import {
  deleteInvitationsFrom,
  deleteMemberRow,
  deletionBlockers,
  findMemberById,
  setRoleAndForm,
} from "@/lib/editorial/members";
import { environment } from "@/lib/env";
import { userForm, userRole } from "@/lib/db/schema";

const invitation = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.email(),
  role: z.enum(userRole.enumValues),
  form: z.enum(userForm.enumValues),
  hours: z.coerce.number().refine(isLinkLifetime, "unknown link lifetime"),
});

export type InviteState = {
  readonly problem: string | null;
  /**
   * Shown once and never stored in the clear. Screen 8b's mail is what normally
   * carries it; outbound mail has no key in this environment, so the link is
   * put in front of the admin who made it rather than lost.
   */
  readonly link: string | null;
};

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter((part) => part.length > 0)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");

export const inviteAction = async (
  _state: InviteState,
  form: FormData,
): Promise<InviteState> => {
  const member = await requireCapability("manageUsers");

  const parsed = invitation.safeParse({
    name: form.get("name"),
    email: form.get("email"),
    role: form.get("role"),
    form: form.get("form"),
    hours: form.get("hours"),
  });

  if (!parsed.success) {
    return { problem: "Name, Adresse, Rolle, Bezeichnung und Gültigkeit müssen stimmen.", link: null };
  }

  const { token } = await issueInvitation({
    invitedBy: member,
    email: parsed.data.email,
    name: parsed.data.name,
    initials: initialsOf(parsed.data.name),
    role: parsed.data.role,
    form: parsed.data.form,
    hours: parsed.data.hours,
  });

  revalidatePath("/admin/nutzer");

  return {
    problem: null,
    link: new URL(invitationPath(token), environment().NEXT_PUBLIC_SITE_URL).toString(),
  };
};

export const changeRoleAction = async (form: FormData) => {
  const member = await requireCapability("manageUsers");

  const memberId = String(form.get("memberId") ?? "");
  const role = form.get("role");
  const shape = form.get("form");

  const roles = userRole.enumValues as readonly string[];
  const forms = userForm.enumValues as readonly string[];
  if (typeof role !== "string" || !roles.includes(role)) return;
  if (typeof shape !== "string" || !forms.includes(shape)) return;

  // An admin who took their own last permission away would lock the editorial
  // team out of user administration from inside it.
  if (memberId === member.id) return;

  const target = await findMemberById(memberId);
  if (target === null) return;

  await setRoleAndForm(memberId, role as typeof userRole.enumValues[number], shape as typeof userForm.enumValues[number]);
  revalidatePath("/admin/nutzer");
};

export type RemoveState = { readonly problem: string | null };

/** "1 Artikel", "3 Artikel" — the count reads as a reason, so it is named. */
const countPhrase = (count: number, one: string, many: string) =>
  count === 1 ? `1 ${one}` : `${count} ${many}`;

/**
 * Screen 11a's list can remove somebody outright. What it cannot do is leave
 * their work without an author: articles, memes and the invitations they sent
 * all reference this row and refuse the delete, so the refusal is spelled out
 * here instead of arriving as a constraint name.
 *
 * The account goes first and takes this row with it — the foreign key onto
 * `velve.user` cascades — so there is no window in which a credential outlives
 * the membership it belonged to.
 */
export const removeMemberAction = async (
  _state: RemoveState,
  form: FormData,
): Promise<RemoveState> => {
  const admin = await requireCapability("manageUsers");
  const memberId = String(form.get("memberId") ?? "");

  if (memberId === admin.id) {
    return { problem: "Dich selbst kannst du nicht entfernen." };
  }

  const member = await findMemberById(memberId);
  if (member === null) return { problem: "Diese Person gibt es nicht mehr." };

  const blockers = await deletionBlockers(memberId);
  const reasons = [
    blockers.articles > 0 ? countPhrase(blockers.articles, "Artikel", "Artikel") : null,
    blockers.memes > 0 ? countPhrase(blockers.memes, "Meme", "Memes") : null,
  ].filter((reason) => reason !== null);

  if (reasons.length > 0) {
    return {
      problem: `${member.name} hat ${reasons.join(", ")} im Haus. Solange das so ist, bleibt die Person hier stehen — sonst stünde die Arbeit ohne Urheber da.`,
    };
  }

  // Before either delete: both of them are refused while an invitation still
  // points at this row.
  await deleteInvitationsFrom(memberId);

  if (member.velveUserId === null) {
    await deleteMemberRow(memberId);
  } else {
    await velveAuth().user.delete({ userId: member.velveUserId });
  }

  revalidatePath("/admin/nutzer");
  return { problem: null };
};
