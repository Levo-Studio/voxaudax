"use server";

import { revalidatePath } from "next/cache";

import { velveAuth } from "@/lib/auth";
import { requireMember } from "@/lib/authorize";
import { setMustChangePassword, updateOwnProfile } from "@/lib/editorial/members";
import { refreshPublic } from "@/lib/refresh";
import { callFields, readSessionToken, writeSessionToken } from "@/lib/session";

export const saveProfileAction = async (form: FormData) => {
  const member = await requireMember({ allowForcedPasswordChange: true });

  const name = String(form.get("name") ?? "").trim();
  const bio = String(form.get("bio") ?? "").trim();
  if (name.length === 0) return;

  await updateOwnProfile(member, { name, bio: bio.length === 0 ? null : bio });
  revalidatePath("/admin/konto");
  // Both fields are public: the name stands under every article and in the
  // pills on the home page, the biography on /redaktion. Without this the
  // person who just rewrote theirs goes looking and finds the old one.
  refreshPublic.editorial();
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

    if (code === "invalid_credentials") {
      return { problem: "Das aktuelle Passwort stimmt nicht.", done: false };
    }

    // The lockout of lib/auth.ts counts this route too, and it refuses the
    // fourth attempt even when the password is right. Saying "das aktuelle
    // Passwort stimmt nicht" there sends somebody who has mistyped three times
    // into trying a fourth, a fifth and a sixth, each one refused for a reason
    // the sentence never names.
    if (code === "rate_limited") {
      return {
        problem: "Zu viele Versuche. Dieses Konto ist für drei Minuten gesperrt.",
        done: false,
      };
    }

    // Anything else is not the reader's password. It used to be reported as
    // one, which made every connection failure an accusation.
    console.error("error", "a password change did not complete", { cause });
    return { problem: "Das hat gerade nicht geklappt. Versuch es gleich noch einmal.", done: false };
  }

  await setMustChangePassword(member.id, false);
  revalidatePath("/admin/konto");
  return { problem: null, done: true };
};

export type RevokeState = { readonly problem: string | null };

/**
 * Ending a session needs a **fresh** one, the same fifteen-minute window
 * `password.change` is held to. Both of these let the refusal out as an
 * exception, so "Beenden" and "Überall abmelden" threw an unhandled error for
 * anybody who had been signed in for longer than that — which is almost
 * everybody who goes looking at their devices.
 */
const revokeRefusal = (cause: unknown): RevokeState => {
  if ((cause as { code?: unknown }).code === "freshness_required") {
    return {
      problem:
        "Diese Sitzung ist zu alt, um Geräte abzumelden. Melde dich neu an und versuch es direkt danach.",
    };
  }

  return { problem: "Das Gerät ließ sich gerade nicht abmelden." };
};

export const revokeSessionAction = async (
  _state: RevokeState,
  form: FormData,
): Promise<RevokeState> => {
  await requireMember({ allowForcedPasswordChange: true });
  const sessionToken = await readSessionToken();
  if (sessionToken === undefined) return { problem: "Die Sitzung ist abgelaufen." };

  try {
    await velveAuth().session.revoke({
      targetSessionId: String(form.get("sessionId") ?? ""),
      sessionToken,
      ...(await callFields("mutation")),
    });
  } catch (cause) {
    return revokeRefusal(cause);
  }

  revalidatePath("/admin/konto");
  return { problem: null };
};

export const revokeOtherSessionsAction = async (): Promise<RevokeState> => {
  await requireMember({ allowForcedPasswordChange: true });
  const sessionToken = await readSessionToken();
  if (sessionToken === undefined) return { problem: "Die Sitzung ist abgelaufen." };

  try {
    await velveAuth().session.revokeAllOther({
      sessionToken,
      ...(await callFields("mutation")),
    });
  } catch (cause) {
    return revokeRefusal(cause);
  }

  revalidatePath("/admin/konto");
  return { problem: null };
};
