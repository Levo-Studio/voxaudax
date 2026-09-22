"use client";

import { useActionState, useEffect, useState } from "react";

import { toast } from "@/components/admin/toast";

import { FIELD_CLASS, LABEL_CLASS, PRIMARY_BUTTON_CLASS, QUIET_BUTTON_CLASS } from "@/components/admin/controls";
import { setPasswordAction, type SetPasswordState } from "@/app/admin/(redaktion)/nutzer/[id]/passwort/actions";

const EMPTY: SetPasswordState = { problem: null, done: false, revokedSessions: 0 };

const WORDS = [
  "Herbst", "Ausgabe", "Redaktion", "Korrektur", "Andruck", "Layout",
  "Spalte", "Umbruch", "Notizblock", "Schlagzeile", "Aufsicht", "Pausenhof",
];

/**
 * Screen 12a generates a readable password. It is drawn in the browser from
 * `crypto.getRandomValues` so that the admin can read it out before it is sent,
 * and it is never mailed — the message the owner receives says only that it
 * changed.
 */
const generate = () => {
  const draw = new Uint32Array(3);
  crypto.getRandomValues(draw);
  const parts = Array.from(draw.slice(0, 2)).map((value) => WORDS[value % WORDS.length]!);
  return `${parts.join("-")}-${2000 + (draw[2]! % 100)}`;
};

export function ResetPasswordForm({ memberId }: { memberId: string }) {
  const [state, submit, pending] = useActionState(setPasswordAction, EMPTY);

  useEffect(() => {
    if (state.problem !== null) toast(state.problem, "problem");
    else if (state.done) {
      toast(`Passwort gesetzt. ${state.revokedSessions} weitere Sitzung(en) beendet.`);
    }
  }, [state]);
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);

  /**
   * After the first paint, not while rendering. Drawing it in the initial state
   * meant the server drew one password and the browser another, and React
   * answers a mismatch like that by throwing the server's markup away and
   * rendering the document again from `<html>` down — which wiped the
   * `data-theme` the boot script had stamped there, so this was the one screen
   * in the back office that could not be dark.
   */
  useEffect(() => setPassword(generate()), []);

  return (
    <form action={submit} className="p-5">
      <input type="hidden" name="memberId" value={memberId} />

      <label className={`${LABEL_CLASS} mt-[18px] mb-1.5`} htmlFor="new-password">Neues Passwort</label>
      <input
        id="new-password"
        name="password"
        type="text"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        className={FIELD_CLASS}
      />

      <div className="mt-[9px] flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => {
            setPassword(generate());
            setCopied(false);
          }}
          className={`${QUIET_BUTTON_CLASS} px-[13px] py-2 text-[12.5px] font-bold`}
        >
          Neu erzeugen
        </button>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(password).then(() => setCopied(true));
          }}
          className={`${QUIET_BUTTON_CLASS} px-[13px] py-2 text-[12.5px] font-bold`}
        >
          {copied ? "Kopiert" : "Kopieren"}
        </button>
        <span className="ml-auto text-[11.5px] font-bold text-tm">{password.length} Zeichen</span>
      </div>

      <label className="mt-4 flex items-start gap-2.5 text-[13px] leading-[1.5] font-medium text-tm">
        <input type="checkbox" name="mustChange" defaultChecked className="mt-px h-[17px] w-[17px] flex-none accent-ac" />
        <span>Muss das Passwort bei der nächsten Anmeldung ändern.</span>
      </label>

      <p className="mt-2.5 flex items-start gap-2.5 text-[13px] leading-[1.5] font-medium text-tm">
        <span aria-hidden className="mt-px grid h-[17px] w-[17px] flex-none place-items-center rounded-[3px] bg-ac text-[11px] font-bold text-s1">
          ✓
        </span>
        <span>
          Alle offenen Sitzungen werden beendet. Das ist keine Option — die Bibliothek beendet
          sie bei jedem Passwortwechsel und bietet nichts an, das es abschaltet.
        </span>
      </p>

      {state.problem === null ? null : (
        <p role="alert" className="mt-3 text-xs font-semibold text-ac2">{state.problem}</p>
      )}
      {state.done ? (
        <p role="status" className="va-in mt-3 text-xs font-semibold text-ac">
          Gesetzt. {state.revokedSessions} weitere Sitzung(en) beendet.
        </p>
      ) : null}

      <div className="mt-[18px] flex gap-2">
        <button type="submit" disabled={pending} className={`${PRIMARY_BUTTON_CLASS} flex-1 py-3`}>
          Passwort setzen
        </button>
      </div>

      <p className="mt-3 text-xs leading-[1.55] font-medium text-tm">
        Gib das Passwort persönlich weiter, nicht per Mail. Die Person bekommt nur die Information,
        dass es geändert wurde.
      </p>
    </form>
  );
}
