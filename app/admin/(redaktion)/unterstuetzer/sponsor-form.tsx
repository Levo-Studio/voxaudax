"use client";

import { useActionState, useEffect, useState } from "react";

import { FIELD_CLASS, LABEL_CLASS, PRIMARY_BUTTON_CLASS } from "@/components/admin/controls";
import { toast } from "@/components/admin/toast";
import { Segmented } from "@/components/admin/segmented";
import { saveSponsorAction, type SponsorFormState } from "@/app/admin/(redaktion)/unterstuetzer/actions";
import {
  endOfRuntime,
  RUNTIMES,
  type RuntimeMonths,
} from "@/lib/editorial/vocabulary";

const EMPTY: SponsorFormState = { problem: null, saved: false };

const DATE = new Intl.DateTimeFormat("de-DE");

export function SponsorForm({ today }: { today: string }) {
  const [state, submit, pending] = useActionState(saveSponsorAction, EMPTY);

  useEffect(() => {
    if (state.problem !== null) toast(state.problem, "problem");
    else if (state.saved) toast("Unterstützer gespeichert.");
  }, [state]);
  const [months, setMonths] = useState<RuntimeMonths>(6);
  const [startsAt, setStartsAt] = useState(today);

  const until = (() => {
    const from = new Date(startsAt);
    return Number.isNaN(from.getTime()) ? "—" : DATE.format(endOfRuntime(from, months));
  })();

  return (
    <form action={submit} className="contents">
      <div className="border-b border-bd px-[18px] py-4">
        <label className={`block cursor-pointer rounded-[10px] border-[1.5px] border-dashed border-bd p-[18px] text-center text-[12.5px] font-semibold text-tm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ac`}>
          Logo hierher ziehen
          <span className="mt-1 block text-[11.5px] font-medium">SVG oder PNG mit Transparenz</span>
          <input type="file" name="logo" accept="image/svg+xml,image/png" className="sr-only" />
        </label>

        <label className={`${LABEL_CLASS} mt-3 mb-1.5`} htmlFor="sponsor-name">Name</label>
        <input id="sponsor-name" name="name" required className={FIELD_CLASS} />

        <label className={`${LABEL_CLASS} mt-3 mb-1.5`} htmlFor="sponsor-initials">Kürzel</label>
        <input id="sponsor-initials" name="initials" required maxLength={4} placeholder="SP" className={FIELD_CLASS} />

        <label className={`${LABEL_CLASS} mt-3 mb-1.5`} htmlFor="sponsor-url">Link</label>
        <input id="sponsor-url" name="url" placeholder="osiander.de" className={FIELD_CLASS} />

        <label className={`${LABEL_CLASS} mt-3 mb-1.5`} htmlFor="sponsor-alt">Alt-Text · Pflichtfeld</label>
        <input id="sponsor-alt" name="logoAlt" placeholder="Logo Buchhandlung Osiander" className={FIELD_CLASS} />
      </div>

      <div className="border-b border-bd px-[18px] py-4">
        <span className={`${LABEL_CLASS} mb-[7px]`}>Sichtbar für</span>
        <Segmented
          name="months"
          value={String(months)}
          options={RUNTIMES.map((runtime) => ({ value: String(runtime.months), label: runtime.label }))}
          onChange={(value) => setMonths(Number(value) as RuntimeMonths)}
        />
        <div className="mt-2.5 grid grid-cols-2 gap-2.5">
          <div>
            <label className={`${LABEL_CLASS} mb-1.5`} htmlFor="sponsor-start">Von</label>
            <input
              id="sponsor-start"
              type="date"
              name="startsAt"
              value={startsAt}
              onChange={(event) => setStartsAt(event.target.value)}
              className={FIELD_CLASS}
            />
          </div>
          <div>
            <span className={`${LABEL_CLASS} mb-1.5`}>Bis</span>
            <div className="rounded-lg border border-bd px-[11px] py-[9px] text-[13px] font-semibold">{until}</div>
          </div>
        </div>
        <p className="mt-[9px] text-xs font-medium text-tm">
          Nach Ablauf wird der Eintrag automatisch ausgeblendet, ohne dass jemand eingreifen muss.
        </p>
      </div>

      <div className="flex flex-col gap-2 px-[18px] py-4">
        {state.problem === null ? null : (
          <p role="alert" className="text-xs font-semibold text-ac2">{state.problem}</p>
        )}
        {state.saved ? (
          <p role="status" className="text-xs font-semibold text-ac">
            Gespeichert. Der Eintrag wartet auf die Freigabe.
          </p>
        ) : null}
        <button type="submit" disabled={pending} className={PRIMARY_BUTTON_CLASS}>
          Speichern
        </button>
      </div>
    </form>
  );
}
