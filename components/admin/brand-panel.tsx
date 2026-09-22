import type { ReactNode } from "react";

import { coverColorById, coverGridOverlay } from "@/lib/cover";

/**
 * The left half of screen 7a and the band above the form on 375 px: the
 * wordmark, then the block. The panel wears the project's own violet — the
 * colour the template calls --cov — and its ink, set the way every article
 * cover sets them, because those two tokens do not exist as Tailwind colours
 * and never did: `bg-cov` emitted nothing and the panel came out blank.
 *
 * White reads 7.2:1 on this violet, 6.1:1 at the paragraph's 90% and 5.1:1 at
 * the label's 80%.
 */
const PANEL = coverColorById("violett");

export function BrandPanel({ children }: { children?: ReactNode }) {
  return (
    <div
      className="relative flex flex-col overflow-hidden px-[18px] pt-6 pb-7 [--cover-grid:44px] md:p-11 md:[--cover-grid:58px]"
      style={{ background: PANEL.value, color: PANEL.text }}
    >
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage: coverGridOverlay(PANEL.text),
          backgroundSize: "var(--cover-grid) 100%, 100% var(--cover-grid)",
        }}
      />
      <span className="relative flex items-baseline gap-2 md:gap-2.5">
        <span className="text-[18px] font-extrabold tracking-[-0.04em] md:text-2xl">
          VOX AUDAX
        </span>
        <span className="text-[10.5px] font-bold tracking-[0.14em] opacity-80 uppercase md:text-xs">
          Redaktion
        </span>
      </span>

      {/* The template's third row was the room and the hour, which is gone; with
          two children left, space-between would have pinned the block to the
          floor, so it centres in what the wordmark leaves instead. */}
      <div className="relative mt-[22px] flex flex-1 flex-col justify-center md:mt-0">
        <div className="text-[34px] leading-[0.92] font-extrabold tracking-[-0.05em] whitespace-nowrap md:text-[64px] md:leading-[0.9] md:tracking-[-0.055em]">
          REDAKTION
        </div>
        {children}
      </div>
    </div>
  );
}
