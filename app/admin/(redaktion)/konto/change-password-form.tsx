"use client";

import { useActionState, useEffect } from "react";

import { Field, QUIET_BUTTON_CLASS } from "@/components/admin/controls";
import { toast } from "@/components/admin/toast";
import { changePasswordAction, type ChangePasswordState } from "@/app/admin/(redaktion)/konto/actions";

const EMPTY: ChangePasswordState = { problem: null, done: false };

export function ChangePasswordForm({ forced }: { forced: boolean }) {
  const [state, submit, pending] = useActionState(changePasswordAction, EMPTY);

  useEffect(() => {
    if (state.problem !== null) toast(state.problem, "problem");
    else if (state.done) toast("Passwort geändert. Andere Geräte sind abgemeldet.");
  }, [state]);

  return (
    <form action={submit} className="flex flex-col gap-3 px-5 py-[18px]">
      {forced ? (
        <p role="alert" className="m-0 rounded-[10px] border border-ac2 px-3.5 py-3 text-[13px] leading-[1.5] font-semibold text-ac2">
          Dein Passwort wurde von der Chefredaktion gesetzt. Bis du ein eigenes vergeben hast,
          führt jeder Weg zurück auf diese Seite.
        </p>
      ) : null}

      <Field label="Aktuelles Passwort" name="current" type="password" autoComplete="current-password" required />
      <Field
        label="Neues Passwort"
        name="next"
        type="password"
        autoComplete="new-password"
        minLength={10}
        required
        placeholder="Mindestens 10 Zeichen"
      />

      {state.problem === null ? null : (
        <p role="alert" className="text-xs font-semibold text-ac2">{state.problem}</p>
      )}
      {state.done ? (
        <p role="status" className="va-in text-xs font-semibold text-ac">
          Geändert. Alle anderen Geräte wurden abgemeldet.
        </p>
      ) : null}

      <button type="submit" disabled={pending} className={`${QUIET_BUTTON_CLASS} self-start py-2.5`}>
        Passwort aktualisieren
      </button>
    </form>
  );
}
