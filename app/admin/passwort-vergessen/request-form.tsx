"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Field, PRIMARY_BUTTON_CLASS } from "@/components/admin/controls";
import { requestResetAction, type ResetRequestState } from "@/app/admin/passwort-vergessen/actions";

const EMPTY: ResetRequestState = { asked: false };

export function RequestResetForm() {
  const [state, submit, pending] = useActionState(requestResetAction, EMPTY);

  return (
    <>
      <form action={submit} className="mt-5 flex max-w-[400px] flex-col gap-3.5">
        <Field label="E-Mail" name="email" type="email" required placeholder="name@voxaudax.de" />
        <button type="submit" disabled={pending} className={`${PRIMARY_BUTTON_CLASS} py-[13px] text-sm`}>
          Link anfordern
        </button>
        <Link href="/admin" className="text-[13px] font-semibold text-tm no-underline hover:text-tx">
          Zurück zur Anmeldung
        </Link>
      </form>

      {state.asked ? (
        <div
          role="status"
          className="va-in mt-[22px] max-w-[440px] rounded-[10px] border border-bd px-[15px] py-[13px] text-[13.5px] leading-[1.55] font-semibold text-tm"
        >
          Falls die Adresse zu einem Konto gehört, ist die Mail unterwegs. Aus Sicherheitsgründen
          sagen wir nicht, ob es das Konto gibt.
        </div>
      ) : null}
    </>
  );
}
