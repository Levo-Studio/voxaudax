import type { userForm, userRole } from "@/lib/db/schema";

/**
 * The words and the fixed choices the screens offer, with no database access
 * anywhere near them. They live apart from the repositories because a form is a
 * client component and a repository imports `server-only`: a shared constant
 * that lived beside the queries would drag the pool into the browser bundle.
 */

/** Screen 6a offers exactly these three runtimes and no free date entry. */
export const RUNTIMES = [
  { months: 3, label: "3 Monate" },
  { months: 6, label: "6 Monate" },
  { months: 12, label: "1 Jahr" },
] as const;

export type RuntimeMonths = (typeof RUNTIMES)[number]["months"];

export const isRuntime = (value: unknown): value is RuntimeMonths =>
  RUNTIMES.some((runtime) => runtime.months === value);

export const endOfRuntime = (from: Date, months: RuntimeMonths) => {
  const end = new Date(from);
  end.setMonth(end.getMonth() + months);
  return end;
};

/**
 * Screen 8a offers 24 hours or 7 days. @velve/auth mints its own artefacts at
 * fixed deadlines and offers no way to change them, which is why an invitation
 * is our own token in our own table.
 */
export const LINK_LIFETIMES = [
  { hours: 24, label: "24 Stunden" },
  { hours: 24 * 7, label: "7 Tage" },
] as const;

export type LinkLifetimeHours = (typeof LINK_LIFETIMES)[number]["hours"];

export const isLinkLifetime = (value: unknown): value is LinkLifetimeHours =>
  LINK_LIFETIMES.some((lifetime) => lifetime.hours === value);

export type Role = (typeof userRole.enumValues)[number];
export type Form = (typeof userForm.enumValues)[number];
