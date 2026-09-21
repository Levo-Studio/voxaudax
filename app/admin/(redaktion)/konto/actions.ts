"use server";

import { revalidatePath } from "next/cache";

import { velveAuth } from "@/lib/auth";
import { requireMember } from "@/lib/authorize";
import { setMustChangePassword, updateOwnProfile } from "@/lib/editorial/members";
import { callFields, readSessionToken, writeSessionToken } from "@/lib/session";

export const saveProfileAction = async (form: FormData) => {
  const member = await requireMember({ allowForcedPasswordChange: true });

  const name = String(form.get("name") ?? "").trim();
  const bio = String(form.get("bio") ?? "").trim();
  if (name.length === 0) return;

  await updateOwnProfile(member, { name, bio: bio.length === 0 ? null : bio });
  revalidatePath("/admin/konto");
};

export type ChangePasswordState = { readonly problem: string | null; readonly done: boolean };

/**
 * `password.change` needs a **fresh** session — one created inside the
 * freshness window, fifteen minutes by default — and restores freshness only by
 * signing in again. That is the library's rule and there is no option that
 * softens it, so the refusal is reported in those words rather than worked
 * around.
 *
 * It also revokes every other session and re-issues this one, which is why the
 * new token is written back into the cookie here: the old one stops resolving
 * the moment the credential is written.
 */
export const changePasswordAction = async (
  _state: ChangePasswordState,
  form: FormData,
): Promise<ChangePasswordState> => {
  const member = await requireMember({ allowForcedPasswordChange: true });
  const sessionToken = await readSessionToken();
  if (sessionToken === undefined) return { problem: "Die Sitzung ist abgelaufen.", done: false };

  const currentPassword = String(form.get("current") ?? "");
  const newPassword = String(form.get("next") ?? "");

  if (newPassword.length < 10) return { problem: "Mindestens 10 Zeichen.", done: false };

  try {
    const result = await velveAuth().password.change({
      currentPassword,
      newPassword,
      sessionToken,
      ...(await callFields("mutation")),
    });

    await writeSessionToken(
      result.sessionToken,
      Math.max(1, Math.floor((result.session.absoluteExpiresAt.getTime() - Date.now()) / 1000)),
    );
  } catch (cause) {
    const code = (cause as { code?: unknown }).code;

    if (code === "freshness_required") {
      return {
        problem:
          "Diese Sitzung ist zu alt für eine Passwortänderung. Melde dich neu an und versuch es direkt danach.",
        done: false,
      };
    }

    if (code === "password_unacceptable") {
      return { problem: "Das neue Passwort erfüllt die Regeln nicht.", done: false };
    }

    return { problem: "Das aktuelle Passwort stimmt nicht.", done: false };
  }

  await setMustChangePassword(member.id, false);
  revalidatePath("/admin/konto");
  return { problem: null, done: true };
};

export const revokeSessionAction = async (form: FormData) => {
  await requireMember({ allowForcedPasswordChange: true });
  const sessionToken = await readSessionToken();
  if (sessionToken === undefined) return;

  await velveAuth().session.revoke({
    targetSessionId: String(form.get("sessionId") ?? ""),
    sessionToken,
    ...(await callFields("mutation")),
  });

  revalidatePath("/admin/konto");
};

export const revokeOtherSessionsAction = async () => {
  await requireMember({ allowForcedPasswordChange: true });
  const sessionToken = await readSessionToken();
  if (sessionToken === undefined) return;

  await velveAuth().session.revokeAllOther({
    sessionToken,
    ...(await callFields("mutation")),
  });

  revalidatePath("/admin/konto");
};
