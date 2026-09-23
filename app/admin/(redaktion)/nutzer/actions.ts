"use server";

import { revalidatePath } from "next/cache";

import { refreshPublic } from "@/lib/refresh";
import { z } from "zod";

import { velveAuth } from "@/lib/auth";
import { requireCapability } from "@/lib/authorize";
import { announceInvitation } from "@/lib/editorial/announce";
import { initialsOf } from "@/lib/format";
import { issueInvitation, invitationPath, isLinkLifetime } from "@/lib/editorial/invitations";
import {
  deleteInvitationsFrom,
  deleteMemberRow,
  findMemberById,
  hasPublishedWork,
  retireMemberRow,
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
  /** Whether 8b's mail reached the provider. Null before anything was sent. */
  readonly mailed?: boolean;
  /**
   * Shown once and never stored in the clear. Screen 8b's mail carries it, and
   * the link stands here beside it: mail is the one step that leaves the
   * building, and an invitation that did not arrive must still be one that can
   * be handed over.
   */
  readonly link: string | null;
};

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

  const path = invitationPath(token);

  /**
   * 8b draws this as a mail, and it is now sent as one. The link stays on
   * screen beside it: mail is the one step of this that leaves the building,
   * and an invitation that did not arrive must not be an invitation that
   * cannot be handed over — the person is usually in the same room.
   */
  const mailed = await announceInvitation({
    invitedBy: member,
    to: parsed.data.email,
    name: parsed.data.name,
    role: parsed.data.role,
    form: parsed.data.form,
    validity: parsed.data.hours === 24 ? "24-hours" : "7-days",
    path,
  });

  revalidatePath("/admin/nutzer");

  return {
    problem: null,
    mailed,
    link: new URL(path, environment().NEXT_PUBLIC_SITE_URL).toString(),
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

/**
 * Screen 11a's list can remove anybody, and it never refuses. What it does
 * depends on whether their work is published:
 *
 * - nothing of theirs is out there: the row goes, and so does the account.
 * - an article or a meme carries their name: the row stays as `ehemalig` so
 *   the byline keeps an author, and every list of the editorial team — which
 *   asks for `aktiv` — stops showing them from that moment.
 *
 * Either way the account is deleted first and the sessions with it, so nobody
 * keeps a way in past their membership. The invitations they sent go too: they
 * reference the row and are operational rather than a record worth keeping.
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

  const keepsAByline = await hasPublishedWork(memberId);

  await deleteInvitationsFrom(memberId);

  // Deleting the account cascades this row away, which is right only when
  // nothing points at it — so somebody with a byline is unlinked first and the
  // account deleted afterwards.
  if (keepsAByline) {
    await retireMemberRow(memberId);
    if (member.velveUserId !== null) {
      await velveAuth().user.delete({ userId: member.velveUserId });
    }
  } else if (member.velveUserId === null) {
    await deleteMemberRow(memberId);
  } else {
    await velveAuth().user.delete({ userId: member.velveUserId });
  }

  revalidatePath("/admin/nutzer");
  refreshPublic.editorial();
  return { problem: null };
};
