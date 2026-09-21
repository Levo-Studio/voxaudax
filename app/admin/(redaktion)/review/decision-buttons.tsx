"use client";

import { useState, useTransition } from "react";

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
      <button
        type="button"
        onClick={() => run(reject)}
        disabled={pending}
        className="cursor-pointer rounded-lg border border-bd bg-transparent px-[13px] py-2 font-control text-[12.5px] font-bold text-ac2 transition-colors duration-200 ease-out hover:border-ac2 disabled:opacity-50"
      >
        {rejectLabel}
      </button>
      <button
        type="button"
        onClick={() => run(approve)}
        disabled={pending || blocked}
        title={blocked ? "Alt-Text fehlt" : undefined}
        className={`${
          layout === "grid" ? "flex-1 " : ""
        }cursor-pointer rounded-lg border-none px-[13px] py-2 font-control text-[12.5px] font-bold transition-[filter] duration-200 ease-out ${
          blocked
            ? "cursor-not-allowed border border-bd bg-s2 text-tm"
            : "bg-ac text-white hover:brightness-110"
        } disabled:opacity-60`}
      >
        {approveLabel}
      </button>
    </span>
  );
}
