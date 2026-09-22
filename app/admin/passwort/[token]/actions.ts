"use server";

import { redirect } from "next/navigation";

import { redeemOwnReset } from "@/lib/editorial/passwords";
import { callFields, writeSessionToken } from "@/lib/session";

export type SetNewPasswordState = { readonly problem: string | null };

export const setNewPasswordAction = async (
  token: string,
  _state: SetNewPasswordState,
  form: FormData,
): Promise<SetNewPasswordState> => {
  const password = String(form.get("password") ?? "");
  const repeated = String(form.get("repeat") ?? "");

  if (password.length < 10) return { problem: "Mindestens 10 Zeichen." };
  if (password !== repeated) return { problem: "Die beiden Eingaben sind nicht gleich." };

  let result: Awaited<ReturnType<typeof redeemOwnReset>>;

  try {
    result = await redeemOwnReset({
      token,
      newPassword: password,
      call: await callFields("mutation"),
    });
  } catch (cause) {
    const code = (cause as { code?: unknown }).code;

    // An expired token, a spent one, an invented one and one minted for another
    // purpose are one answer in the library, and they stay one answer here.
    if (code === "invalid_token") {
      return {
        problem:
          "Der Link gilt eine Stunde und lässt sich nur einmal verwenden. Fordere einen neuen an.",
      };
    }

    if (code === "password_unacceptable") {
      return { problem: "Das Passwort wurde nicht akzeptiert. Wähl ein anderes." };
    }

    if (code === "rate_limited") {
      return {
        problem:
          "Zu viele Versuche. Warte ein paar Minuten und öffne den Link dann noch einmal.",
      };
    }

    // Anything else is the infrastructure, not the link. Sending somebody for a
    // new link over a database that is down costs them the second one too.
    console.error("error", "a password reset could not be redeemed", { cause });
    return {
      problem: "Das hat gerade nicht geklappt. Versuch es in ein paar Minuten noch einmal.",
    };
  }

  await writeSessionToken(
    result.sessionToken,
    Math.max(1, Math.floor((result.session.absoluteExpiresAt.getTime() - Date.now()) / 1000)),
  );

  redirect("/admin/artikel");
};
