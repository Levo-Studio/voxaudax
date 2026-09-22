"use client";

import { useActionState, useState } from "react";

import { Field, PRIMARY_BUTTON_CLASS } from "@/components/admin/controls";
import { acceptInvitationAction, type AcceptState } from "@/app/admin/einladung/[token]/actions";

const EMPTY: AcceptState = { problem: null };

/** The four bars of screen 8b, measured on length and on variety of character. */
const strength = (password: string) => {
  const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter((pattern) =>
    pattern.test(password),
  ).length;
  if (password.length < 10) return { filled: Math.min(2, classes), label: "Zu kurz" };
  if (classes <= 1) return { filled: 2, label: "Geht so" };
  if (classes === 2) return { filled: 3, label: "Stark genug" };
  return { filled: 4, label: "Sehr stark" };
};

export function AcceptInvitationForm({ token }: { token: string }) {
  const [state, submit, pending] = useActionState(
    acceptInvitationAction.bind(null, token),
    EMPTY,
  );
  const [password, setPassword] = useState("");
  const measured = strength(password);

  return (
    <form action={submit} className="mt-[18px] flex flex-col gap-3.5">
      <Field
        label="Passwort"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={10}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />

      <div className="flex items-center gap-[5px]">
        {[0, 1, 2, 3].map((bar) => (
          <span
            key={bar}
            className={`h-1 flex-1 rounded-full transition-colors duration-200 ease-out ${
              bar < measured.filled ? "bg-ac" : "bg-bd"
            }`}
          />
        ))}
        <span className="ml-1.5 text-[11.5px] font-bold text-tm">{measured.label}</span>
      </div>

      <Field label="Passwort wiederholen" name="repeat" type="password" autoComplete="new-password" required />

      <p className="m-0 text-[12.5px] leading-[1.55] font-medium text-tm">
        Mindestens 10 Zeichen. Der Einladungslink verfällt, sobald das Passwort gesetzt ist.
      </p>

      {state.problem === null ? null : (
        <p role="alert" className="m-0 text-[12.5px] font-semibold text-ac2">{state.problem}</p>
      )}

      <button type="submit" disabled={pending} className={`${PRIMARY_BUTTON_CLASS} py-[13px] text-sm`}>
        Passwort setzen und anmelden
      </button>
    </form>
  );
}
