"use client";

import { useId, useState, useTransition } from "react";

import { DISABLED_CLASS } from "@/components/admin/controls";

const REFUSALS: Record<string, string> = {
  own_submission: "Die eigene Einreichung gibt niemand frei.",
  alt_text_missing: "Ohne Alt-Text ist die Freigabe gesperrt.",
  unknown: "Diese Einreichung wartet nicht mehr.",
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
  reject: () => Promise<{ outcome: string }>;
  approveLabel: string;
  rejectLabel: string;
  blocked: boolean;
  layout?: "row" | "grid";
}) {
  const [refusal, setRefusal] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const reasonId = useId();

  const run = (action: () => Promise<{ outcome: string }>) =>
    startTransition(async () => {
      const { outcome } = await action();
      setRefusal(REFUSALS[outcome] ?? null);
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
      <button
        type="button"
        onClick={() => run(reject)}
        disabled={pending}
        className={`cursor-pointer rounded-lg border border-bd bg-transparent px-[13px] py-2 font-control text-[12.5px] font-bold text-ac2 transition-colors duration-200 ease-out hover:border-ac2 ${DISABLED_CLASS}`}
      >
        {rejectLabel}
      </button>
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
