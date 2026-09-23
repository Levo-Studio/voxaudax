"use client";

import { useActionState, useEffect, useState } from "react";

import { saveProfileAction, type ProfileState } from "@/app/admin/(redaktion)/konto/actions";
import {
  Avatar,
  DISABLED_CLASS,
  FIELD_CLASS,
  LABEL_CLASS,
  PRIMARY_BUTTON_CLASS,
} from "@/components/admin/controls";
import { toast } from "@/components/admin/toast";

const EMPTY: ProfileState = { problem: null, saved: false };

/**
 * The profile, which used to write in silence: a plain form action that
 * returned nothing, re-rendered the same fields and left the person guessing
 * whether anything had been saved. It says so now, in the corner, like every
 * other action in the back office.
 *
 * And it will not save what has not changed. The button is out until one of
 * the two fields differs from what was loaded — a save that writes the same
 * row again is a round trip, a revalidation of three public pages and a notice
 * about nothing.
 */
export function ProfileForm({
  member,
}: {
  member: {
    name: string;
    email: string;
    initials: string;
    bio: string | null;
    roleLabel: string;
  };
}) {
  const [state, submit, pending] = useActionState(saveProfileAction, EMPTY);

  /** What is on the row, as far as this form knows. Moves when a save lands. */
  const [saved, setSaved] = useState({ name: member.name, bio: member.bio ?? "" });
  const [draft, setDraft] = useState(saved);

  useEffect(() => {
    if (state.problem !== null) toast(state.problem, "problem");
    else if (state.saved) toast("Profil gespeichert.");
  }, [state]);

  const changed = draft.name !== saved.name || draft.bio !== saved.bio;

  return (
    <form
      action={(form) => {
        setSaved(draft);
        return submit(form);
      }}
      className="flex flex-col gap-3 px-5 py-[18px]"
    >
      <div className="flex items-center gap-3.5">
        <Avatar initials={member.initials} size={52} />
        <span className="text-[13px] font-semibold text-tm">{member.roleLabel}</span>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className={LABEL_CLASS}>Anzeigename</span>
        <input
          name="name"
          value={draft.name}
          onChange={(event) => setDraft({ ...draft, name: event.target.value })}
          required
          className={FIELD_CLASS}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className={LABEL_CLASS}>E-Mail</span>
        <input
          value={member.email}
          readOnly
          aria-describedby="email-note"
          className={`${FIELD_CLASS} text-tm`}
        />
      </label>
      <p id="email-note" className="m-0 text-[11.5px] font-medium text-tm">
        Die Adresse ist der Anmeldename. Sie ändert die Redaktionsleitung.
      </p>

      <label className="flex flex-col gap-1.5">
        <span className={LABEL_CLASS}>Kurzbio für die Autorenseite</span>
        <textarea
          name="bio"
          rows={3}
          value={draft.bio}
          onChange={(event) => setDraft({ ...draft, bio: event.target.value })}
          className={FIELD_CLASS}
        />
      </label>

      <button
        type="submit"
        disabled={pending || !changed}
        className={`${PRIMARY_BUTTON_CLASS} self-start py-2.5 ${DISABLED_CLASS}`}
      >
        Speichern
      </button>
    </form>
  );
}
