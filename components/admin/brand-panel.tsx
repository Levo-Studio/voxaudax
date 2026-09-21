import type { ReactNode } from "react";

/**
 * The left half of screen 7a and the band above the form on 375 px. Three rows
 * on the desktop — the wordmark, the block, the room and the hour — which is
 * why the footer is a child of the panel and not of the block above it.
 *
 * The grid is drawn in the cover ink at 14%, as the rest of the project draws
 * it: white at 14% was right only while every cover sat on the one violet.
 */
export function BrandPanel({
  children,
  footer,
}: {
  children?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="relative flex flex-col justify-between overflow-hidden bg-cov px-[18px] pt-6 pb-7 text-covtx md:p-11">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, color-mix(in srgb, var(--covtx) 14%, transparent) 0 1px, transparent 1px), linear-gradient(to bottom, color-mix(in srgb, var(--covtx) 14%, transparent) 0 1px, transparent 1px)",
          backgroundSize: "44px 100%, 100% 44px",
        }}
      />
      <span className="relative flex items-baseline gap-2 md:gap-2.5">
        <span className="text-[18px] font-extrabold tracking-[-0.04em] md:text-2xl">VOX AUDAX</span>
        <span className="text-[10.5px] font-bold tracking-[0.14em] opacity-80 uppercase md:text-xs">
          Redaktion
        </span>
      </span>

      <div className="relative mt-[22px] md:mt-0">
        <div className="text-[34px] leading-[0.92] font-extrabold tracking-[-0.05em] whitespace-nowrap md:text-[64px] md:leading-[0.9] md:tracking-[-0.055em]">
          REDAKTION
        </div>
        {children}
      </div>

      {footer === undefined ? null : (
        <div className="relative mt-8 text-[12.5px] font-semibold opacity-80 md:mt-0">{footer}</div>
      )}
    </div>
  );
}
