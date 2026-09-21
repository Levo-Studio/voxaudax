"use client";

import { useActionState } from "react";

import {
  revokeOtherSessionsAction,
  revokeSessionAction,
  type RevokeState,
} from "@/app/admin/(redaktion)/konto/actions";
import { QUIET_BUTTON_CLASS } from "@/components/admin/controls";

/**
 * Ending a session can be refused — the library wants a session created inside
 * the freshness window — so these carry the answer back to the screen instead
 * of letting it out as an unhandled error, exactly as the password form does.
 */
const NOTHING_REFUSED: RevokeState = { problem: null };

const PROBLEM_CLASS = "mt-1.5 block text-[11.5px] font-semibold text-ac2";

export function EndSessionButton({ sessionId }: { sessionId: string }) {
  const [state, submit, pending] = useActionState(revokeSessionAction, NOTHING_REFUSED);

  return (
    <form action={submit}>
      <input type="hidden" name="sessionId" value={sessionId} />
      <button
        type="submit"
        disabled={pending}
        className="cursor-pointer border-none bg-transparent p-1 font-control text-xs font-bold text-ac2 disabled:cursor-not-allowed disabled:text-tm"
      >
        Beenden
      </button>
      {state.problem === null ? null : (
        <span role="alert" className={PROBLEM_CLASS}>
          {state.problem}
        </span>
      )}
    </form>
  );
}

export function EndOtherSessionsButton() {
  const [state, submit, pending] = useActionState(revokeOtherSessionsAction, NOTHING_REFUSED);

  return (
    <form action={submit} className="px-5 py-3.5">
      <button type="submit" disabled={pending} className={`${QUIET_BUTTON_CLASS} py-2.5`}>
        Überall abmelden
      </button>
      {state.problem === null ? null : (
        <span role="alert" className={PROBLEM_CLASS}>
          {state.problem}
        </span>
      )}
    </form>
  );
}
