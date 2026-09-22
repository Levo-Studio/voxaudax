"use client";

import { useId, useState, useTransition } from "react";

import { DISABLED_CLASS } from "@/components/admin/controls";
import { toast } from "@/components/admin/toast";

const REFUSALS: Record<string, string> = {
  own_submission: "Die eigene Einreichung gibt niemand frei.",
  alt_text_missing: "Ohne Alt-Text ist die Freigabe gesperrt.",
  reason_missing: "Ohne Begründung wird nichts abgelehnt.",
  unknown: "Diese Einreichung wartet nicht mehr.",
};

/** What each decision did, in the words the person would use for it. */
const DECIDED: Record<string, string> = {
  approved: "Freigegeben und veröffentlicht.",
  returned: "Zurückgegeben. Die Begründung steht beim Artikel.",
  rejected: "Abgelehnt. Die Begründung steht beim Eintrag.",
};

/**
 * The refusals the server answered, shown where the decision was made. Nothing
 * here decides anything: a disabled button is the same answer the action would
 * give, and this is what says so out loud when the action gives it anyway.
 */
export function DecisionButtons({
  approve,
  reject,
  approveLabel,
  rejectLabel,
  blocked,
  layout = "row",
}: {
  approve: () => Promise<{ outcome: string }>;
  reject: (reason: string) => Promise<{ outcome: string }>;
  approveLabel: string;
  rejectLabel: string;
  blocked: boolean;
  layout?: "row" | "grid";
}) {
  const [refusal, setRefusal] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const reasonId = useId();

  /**
   * Refusing takes a second step, because it takes a sentence. The author is
   * told "abgelehnt" either way; without the reason they are told that
   * something is wrong and nothing about what.
   */
  const [reason, setReason] = useState<string | null>(null);
  const reasonFieldId = useId();

  const run = (action: () => Promise<{ outcome: string }>) =>
    startTransition(async () => {
      const { outcome } = await action();
      const refused = REFUSALS[outcome];
      setRefusal(refused ?? null);

      if (refused !== undefined) {
        toast(refused, "problem");
        return;
      }

      setReason(null);
      toast(DECIDED[outcome] ?? "Entschieden.");
    });

  return (
    <span className={layout === "row" ? "flex flex-wrap justify-end gap-2" : "flex gap-1.5"}>
      {refusal === null ? null : (
        <span role="alert" className="w-full text-right text-[11.5px] font-semibold text-ac2">
          {refusal}
        </span>
      )}
      {blocked ? (
        // The reason a reviewer cannot act belongs on the screen. It used to be
        // a `title`, which is a tooltip for a mouse and nothing at all for a
        // keyboard, a screen reader or a touch device — on the one control
        // whose whole job at that moment is to say why it will not work.
        <span id={reasonId} className="w-full text-right text-[11.5px] font-semibold text-ac2">
          Alt-Text fehlt
        </span>
      ) : null}
      {reason === null ? (
        <button
          type="button"
          onClick={() => setReason("")}
          disabled={pending}
          className={`cursor-pointer rounded-lg border border-bd bg-transparent px-[13px] py-2 font-control text-[12.5px] font-bold text-ac2 transition-colors duration-200 ease-out hover:border-ac2 ${DISABLED_CLASS}`}
        >
          {rejectLabel}
        </button>
      ) : (
        <span className="flex w-full flex-col gap-1.5">
          <label className="text-left text-[11px] font-bold tracking-[0.1em] text-tm uppercase" htmlFor={reasonFieldId}>
            Begründung
          </label>
          <textarea
            id={reasonFieldId}
            autoFocus
            rows={3}
            maxLength={500}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Was muss anders werden? Die einreichende Person liest das."
            className="w-full rounded-lg border border-bd bg-s2 px-[11px] py-[9px] text-left font-control text-[12.5px] font-semibold text-tx outline-ac placeholder:text-tm"
          />
          <span className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => { setReason(null); setRefusal(null); }}
              className="cursor-pointer rounded-lg border border-bd bg-transparent px-[13px] py-2 font-control text-[12.5px] font-bold text-tm transition-colors duration-200 ease-out hover:text-tx"
            >
              Abbrechen
            </button>
            <button
              type="button"
              onClick={() => run(() => reject(reason))}
              disabled={pending || reason.trim().length === 0}
              className={`cursor-pointer rounded-lg border-none bg-ac2 px-[13px] py-2 font-control text-[12.5px] font-bold text-s1 transition-[filter] duration-200 ease-out hover:brightness-110 ${DISABLED_CLASS}`}
            >
              Senden
            </button>
          </span>
        </span>
      )}
      <button
        type="button"
        onClick={() => run(approve)}
        disabled={pending || blocked}
        aria-describedby={blocked ? reasonId : undefined}
        className={`${
          layout === "grid" ? "flex-1 " : ""
        }cursor-pointer rounded-lg border-none px-[13px] py-2 font-control text-[12.5px] font-bold transition-[filter] duration-200 ease-out bg-ac text-s1 hover:brightness-110 ${DISABLED_CLASS}`}
      >
        {approveLabel}
      </button>
    </span>
  );
}
