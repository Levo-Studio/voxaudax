"use client";

import { useRef, useTransition } from "react";

import { deleteMemeAction } from "@/app/admin/(redaktion)/memes/actions";
import { PANEL_CLASS, PANEL_HEADING_CLASS, QUIET_BUTTON_CLASS } from "@/components/admin/controls";
import { toast } from "@/components/admin/toast";

/**
 * The switch beside this one takes a meme off the wall and keeps the picture.
 * This removes both, which is what somebody who is on the picture asks for, so
 * it asks first — in the page's own dialog, which can say what goes with it.
 */
export function DeleteMeme({ memeId, day }: { memeId: string; day: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [removing, startTransition] = useTransition();

  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        className="cursor-pointer border-none bg-transparent p-0 font-control text-[11.5px] font-bold text-ac2 transition-opacity duration-200 ease-out hover:opacity-75"
      >
        Löschen
      </button>

      <dialog
        ref={dialog}
        className={`${PANEL_CLASS} m-auto w-[min(420px,calc(100vw-32px))] p-0 backdrop:bg-black/40`}
      >
        <div className={PANEL_HEADING_CLASS}>Meme vom {day} löschen?</div>
        <div className="flex flex-col gap-3.5 p-5">
          <p className="m-0 text-[13.5px] leading-[1.55] font-medium text-tm">
            Das Meme und seine Bilddatei verschwinden ganz, auch aus dem
            Objektspeicher. Wenn es nur nicht auf der Wand stehen soll, nimm
            stattdessen den Schalter daneben.
          </p>
          <div className="mt-1 flex flex-wrap gap-2.5">
            <button
              type="button"
              disabled={removing}
              onClick={() =>
                startTransition(async () => {
                  const carrier = new FormData();
                  carrier.set("memeId", memeId);
                  await deleteMemeAction(carrier);
                  dialog.current?.close();
                  toast("Meme gelöscht.");
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
