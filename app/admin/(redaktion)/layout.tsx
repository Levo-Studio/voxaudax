import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/admin-shell";
import { requireMember } from "@/lib/authorize";

/**
 * Everything in this group is behind the login. The gate is here rather than
 * repeated on each page, and each page asks for its own member again — the
 * lookup is memoised per request, so that costs nothing and means no page can
 * be added to this group and read a row without a member in hand.
 */
export default async function RedaktionLayout({ children }: { children: ReactNode }) {
  const member = await requireMember({ allowForcedPasswordChange: true });

  return <AdminShell member={member}>{children}</AdminShell>;
}
