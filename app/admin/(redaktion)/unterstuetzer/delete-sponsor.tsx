"use client";

import { useRef, useTransition } from "react";

import { deleteSponsorAction } from "@/app/admin/(redaktion)/unterstuetzer/actions";
import { PANEL_CLASS, PANEL_HEADING_CLASS, QUIET_BUTTON_CLASS } from "@/components/admin/controls";
import { toast } from "@/components/admin/toast";

/**
 * The switch beside this one takes a sponsor off the page and keeps the record
 * of the agreement. This removes the entry for good, so it asks first — in the
 * page's own dialog, which can name the sponsor and say what goes with it.
 */
export function DeleteSponsor({ sponsorId, name }: { sponsorId: string; name: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [removing, startTransition] = useTransition();

  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        className="cursor-pointer border-none bg-transparent p-0 font-control text-[12.5px] font-bold text-ac2 transition-opacity duration-200 ease-out hover:opacity-75"
      >
        Löschen
      </button>

      <dialog
        ref={dialog}
        className={`${PANEL_CLASS} m-auto w-[min(420px,calc(100vw-32px))] p-0 backdrop:bg-black/40`}
      >
        <div className={PANEL_HEADING_CLASS}>{name} löschen?</div>
        <div className="flex flex-col gap-3.5 p-5">
          <p className="m-0 text-[13.5px] leading-[1.55] font-medium text-tm">
            Der Eintrag und sein Logo verschwinden ganz. Wenn der Unterstützer nur
            vorübergehend nicht erscheinen soll, nimm stattdessen den Schalter daneben.
          </p>
          <div className="mt-1 flex flex-wrap gap-2.5">
            <button
              type="button"
              disabled={removing}
              onClick={() =>
                startTransition(async () => {
                  const carrier = new FormData();
                  carrier.set("sponsorId", sponsorId);
                  await deleteSponsorAction(carrier);
                  dialog.current?.close();
                  toast(`${name} gelöscht.`);
                })
              }
              className="inline-flex min-h-11 cursor-pointer items-center rounded-[10px] bg-ac2 px-[18px] text-[13.5px] font-bold text-s1 transition-opacity duration-200 ease-out hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-60 md:min-h-0 md:py-[11px]"
            >
              {removing ? "Wird gelöscht …" : "Endgültig löschen"}
            </button>
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              className={QUIET_BUTTON_CLASS}
            >
              Abbrechen
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
