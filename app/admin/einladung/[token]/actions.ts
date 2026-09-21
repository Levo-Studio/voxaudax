"use server";

import { redirect } from "next/navigation";

import { redeemInvitation } from "@/lib/editorial/invitations";
import { callFields, writeSessionToken } from "@/lib/session";

export type AcceptState = { readonly problem: string | null };

const PROBLEMS = {
  unusable_link: "Dieser Link ist abgelaufen oder wurde schon benutzt. Bitte die Chefredaktion um eine neue Einladung.",
  address_in_use:
    "Zu dieser Adresse gibt es bereits ein Konto. Melde dich an oder sprich die Chefredaktion an.",
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
  } catch {
    return { problem: "Das Passwort wurde nicht akzeptiert. Wähl ein längeres." };
  }

  if (!outcome.accepted) return { problem: PROBLEMS[outcome.reason] };

  await writeSessionToken(outcome.sessionToken, outcome.lifetimeSeconds);
  redirect("/admin/artikel");
};
