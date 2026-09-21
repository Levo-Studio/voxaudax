import "server-only";

import type { DependencyCheck } from "@/lib/health";

/**
 * Not critical: the site serves, people read, editors write and sign in without
 * it. What stops is invitations, password resets and approval notices — worth
 * reporting as degraded so it is noticed, not worth taking the instance out of
 * rotation for.
 *
 * Read straight from the environment rather than through the validated
 * accessor, for the same reason the health token is: a report on what is
 * missing must not itself require everything to be present.
 */
export const mailCheck: DependencyCheck = {
  name: "mail",
  critical: false,
  inspect: async () => {
    const key = process.env.RESEND_API_KEY ?? "";
    return key === ""
      ? { status: "degraded", error: "no key configured" }
      : { status: "ok" };
  },
};
