import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/**
 * The template writes every control as an inline style. These are the same
 * values as class lists, so that a padding or a radius exists once instead of
 * once per screen — and so that the three screens that share a control cannot
 * drift apart while each still "matches the design".
 */

export const FIELD_CLASS =
  "w-full rounded-lg border border-bd bg-s2 px-[11px] py-[9px] font-control text-[13.5px] font-semibold text-tx outline-ac placeholder:text-tm";

export const FIELD_ERROR_CLASS = `${FIELD_CLASS} border-ac2`;

export const LABEL_CLASS =
  "block text-[10.5px] font-bold tracking-[0.12em] text-tm uppercase";

export const PRIMARY_BUTTON_CLASS =
  "cursor-pointer rounded-[9px] border-none bg-ac px-4 py-[11px] font-control text-[13.5px] font-bold text-white transition-[filter] duration-200 ease-out hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50";

export const QUIET_BUTTON_CLASS =
  "cursor-pointer rounded-[9px] border border-bd bg-transparent px-4 py-[11px] font-control text-[13.5px] font-semibold text-tx transition-colors duration-200 ease-out hover:border-ac disabled:cursor-not-allowed disabled:opacity-50";

export const PANEL_CLASS =
  "overflow-hidden rounded-[14px] border border-bd bg-s1";

export const PANEL_HEADING_CLASS =
  "border-b border-bd px-[18px] py-[14px] text-[11px] font-bold tracking-[0.12em] text-tm uppercase";

export const COLUMN_HEADING_CLASS =
  "text-[10.5px] font-bold tracking-[0.12em] text-tm uppercase";

export function Field({ label, error, ...input }: { label: string; error?: boolean } & ComponentProps<"input">) {
  return (
    <label className="flex flex-col gap-[7px]">
      <span className={error === true ? `${LABEL_CLASS} text-ac2` : LABEL_CLASS}>{label}</span>
      <input {...input} className={error === true ? FIELD_ERROR_CLASS : FIELD_CLASS} />
    </label>
  );
}

/**
 * The pill row of screen 7c and 10b. A filter is a link rather than a button so
 * that the current filter is in the URL — which is what lets a reader keep one
 * open in a tab and what makes the server the only thing deciding the rows.
 */
export function FilterPill({
  href,
  active,
  children,
}: {
  href: ComponentProps<typeof Link>["href"];
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1.5 text-[12.5px] font-bold no-underline transition-colors duration-200 ease-out ${
        active ? "bg-ac text-white" : "border border-bd text-tm hover:text-tx"
      }`}
    >
      {children}
    </Link>
  );
}

export function Chip({ active, children }: { active: boolean; children: ReactNode }) {
  return (
    <span
      className={`rounded-full px-[11px] py-1.5 text-xs font-bold ${
        active ? "bg-ac text-white" : "border border-bd text-tm"
      }`}
    >
      {children}
    </span>
  );
}

export function Avatar({
  initials,
  tone = "accent",
  size = 26,
}: {
  initials: string;
  tone?: "accent" | "ink" | "outline";
  size?: number;
}) {
  const tones = {
    accent: "bg-ac text-white",
    ink: "bg-tx text-s1",
    outline: "border-[1.5px] border-dashed border-bd text-tm",
  } as const;

  return (
    <span
      className={`grid flex-none place-items-center rounded-full font-bold ${tones[tone]}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
    >
      {initials}
    </span>
  );
}
