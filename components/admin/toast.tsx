"use client";

import { useEffect, useState, type CSSProperties } from "react";

/**
 * The small confirmations that appear in the top right and leave by themselves.
 *
 * A module-level list of listeners rather than a context, because the callers
 * are scattered — a button in the editor, a form on the sponsor page, a dialog
 * in the user list — and none of them should have to be handed a function
 * through five components to say "saved".
 *
 * It is deliberately not a store: a notice has no state worth keeping. It
 * appears, it is read, it goes.
 */
export type ToastTone = "ok" | "problem";

type Notice = { readonly id: number; readonly text: string; readonly tone: ToastTone };

type Listener = (notice: Notice) => void;

const listeners = new Set<Listener>();
let counter = 0;

export const toast = (text: string, tone: ToastTone = "ok") => {
  counter += 1;
  const notice = { id: counter, text, tone };
  for (const listener of listeners) listener(notice);
};

/** Long enough to read a sentence, short enough not to sit in the way. */
const LIFETIME_MS = 4_000;

export function ToastHost() {
  const [notices, setNotices] = useState<readonly Notice[]>([]);

  useEffect(() => {
    const receive: Listener = (notice) => {
      setNotices((open) => [...open, notice]);
      window.setTimeout(
        () => setNotices((open) => open.filter((one) => one.id !== notice.id)),
        LIFETIME_MS,
      );
    };

    listeners.add(receive);
    return () => {
      listeners.delete(receive);
    };
  }, []);

  return (
    // `pointer-events-none` on the stack and `auto` on each notice: the column
    // reaches across the header, and a reader must still be able to press what
    // is underneath it.
    <div
      aria-live="polite"
      className="pointer-events-none fixed top-4 right-4 z-50 flex w-[min(360px,calc(100vw-32px))] flex-col gap-2"
    >
      {notices.map((notice) => (
        <div
          key={notice.id}
          role={notice.tone === "problem" ? "alert" : "status"}
          className={`va-in pointer-events-auto relative flex items-start gap-2.5 overflow-hidden rounded-[12px] border bg-s1 px-3.5 py-3 text-[13px] leading-[1.5] font-semibold shadow-lg ${
            notice.tone === "problem" ? "border-ac2 text-ac2" : "border-bd text-tx"
          }`}
        >
          <span
            aria-hidden
            className={`mt-[5px] h-[7px] w-[7px] flex-none rounded-full ${
              notice.tone === "problem" ? "bg-ac2" : "bg-ac"
            }`}
          />
          <span className="flex-1">{notice.text}</span>
          <button
            type="button"
            onClick={() => setNotices((open) => open.filter((one) => one.id !== notice.id))}
            aria-label="Meldung schließen"
            className="-mt-0.5 cursor-pointer border-none bg-transparent p-0 text-[15px] leading-none text-tm transition-colors duration-200 ease-out hover:text-tx"
          >
            ×
          </button>

          <span
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-[3px] overflow-hidden rounded-b-[12px]"
          >
            <span
              style={{ "--toast-life": `${LIFETIME_MS}ms` } as CSSProperties}
              className={`va-toast-life block h-full w-full ${
                notice.tone === "problem" ? "bg-ac2" : "bg-ac"
              }`}
            />
          </span>
        </div>
      ))}
    </div>
  );
}
