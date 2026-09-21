"use server";

import { requestOwnReset } from "@/lib/editorial/passwords";
import { callFields } from "@/lib/session";

export type ResetRequestState = { readonly asked: boolean };

/**
 * Screen 12b answers the same thing either way, and this answers it before it
 * knows anything: the state it returns does not depend on the address, only on
 * the fact that a form was submitted.
 */
export const requestResetAction = async (
  _state: ResetRequestState,
  form: FormData,
): Promise<ResetRequestState> => {
  const email = String(form.get("email") ?? "").trim();

  if (email.length > 0) {
    await requestOwnReset(email, await callFields("mutation"));
  }

  return { asked: true };
};
