"use client";

import { useActionState } from "react";

import { submitContactMessage } from "@/app/kontakt/actions";
import {
  CONCERNS,
  MAX_EMAIL_LENGTH,
  MAX_MESSAGE_LENGTH,
  MAX_NAME_LENGTH,
  MAX_ROLE_LENGTH,
  type ContactState,
} from "@/lib/contact";

/**
 * The template leaves the field style as a placeholder, so it is taken from
 * the only other input the design draws: the archive's search box.
 */
const FIELD =
  "min-h-11 rounded-[10px] border border-bd bg-s1 px-3.5 py-3 text-[15px] font-medium text-tx placeholder:text-tm";

const LABEL =
  "text-[10.5px] font-bold tracking-[0.12em] text-tm uppercase md:text-[11px]";

const initialState: ContactState = { status: "idle", problems: [] };

function Notice({
  state,
  editorialEmail,
}: {
  state: ContactState;
  editorialEmail: string;
}) {
  if (state.status === "idle") return null;

  const tone =
    state.status === "sent"
      ? "border-ac text-tx"
      : "border-ac2 text-tx";

  return (
    <div
      role="status"
      className={`mb-4 rounded-[10px] border ${tone} bg-s2 px-4 py-3 text-sm leading-[1.6] font-medium`}
    >
      {state.status === "sent" ? (
        "Danke — die Nachricht ist bei der Redaktion."
      ) : state.status === "invalid" ? (
        <ul className="list-disc pl-4">
          {state.problems.map((problem) => (
            <li key={problem}>{problem}</li>
          ))}
        </ul>
      ) : (
        <>
          {state.status === "unconfigured"
            ? "Diese Seite kann gerade keine Mail versenden: auf dem Server ist kein Postausgang eingerichtet. Die Nachricht wurde nicht zugestellt."
            : state.status === "throttled"
              ? "Von dieser Adresse sind gerade mehrere Nachrichten gekommen. Bitte warte einen Moment — diese hier wurde nicht zugestellt."
              : "Die Nachricht ließ sich nicht zustellen — der Mailversand hat sie abgelehnt."}{" "}
          Schreib uns bitte direkt an{" "}
          <a href={`mailto:${editorialEmail}`} className="font-bold text-ac">
            {editorialEmail}
          </a>
          .
          {state.fallback === undefined ? null : (
            <>
              {" "}
              <a href={state.fallback} className="font-bold text-ac">
                Text ins Mailprogramm übernehmen →
              </a>
            </>
          )}
        </>
      )}
    </div>
  );
}

export function ContactForm({ editorialEmail }: { editorialEmail: string }) {
  const [state, submit, pending] = useActionState(
    submitContactMessage,
    initialState,
  );

  return (
    <form action={submit} className="mt-[18px] flex flex-col gap-3 md:mt-7 md:max-w-[520px] md:gap-4">
      <Notice state={state} editorialEmail={editorialEmail} />

      <div className="flex flex-col gap-3 md:grid md:grid-cols-2 md:gap-4">
        <label className="flex flex-col gap-1.5 md:gap-[7px]">
          <span className={LABEL}>Name</span>
          <input
            name="name"
            type="text"
            required
            maxLength={MAX_NAME_LENGTH}
            autoComplete="name"
            placeholder="Vor- und Nachname"
            className={FIELD}
          />
        </label>
        <label className="flex flex-col gap-1.5 md:gap-[7px]">
          <span className={LABEL}>Klasse oder Rolle</span>
          <input
            name="role"
            type="text"
            maxLength={MAX_ROLE_LENGTH}
            placeholder="z. B. 10b oder Elternteil"
            className={FIELD}
          />
        </label>
      </div>

      <label className="flex flex-col gap-1.5 md:gap-[7px]">
        <span className={LABEL}>E-Mail</span>
        <input
          name="email"
          type="email"
          required
          maxLength={MAX_EMAIL_LENGTH}
          autoComplete="email"
          placeholder="name@example.de"
          className={FIELD}
        />
      </label>

      <fieldset className="flex flex-col gap-1.5 md:gap-[7px]">
        <legend className={LABEL}>Anliegen</legend>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {CONCERNS.map((concern, index) => (
            <label key={concern} className="cursor-pointer">
              <input
                type="radio"
                name="concern"
                value={concern}
                defaultChecked={index === 0}
                className="peer sr-only"
              />
              <span className="inline-flex min-h-11 items-center rounded-full border border-bd px-3 text-xs font-bold text-tm peer-checked:border-ac peer-checked:bg-ac peer-checked:text-s1 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ac md:min-h-0 md:px-3 md:py-[7px] md:text-[12.5px]">
                {concern}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex flex-col gap-1.5 md:gap-[7px]">
        <span className={LABEL}>Nachricht</span>
        <textarea
          name="message"
          rows={5}
          required
          maxLength={MAX_MESSAGE_LENGTH}
          placeholder="Worum geht es?"
          className={`${FIELD} md:min-h-[150px]`}
        />
      </label>

      {/* Left empty by every person and filled in by the scripts that submit
          every field they find. */}
      <label className="sr-only" aria-hidden>
        Website
        <input name="website" type="text" tabIndex={-1} autoComplete="off" />
      </label>

      <label className="flex items-start gap-2.5 text-[12.5px] leading-[1.5] font-medium text-tm md:text-[13.5px] md:leading-[1.55]">
        <input
          type="checkbox"
          name="consent"
          required
          className="mt-0.5 size-[18px] flex-none accent-[var(--ac)]"
        />
        <span>
          Ich habe zur Kenntnis genommen, dass meine Angaben zur Bearbeitung der
          Anfrage gespeichert und an die Redaktion übermittelt werden.
        </span>
      </label>

      <button
        type="submit"
        disabled={pending}
        className="mt-1 cursor-pointer rounded-[10px] bg-ac px-5 py-[13px] font-control text-sm font-bold text-s1 disabled:opacity-70 md:self-start"
      >
        {pending ? "Wird gesendet …" : "Nachricht senden"}
      </button>
    </form>
  );
}
