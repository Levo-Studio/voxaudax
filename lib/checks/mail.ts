import "server-only";

import { environment } from "@/lib/env";
import type { DependencyCheck } from "@/lib/health";

/**
 * Not critical: the site serves, people read, editors write and sign in without
 * it. What stops is invitations, password resets and approval notices — worth
 * reporting as degraded so it is noticed, not worth taking the instance out of
 * rotation for.
 */
export const mailCheck: DependencyCheck = {
  name: "mail",
  critical: false,
  inspect: async () =>
    environment().RESEND_API_KEY === ""
      ? { status: "degraded", error: "no key configured" }
      : { status: "ok" },
};
