"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Field, PRIMARY_BUTTON_CLASS } from "@/components/admin/controls";
import { signInAction } from "@/app/admin/sign-in";
import { SIGN_IN_ERROR, type SignInState } from "@/app/admin/sign-in-state";

const EMPTY: SignInState = { failed: false, email: "" };

export function LoginForm() {
  const [state, submit, pending] = useActionState(signInAction, EMPTY);

  return (
    <div className="flex flex-col items-center justify-center p-6 md:p-11">
      {/* One column, one width: heading, paragraph, alert and fields all sit on
          380px. The alert is not in the template at all, and at full width it
          ran past every field under it. */}
      <div className="flex w-full max-w-[380px] flex-col">
        <h1 className="m-0 text-[26px] font-extrabold tracking-[-0.035em] md:text-[32px] md:leading-[1.05]">
          Anmelden
        </h1>
        <p className="mt-2.5 text-[15px] leading-relaxed font-medium text-tm">
          Mit deiner Redaktions-Adresse. Kein Konto? Sprich die Redaktionsleitung an.
        </p>

        {state.failed ? (
          <div
            role="alert"
            className="va-in mt-4 rounded-[10px] border border-ac2 px-[15px] py-[13px] text-[13.5px] leading-[1.5] font-semibold text-ac2"
          >
            {SIGN_IN_ERROR}
          </div>
        ) : null}

        <form action={submit} className="mt-[18px] flex flex-col gap-3.5 md:mt-[26px]">
          <Field
            label="E-Mail"
            name="email"
            type="email"
            autoComplete="username"
            required
            defaultValue={state.email}
            placeholder="lina.brenner@voxaudax.de"
            error={state.failed}
          />
          <Field
            label="Passwort"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            error={state.failed}
          />
          <label className="flex min-h-11 items-center gap-[9px] text-[13px] font-medium text-tm">
            <input
              type="checkbox"
              name="stay"
              defaultChecked
              className="h-[17px] w-[17px] flex-none accent-ac"
            />
            Angemeldet bleiben
          </label>
          <button type="submit" disabled={pending} className={`${PRIMARY_BUTTON_CLASS} mt-1 py-[13px] text-sm`}>
            {state.failed ? "Erneut versuchen" : "Anmelden"}
          </button>
          <Link
            href="/admin/passwort-vergessen"
            className="text-center text-[13px] font-semibold text-tm no-underline transition-colors duration-200 ease-out hover:text-tx md:text-left"
          >
            Passwort vergessen
          </Link>
        </form>
      </div>
    </div>
  );
}
