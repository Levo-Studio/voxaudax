"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { submitContactMessage } from "@/app/kontakt/actions";
import {
  CONCERNS,
  MAX_EMAIL_LENGTH,
  MAX_MESSAGE_LENGTH,
  MAX_NAME_LENGTH,
  MAX_ROLE_LENGTH,
  MIN_MESSAGE_LENGTH,
  MIN_NAME_LENGTH,
  type Concern,
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

/**
 * Both notices sit on the page's own ground rather than the tinted one: the
 * refusal writes in the warning colour, and that colour reads 4.79:1 on `s1`
 * against 4.31:1 on `s2` — so the tint was the difference between passing AA
 * and not. The links inside a refusal take the same colour as the text around
 * them; in the accent they were a second, unrelated hue inside a red box.
 */
function Notice({
  state,
  editorialEmail,
}: {
  state: ContactState;
  editorialEmail: string;
}) {
  if (state.status === "idle") return null;

  const failed = state.status !== "sent";
  const link = failed
    ? "font-bold text-ac2 underline underline-offset-2"
    : "font-bold text-ac underline underline-offset-2";

  return (
    <div
      role="status"
      className={`va-in mb-4 rounded-[10px] border bg-s1 px-4 py-3 text-sm leading-[1.6] font-medium ${
        failed ? "border-ac2 text-ac2" : "border-ac text-tx"
      }`}
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
          <a href={`mailto:${editorialEmail}`} className={link}>
            {editorialEmail}
          </a>
          .
          {state.fallback === undefined ? null : (
            <>
              {" "}
              <a href={state.fallback} className={link}>
                Text ins Mailprogramm übernehmen →
              </a>
            </>
          )}
        </>
      )}
    </div>
  );
}

/** Enough of an address to be one. The server is what decides; this only says
 *  whether the button is worth offering yet. */
const looksLikeEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);

export function ContactForm({ editorialEmail }: { editorialEmail: string }) {
  const [state, submit, pending] = useActionState(
    submitContactMessage,
    initialState,
  );

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [consented, setConsented] = useState(false);
  const [concern, setConcern] = useState<Concern>(CONCERNS[0]);
  const formElement = useRef<HTMLFormElement>(null);

  // React resets the form once the action returns. It re-applies a controlled
  // `value`, but not a controlled `checked` — so after a failed send the tick
  // was gone from the box while this component still believed it was there
  // (a button that looked ready in front of a server that would refuse), and
  // the chosen concern had quietly reverted to the first one. Both are put
  // back from the state that never moved.
  useEffect(() => {
    const form = formElement.current;
    if (form === null) return;

    const consent = form.elements.namedItem("consent");
    if (consent instanceof HTMLInputElement) consent.checked = consented;

    for (const radio of form.querySelectorAll<HTMLInputElement>('input[name="concern"]')) {
      radio.checked = radio.value === concern;
    }
  }, [state, consented, concern]);

  // Named rather than counted, so the line under the button can say which one
  // is still open instead of leaving a grey button with no explanation.
  const missing = [
    name.trim().length < MIN_NAME_LENGTH ? "dein Name" : null,
    looksLikeEmail(email.trim()) ? null : "eine E-Mail-Adresse",
    message.trim().length < MIN_MESSAGE_LENGTH ? "ein paar Sätze Nachricht" : null,
    consented ? null : "der Haken unten",
  ].filter((what) => what !== null);

  const ready = missing.length === 0;

  return (
    <form ref={formElement} action={submit} className="mt-[18px] flex flex-col gap-3 md:mt-7 md:max-w-[520px] md:gap-4">
      <Notice state={state} editorialEmail={editorialEmail} />

      <div className="flex flex-col gap-3 md:grid md:grid-cols-2 md:gap-4">
        <label className="flex flex-col gap-1.5 md:gap-[7px]">
          <span className={LABEL}>Name</span>
          <input
            name="name"
            type="text"
            required
            minLength={MIN_NAME_LENGTH}
            maxLength={MAX_NAME_LENGTH}
            autoComplete="name"
            placeholder="Vor- und Nachname"
            value={name}
            onChange={(event) => setName(event.target.value)}
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
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={FIELD}
        />
      </label>

      <fieldset className="flex flex-col gap-1.5 md:gap-[7px]">
        <legend className={LABEL}>Anliegen</legend>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {CONCERNS.map((option) => (
            <label key={option} className="cursor-pointer">
              <input
                type="radio"
                name="concern"
                value={option}
                checked={option === concern}
                onChange={() => setConcern(option)}
                className="peer sr-only"
              />
              <span className="inline-flex min-h-11 items-center rounded-full border border-bd px-3 text-xs font-bold text-tm peer-checked:border-ac peer-checked:bg-ac peer-checked:text-s1 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ac md:min-h-0 md:px-3 md:py-[7px] md:text-[12.5px]">
                {option}
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
          minLength={MIN_MESSAGE_LENGTH}
          maxLength={MAX_MESSAGE_LENGTH}
          placeholder="Worum geht es?"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
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
          checked={consented}
          onChange={(event) => setConsented(event.target.checked)}
          className="mt-0.5 size-[18px] flex-none accent-[var(--ac)]"
        />
        <span>
          Ich habe zur Kenntnis genommen, dass meine Angaben zur Bearbeitung der
          Anfrage gespeichert und an die Redaktion übermittelt werden.
        </span>
      </label>

      <div className="mt-1 flex flex-col gap-2 md:items-start">
        <button
          type="submit"
          disabled={pending || !ready}
          className="cursor-pointer rounded-[10px] bg-ac px-5 py-[13px] font-control text-sm font-bold text-s1 transition-opacity duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-45 md:self-start"
        >
          {pending ? "Wird gesendet …" : "Nachricht senden"}
        </button>

        {/* A greyed-out button with no reason beside it is a dead end, so it
            says what is still open. `aria-live` because it changes as the form
            is filled in and nothing else announces that. */}
        {ready ? null : (
          <p aria-live="polite" className="m-0 text-[12.5px] leading-[1.5] font-medium text-tm">
            Es fehlt noch: {missing.join(", ")}.
          </p>
        )}
      </div>
    </form>
  );
}
