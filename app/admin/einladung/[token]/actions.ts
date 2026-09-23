"use server";

import { redirect } from "next/navigation";

import { redeemInvitation } from "@/lib/editorial/invitations";
import { callFields, writeSessionToken } from "@/lib/session";

export type AcceptState = { readonly problem: string | null };

const PROBLEMS = {
  unusable_link: "Dieser Link ist abgelaufen oder wurde schon benutzt. Bitte die Redaktionsleitung um eine neue Einladung.",
  address_in_use:
    "Zu dieser Adresse gibt es bereits ein Konto. Melde dich an oder sprich die Redaktionsleitung an.",
} as const;

export const acceptInvitationAction = async (
  token: string,
  _state: AcceptState,
  form: FormData,
): Promise<AcceptState> => {
  const password = String(form.get("password") ?? "");
  const repeated = String(form.get("repeat") ?? "");

  if (password.length < 10) return { problem: "Mindestens 10 Zeichen." };
  if (password !== repeated) return { problem: "Die beiden Eingaben sind nicht gleich." };

  let outcome: Awaited<ReturnType<typeof redeemInvitation>>;

  try {
    outcome = await redeemInvitation({
      token,
      password,
      call: await callFields("mutation"),
    });
  } catch (cause) {
    // Only the library's own verdict is a statement about the password, and it
    // cannot be about the length: the ten characters are checked above, so the
    // refusal that used to be reported here — "wähl ein längeres" — was a
    // sentence about the password for a database that was down. Somebody
    // reading it types a longer one, reads it again, and concludes it is them.
    const code = (cause as { code?: unknown }).code;

    if (code === "password_unacceptable") {
      return { problem: "Das Passwort wurde nicht akzeptiert. Wähl ein anderes." };
    }

    if (code === "rate_limited") {
      return {
        problem:
          "Zu viele Versuche. Warte ein paar Minuten und öffne den Link dann noch einmal.",
      };
    }

    console.error("error", "an invitation could not be redeemed", { cause });
    return {
      problem: "Das hat gerade nicht geklappt. Versuch es in ein paar Minuten noch einmal.",
    };
  }

  if (!outcome.accepted) return { problem: PROBLEMS[outcome.reason] };

  await writeSessionToken(outcome.sessionToken, outcome.lifetimeSeconds);
  redirect("/admin/artikel");
};
