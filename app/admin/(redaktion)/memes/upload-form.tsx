"use client";

import { useActionState, useRef, useState } from "react";

import { FIELD_CLASS, LABEL_CLASS, PRIMARY_BUTTON_CLASS, QUIET_BUTTON_CLASS } from "@/components/admin/controls";
import { Segmented } from "@/components/admin/segmented";
import { uploadMemeAction, type UploadState } from "@/app/admin/(redaktion)/memes/actions";

const EMPTY: UploadState = { problem: null, uploaded: false };

const HINTS = {
  visible: "Erscheint direkt auf der Memes-Seite, ganz oben in der Galerie.",
  hidden:
    "Liegt in der Galerie, ist aber öffentlich nicht sichtbar — gut für Vorabsichtung in der Redaktion.",
} as const;

/** The "Neues Meme" column of screen 10b: drop, preview, caption, alt, visibility. */
export function MemeUploadForm() {
  const [state, submit, pending] = useActionState(uploadMemeAction, EMPTY);
  const [preview, setPreview] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<"visible" | "hidden">("visible");
  const input = useRef<HTMLInputElement>(null);
  const form = useRef<HTMLFormElement>(null);

  const take = (file: File | undefined) => {
    if (file === undefined) return;
    setPreview(URL.createObjectURL(file));
  };

  return (
    <form ref={form} action={submit} className="contents">
      <div
        className="border-b border-bd px-[18px] py-4"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          const file = event.dataTransfer.files[0];
          if (file !== undefined && input.current !== null) {
            input.current.files = event.dataTransfer.files;
            take(file);
          }
        }}
      >
        <label className="block cursor-pointer rounded-xl border-[1.5px] border-dashed border-ac px-4 py-[26px] text-center text-[13px] font-bold text-ac">
          Bild hierher ziehen
          <span className="mt-[5px] block text-[11.5px] font-medium text-tm">
            JPG, PNG, WebP oder GIF · max 8 MB
          </span>
          <input
            ref={input}
            type="file"
            name="image"
            accept="image/jpeg,image/png,image/webp,image/gif"
            required
            className="sr-only"
            onChange={(event) => take(event.target.files?.[0])}
          />
        </label>

        {preview === null ? null : (
          // A blob: URL the browser just made for a file it already holds.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Vorschau des hochgeladenen Bildes" className="va-in mt-3.5 w-full rounded-xl border border-bd" />
        )}
      </div>

      <div className="border-b border-bd px-[18px] py-4">
        <label className={`${LABEL_CLASS} mb-1.5 text-ac2`} htmlFor="meme-alt">
          Alt-Text · Pflichtfeld
        </label>
        <input id="meme-alt" name="alt" required placeholder="Was ist auf dem Bild zu sehen?" className={FIELD_CLASS} />
        <label className={`${LABEL_CLASS} mt-3 mb-1.5`} htmlFor="meme-caption">Bildunterschrift</label>
        <input id="meme-caption" name="caption" placeholder="Optional" className={FIELD_CLASS} />
      </div>

      <div className="border-b border-bd px-[18px] py-4">
        <span className={`${LABEL_CLASS} mb-[7px]`}>Sichtbarkeit</span>
        <Segmented
          name="visibility"
          value={visibility}
          options={[
            { value: "visible", label: "Sofort online" },
            { value: "hidden", label: "Erst ausgeblendet" },
          ]}
          onChange={setVisibility}
        />
        <p className="mt-[9px] text-xs leading-[1.55] font-medium text-tm">{HINTS[visibility]}</p>
      </div>

      <div className="flex flex-col gap-2 px-[18px] py-4">
        {state.problem === null ? null : (
          <p role="alert" className="text-[12px] font-semibold text-ac2">{state.problem}</p>
        )}
        {state.uploaded ? (
          <p role="status" className="text-[12px] font-semibold text-ac">
            Angelegt. Ein Meme geht erst nach der Freigabe online.
          </p>
        ) : null}
        <button type="submit" disabled={pending} className={PRIMARY_BUTTON_CLASS}>
          Veröffentlichen
        </button>
        <button
          type="reset"
          onClick={() => setPreview(null)}
          className={QUIET_BUTTON_CLASS}
        >
          Verwerfen
        </button>
      </div>
    </form>
  );
}
