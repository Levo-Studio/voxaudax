"use client";

import { useActionState, useState } from "react";

import { FIELD_CLASS, LABEL_CLASS, PRIMARY_BUTTON_CLASS } from "@/components/admin/controls";
import { Segmented } from "@/components/admin/segmented";
import { inviteAction, type InviteState } from "@/app/admin/(redaktion)/nutzer/actions";
import { LINK_LIFETIMES } from "@/lib/editorial/vocabulary";
import { FORM_LABELS, ROLE_HINTS, roleLabel, type Form, type Role } from "@/lib/roles";

const EMPTY: InviteState = { problem: null, link: null };

export function InviteForm() {
  const [state, submit, pending] = useActionState(inviteAction, EMPTY);
  const [role, setRole] = useState<Role>("autor");
  const [form, setForm] = useState<Form>("weiblich");

  return (
    <form action={submit} className="contents">
      <div className="border-b border-bd px-[18px] py-4">
        <label className={`${LABEL_CLASS} mb-1.5`} htmlFor="invite-name">Name</label>
        <input id="invite-name" name="name" required placeholder="Vor- und Nachname" className={FIELD_CLASS} />
        <label className={`${LABEL_CLASS} mt-3 mb-1.5`} htmlFor="invite-email">E-Mail</label>
        <input id="invite-email" name="email" type="email" required placeholder="name@voxaudax.de" className={FIELD_CLASS} />
        <p className="mt-[7px] text-[11.5px] font-medium text-tm">An diese Adresse geht der Einladungslink.</p>
      </div>

      <div className="border-b border-bd px-[18px] py-4">
        <span className={`${LABEL_CLASS} mb-[7px]`}>Rolle</span>
        <Segmented
          name="role"
          value={role}
          options={[
            { value: "autor", label: "Autor / Autorin" },
            { value: "redakteur", label: "Redakteur / Redakteurin" },
            { value: "admin", label: "Admin" },
          ]}
          onChange={setRole}
        />
        <p className="mt-[9px] text-xs leading-[1.55] font-medium text-tm">{ROLE_HINTS[role]}</p>

        <span className={`${LABEL_CLASS} mt-3.5 mb-[7px]`}>Bezeichnung</span>
        <Segmented
          name="form"
          value={form}
          options={[
            { value: "weiblich", label: FORM_LABELS.weiblich },
            { value: "maennlich", label: FORM_LABELS.maennlich },
            { value: "neutral", label: FORM_LABELS.neutral },
          ]}
          onChange={setForm}
        />
        <p className="mt-[9px] text-xs leading-[1.55] font-medium text-tm">
          Erscheint als <strong className="font-bold text-tx">{roleLabel(role, form)}</strong> auf
          der Redaktionsseite, im Impressum und in Freigabe-Mails.
        </p>
      </div>

      <div className="border-b border-bd px-[18px] py-4">
        <span className={`${LABEL_CLASS} mb-[7px]`}>Link gültig für</span>
        <Segmented
          name="hours"
          value="168"
          options={LINK_LIFETIMES.map((lifetime) => ({
            value: String(lifetime.hours),
            label: lifetime.label,
          }))}
        />
        <p className="mt-[9px] text-xs leading-[1.55] font-medium text-tm">
          Einmal verwendbar. Nach Ablauf muss neu eingeladen werden, ein Passwort vergibt nur die
          eingeladene Person selbst.
        </p>
      </div>

      <div className="flex flex-col gap-2 px-[18px] py-4">
        {state.problem === null ? null : (
          <p role="alert" className="text-xs font-semibold text-ac2">{state.problem}</p>
        )}
        {state.link === null ? null : (
          <div role="status" className="va-in rounded-[10px] border border-bd bg-s2 p-3">
            <p className="m-0 text-xs font-semibold text-tm">
              Einladung angelegt. Der Link wird genau einmal angezeigt:
            </p>
            <code className="mt-1.5 block font-mono text-[11px] break-all text-tx">{state.link}</code>
          </div>
        )}
        <button type="submit" disabled={pending} className={`${PRIMARY_BUTTON_CLASS} w-full`}>
          Einladung senden
        </button>
      </div>
    </form>
  );
}
