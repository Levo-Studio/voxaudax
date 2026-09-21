"use server";

import { redirect } from "next/navigation";

import { velveAuth } from "@/lib/auth";
import { callFields, writeSessionToken } from "@/lib/session";

import { type SignInState } from "@/app/admin/sign-in-state";

export const signInAction = async (
  _state: SignInState,
  form: FormData,
): Promise<SignInState> => {
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  const stayed = form.get("stay") === "on";

  const failure: SignInState = { failed: true, email };

  let token: string;
  let lifetimeSeconds: number;

  try {
    const result = await velveAuth().signIn.password({
      email,
      password,
      ...(await callFields("mutation")),
    });

    // A second factor is not mounted in this installation, so an account that
    // reached that branch could not finish signing in; it is a refusal here
    // rather than a half-finished state nothing can complete.
    if (result.status !== "signed_in") return failure;

    token = result.sessionToken;
    lifetimeSeconds = Math.max(
      1,
      Math.floor((result.session.absoluteExpiresAt.getTime() - Date.now()) / 1000),
    );
  } catch {
    return failure;
  }

  await writeSessionToken(token, stayed ? lifetimeSeconds : "session");
  redirect("/admin/artikel");
};
