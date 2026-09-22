"use client";

import Link from "next/link";
import { useActionState, useEffect, useId, useRef, useState } from "react";

import {
  changeRoleAction,
  removeMemberAction,
  type RemoveState,
} from "@/app/admin/(redaktion)/nutzer/actions";
import { LABEL_CLASS, PRIMARY_BUTTON_CLASS } from "@/components/admin/controls";
import { FORM_LABELS, ROLE_HINTS, roleLabel, type Form, type Role } from "@/lib/roles";

const ROLES: readonly Role[] = ["autor", "redakteur", "admin"];
const FORMS: readonly Form[] = ["weiblich", "maennlich", "neutral"];

const NO_PROBLEM: RemoveState = { problem: null };

/** Points down while the panel is shut and up while it is open. */
const Chevron = ({ open }: { open: boolean }) => (
  <svg
    viewBox="0 0 16 16"
    aria-hidden
    className={`size-3.5 transition-transform duration-200 ease-out ${open ? "rotate-180" : ""}`}
  >
    <path
      d="M3.5 6 8 10.5 12.5 6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CHIP = (selected: boolean) =>
  `cursor-pointer rounded-full px-[11px] py-2 transition-colors duration-200 ease-out ${
    selected ? "bg-ac text-s1" : "border border-bd text-tm hover:border-ac"
  }`;

export type MemberRowProps = {
  member: {
    id: string;
    name: string;
    email: string;
    initials: string;
    role: Role;
    form: Form;
    velveUserId: string | null;
  };
  /** The row's own cells, rendered on the server so the list stays server-read. */
  children: React.ReactNode;
  rowClassName: string;
};

export function MemberRow({ member, children, rowClassName }: MemberRowProps) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<Role>(member.role);
  const [form, setForm] = useState<Form>(member.form);
  const [state, remove, removing] = useActionState(removeMemberAction, NO_PROBLEM);
  const dialog = useRef<HTMLDialogElement>(null);
  const panelId = useId();

  // A refusal comes back from the server after the dialog has closed, so the
  // dialog is what closes on success and the row is what reports the refusal.
  useEffect(() => {
    if (state.problem !== null) dialog.current?.close();
  }, [state.problem]);

  return (
    <div className="border-b border-bd last:border-b-0">
      <div className={rowClassName}>
        {children}

        <span className="flex items-center justify-start gap-3 md:justify-end">
          <button
            type="button"
            onClick={() => setOpen((was) => !was)}
            aria-expanded={open}
            aria-controls={panelId}
            className="inline-flex cursor-pointer items-center gap-1.5 text-[12.5px] font-bold text-tm transition-colors duration-200 ease-out hover:text-tx"
          >
            Bearbeiten
            <Chevron open={open} />
          </button>

          {member.velveUserId === null ? null : (
            <Link
              href={`/admin/nutzer/${member.id}/passwort`}
              className="text-[12.5px] font-bold text-ac no-underline transition-opacity duration-200 ease-out hover:opacity-75"
            >
              Passwort
            </Link>
          )}

          <button
            type="button"
            onClick={() => dialog.current?.showModal()}
            className="cursor-pointer text-[12.5px] font-bold text-ac2 transition-opacity duration-200 ease-out hover:opacity-75"
          >
            Entfernen
          </button>
        </span>
      </div>

      {state.problem === null ? null : (
        <p
          role="alert"
          className="va-in mx-4 mb-3.5 rounded-[10px] border border-ac2 px-3.5 py-2.5 text-[12.5px] leading-[1.5] font-semibold text-ac2 md:mx-[22px]"
        >
          {state.problem}
        </p>
      )}

      {/* Kept mounted and hidden rather than unmounted, so a half-made change
          is still there when the panel is opened again. */}
      <div id={panelId} hidden={!open} className="va-in px-4 pb-4 md:px-[22px] md:pb-5">
        <form action={changeRoleAction} className="flex flex-col gap-4 rounded-[12px] border border-bd p-4">
          <input type="hidden" name="memberId" value={member.id} />

          <fieldset className="border-none p-0">
            <legend className={LABEL_CLASS}>Rolle</legend>
            <div className="mt-2 flex flex-wrap gap-1.5 text-xs font-bold">
              {ROLES.map((option) => (
                <label key={option} className={CHIP(option === role)}>
                  <input
                    type="radio"
                    name="role"
                    value={option}
                    checked={option === role}
                    onChange={() => setRole(option)}
                    className="sr-only"
                  />
                  {roleLabel(option, form)}
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs font-medium text-tm">{ROLE_HINTS[role]}</p>
          </fieldset>

          <fieldset className="border-none p-0">
            <legend className={LABEL_CLASS}>Bezeichnung</legend>
            <div className="mt-2 flex flex-wrap gap-1.5 text-xs font-bold">
              {FORMS.map((option) => (
                <label key={option} className={CHIP(option === form)}>
                  <input
                    type="radio"
                    name="form"
                    value={option}
                    checked={option === form}
                    onChange={() => setForm(option)}
                    className="sr-only"
                  />
                  {FORM_LABELS[option]}
                </label>
              ))}
            </div>
          </fieldset>

          <button type="submit" className={`${PRIMARY_BUTTON_CLASS} self-start`}>
            Speichern
          </button>
        </form>
      </div>

      {/* A real dialog, not window.confirm: it traps focus, closes on Escape
          and can say which person and what it costs. */}
      <dialog
        ref={dialog}
        className="m-auto w-[min(440px,calc(100vw-32px))] rounded-[14px] border border-bd bg-s1 p-0 text-tx backdrop:bg-black/40"
      >
        <form action={remove} className="flex flex-col gap-3.5 p-5">
          <input type="hidden" name="memberId" value={member.id} />

          <h2 className="m-0 text-[17px] font-extrabold tracking-[-0.02em]">
            {member.name} entfernen?
          </h2>
          <p className="m-0 text-[13.5px] leading-[1.55] font-medium text-tm">
            {member.velveUserId === null
              ? "Die Einladung verfällt und die Person verschwindet aus der Redaktion."
              : "Das Konto wird gelöscht, alle Sitzungen enden und die Person verschwindet aus der Redaktion."}{" "}
            Einladungen, die diese Person verschickt hat, verfallen dabei. Das
            lässt sich nicht rückgängig machen.
          </p>

          <div className="mt-1 flex flex-wrap gap-2.5">
            <button
              type="submit"
              disabled={removing}
              className="inline-flex min-h-11 cursor-pointer items-center rounded-[10px] bg-ac2 px-[18px] text-[13.5px] font-bold text-s1 transition-opacity duration-200 ease-out hover:opacity-85 disabled:opacity-60 md:min-h-0 md:py-[11px]"
            >
              {removing ? "Wird entfernt …" : "Endgültig entfernen"}
            </button>
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              className="inline-flex min-h-11 cursor-pointer items-center rounded-[10px] border border-bd px-[18px] text-[13.5px] font-bold text-tm transition-colors duration-200 ease-out hover:text-tx md:min-h-0 md:py-[11px]"
            >
              Abbrechen
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
