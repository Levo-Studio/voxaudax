"use client";

import { useActionState } from "react";

import { Field, PRIMARY_BUTTON_CLASS } from "@/components/admin/controls";
import { setNewPasswordAction, type SetNewPasswordState } from "@/app/admin/passwort/[token]/actions";

const EMPTY: SetNewPasswordState = { problem: null };

export function SetNewPasswordForm({ token }: { token: string }) {
  const [state, submit, pending] = useActionState(setNewPasswordAction.bind(null, token), EMPTY);

  return (
    <form action={submit} className="mt-[18px] flex flex-col gap-3.5">
      <Field label="Neues Passwort" name="password" type="password" autoComplete="new-password" required minLength={10} />
      <Field label="Wiederholen" name="repeat" type="password" autoComplete="new-password" required />

      <p className="m-0 text-[12.5px] leading-[1.55] font-medium text-tm">
        Mindestens 10 Zeichen. Alle offenen Sitzungen auf anderen Geräten werden beendet.
      </p>

      {state.problem === null ? null : (
        <p role="alert" className="m-0 text-[12.5px] font-semibold text-ac2">{state.problem}</p>
      )}

      <button type="submit" disabled={pending} className={`${PRIMARY_BUTTON_CLASS} py-[13px] text-sm`}>
        Passwort speichern
      </button>
    </form>
  );
}
