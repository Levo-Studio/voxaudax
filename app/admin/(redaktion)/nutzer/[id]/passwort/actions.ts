"use server";

import { revalidatePath } from "next/cache";

import { requireCapability } from "@/lib/authorize";
import { findMemberById, setMustChangePassword } from "@/lib/editorial/members";
import { announcePasswordChange } from "@/lib/editorial/announce";
import { setPasswordFor } from "@/lib/editorial/passwords";
import { callFields } from "@/lib/session";

export type SetPasswordState = {
  readonly problem: string | null;
  readonly done: boolean;
  readonly revokedSessions: number;
};

/**
 * Screen 12a. Only `admin` reaches this — 11c's "Passwort anderer Mitglieder
 * zurücksetzen" is the one row that is admin alone — and the password never
 * leaves this response: it is typed by the admin, handed over in person, and
 * the account's owner is told only that it changed.
 */
export const setPasswordAction = async (
  _state: SetPasswordState,
  form: FormData,
): Promise<SetPasswordState> => {
  const admin = await requireCapability("resetOthersPassword");

  const memberId = String(form.get("memberId") ?? "");
  const newPassword = String(form.get("password") ?? "");
  const mustChange = form.get("mustChange") === "on";

  if (memberId === admin.id) {
    return { problem: "Das eigene Passwort änderst du unter Konto.", done: false, revokedSessions: 0 };
  }

  const member = await findMemberById(memberId);
  if (member === null || member.velveUserId === null) {
    return { problem: "Diese Person hat noch kein Konto.", done: false, revokedSessions: 0 };
  }

  if (newPassword.length < 10) {
    return { problem: "Mindestens 10 Zeichen.", done: false, revokedSessions: 0 };
  }

  const outcome = await setPasswordFor({
    email: member.email,
    newPassword,
    call: await callFields("mutation"),
  });

  if (outcome === "no_account") {
    return { problem: "Diese Person hat noch kein Konto.", done: false, revokedSessions: 0 };
  }

  await setMustChangePassword(memberId, mustChange);

  // 12a. The password itself is handed over in person and stands in no mail;
  // what goes out is that it was changed, by whom, and that every session is
  // over — so somebody who did not ask for this learns of it from us rather
  // than from being locked out.
  await announcePasswordChange({ changedBy: admin, memberId });

  revalidatePath("/admin/nutzer");

  return { problem: null, done: true, revokedSessions: outcome.revokedSessions };
};
