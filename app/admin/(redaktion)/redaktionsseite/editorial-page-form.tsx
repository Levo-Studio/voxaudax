"use client";

import { useActionState, useEffect, useState } from "react";

import {
  saveEditorialPageAction,
  type EditorialPageState,
} from "@/app/admin/(redaktion)/redaktionsseite/actions";
import {
  DISABLED_CLASS,
  FIELD_CLASS,
  LABEL_CLASS,
  PANEL_CLASS,
  PANEL_HEADING_CLASS,
  PRIMARY_BUTTON_CLASS,
} from "@/components/admin/controls";
import { toast } from "@/components/admin/toast";
import { CHAT_GROUPS, type ChatGroupKind } from "@/lib/chat-groups";
import type { EditorialPageFields } from "@/lib/editorial-page";

const EMPTY: EditorialPageState = { problem: null, saved: false };

type Draft = EditorialPageFields & Readonly<Record<ChatGroupKind, string>>;

const HINT_CLASS = "mt-1.5 text-[11.5px] leading-[1.5] font-medium text-tm";

/**
 * Plain text in, plain text out: a blank line starts a paragraph and that is
 * all the formatting there is. The page is four boxes of prose, and an editor
 * with a toolbar for them would be the article editor a second time.
 *
 * Like the profile form, it will not save what has not changed.
 */
export function EditorialPageForm({ initial }: { initial: Draft }) {
  const [state, submit, pending] = useActionState(saveEditorialPageAction, EMPTY);
  const [saved, setSaved] = useState(initial);
  const [draft, setDraft] = useState(initial);

  useEffect(() => {
    if (state.problem !== null) toast(state.problem, "problem");
    else if (state.saved) toast("Redaktionsseite gespeichert.");
  }, [state]);

  const changed = (Object.keys(draft) as (keyof Draft)[]).some((key) => draft[key] !== saved[key]);
  const set = (key: keyof Draft) => (event: { target: { value: string } }) =>
    setDraft({ ...draft, [key]: event.target.value });

  return (
    <form
      action={(form) => {
        setSaved(draft);
        return submit(form);
      }}
      className="grid items-start gap-5 lg:grid-cols-[1fr_330px]"
    >
      <div className={PANEL_CLASS}>
        <div className={PANEL_HEADING_CLASS}>Text</div>
        <div className="flex flex-col gap-4 px-[18px] py-4 md:px-[22px]">
          <label className="flex flex-col gap-1.5">
            <span className={LABEL_CLASS}>Titel</span>
            <input name="title" value={draft.title} onChange={set("title")} required maxLength={80} className={FIELD_CLASS} />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className={LABEL_CLASS}>Einleitung</span>
            <textarea name="intro" rows={4} value={draft.intro} onChange={set("intro")} className={FIELD_CLASS} />
            <span className={HINT_CLASS}>Steht auf /redaktion unter dem Titel. Eine Leerzeile beginnt einen neuen Absatz.</span>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className={LABEL_CLASS}>Überschrift der Einladung</span>
            <input name="heading" value={draft.heading} onChange={set("heading")} required maxLength={60} className={FIELD_CLASS} />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className={LABEL_CLASS}>Einladung</span>
            <textarea name="invitation" rows={4} value={draft.invitation} onChange={set("invitation")} required className={FIELD_CLASS} />
            <span className={HINT_CLASS}>
              Der Kasten auf /redaktion und „Mitschreiben“ auf der Startseite. Ein Absatz — Zeilenumbrüche werden zu Leerzeichen.
            </span>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className={LABEL_CLASS}>Schlussnotiz</span>
            <textarea name="note" rows={3} value={draft.note} onChange={set("note")} className={FIELD_CLASS} />
            <span className={HINT_CLASS}>Klein gesetzt ganz unten auf /redaktion. Darf leer bleiben.</span>
          </label>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        <div className={PANEL_CLASS}>
          <div className={PANEL_HEADING_CLASS}>Gruppen</div>
          <div className="flex flex-col gap-4 px-[18px] py-4">
            {CHAT_GROUPS.map((group) => (
              <label key={group.kind} className="flex flex-col gap-1.5">
                <span className={LABEL_CLASS}>{group.label}</span>
                <input
                  name={group.kind}
                  type="url"
                  inputMode="url"
                  value={draft[group.kind]}
                  onChange={set(group.kind)}
                  placeholder={group.example}
                  className={FIELD_CLASS}
                />
              </label>
            ))}
            <p className="m-0 text-[11.5px] leading-[1.5] font-medium text-tm">
              Jeder Link wird ein Knopf unter der Einladung, auf /redaktion und auf der Startseite.
              Ein leeres Feld nimmt den Knopf weg.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 px-4 md:px-0">
          <button
            type="submit"
            disabled={pending || !changed}
            className={`${PRIMARY_BUTTON_CLASS} ${DISABLED_CLASS}`}
          >
            Speichern
          </button>
        </div>
      </div>
    </form>
  );
}
