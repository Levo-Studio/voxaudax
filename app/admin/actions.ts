"use server";

import { redirect } from "next/navigation";

import { velveAuth } from "@/lib/auth";
import { callFields, clearSessionToken, readSessionToken } from "@/lib/session";

export const signOutAction = async () => {
  const sessionToken = await readSessionToken();

  if (sessionToken !== undefined) {
    await velveAuth().signOut({ sessionToken, ...(await callFields("mutation")) });
  }

  await clearSessionToken();
  redirect("/admin");
};
