/**
 * "Abgelehnt · Grund ansehen", and the reason folded away behind it. A
 * `<details>` rather than a panel that is always open: the list is read to find
 * things, and a paragraph of criticism under every refused row would push the
 * rest of it off the screen. It needs no script — the browser opens it.
 */
export function RejectionNote({ reason }: { reason: string | null }) {
  if (reason === null || reason.trim().length === 0) return null;

  return (
    <details className="mt-1 text-[11.5px] font-semibold">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-ac2 [&::-webkit-details-marker]:hidden">
        Grund ansehen
        <span aria-hidden className="text-[9px]">
          ▾
        </span>
      </summary>
      <p className="mt-1.5 max-w-[52ch] rounded-lg border border-ac2 px-3 py-2 text-[12.5px] leading-[1.55] font-medium whitespace-pre-line text-tx">
        {reason}
      </p>
    </details>
  );
}
