import "server-only";
import { and, eq, inArray, isNotNull, ne, sql } from "drizzle-orm";

import type { Member } from "@/lib/authorize";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { ROLE_MATRIX, type Capability } from "@/lib/roles";

/**
 * Screen 11a: "niemand gibt die eigene Einreichung frei." The rule is a second
 * pair of eyes, and it holds — as long as a second pair exists.
 *
 * In an installation with one account it does not. A newspaper that is one
 * person at the start cannot publish anything at all: the sponsor they entered,
 * the article they wrote and the meme they uploaded are all theirs, and there
 * is nobody else who may approve them. That is not a safeguard, it is a lock on
 * the whole application, and a rule whose only effect is a deadlock protects
 * nobody.
 *
 * So the question is asked of the situation rather than assumed: is there
 * anybody else who could do this? If yes, the rule stands and the submitter is
 * refused. If no, they are the review, and the decision is theirs.
 */
export const somebodyElseCouldApprove = async (
  approver: Member,
  capability: Capability,
) => {
  const roles = ROLE_MATRIX[capability];

  const [row] = await db
    .select({ others: sql<number>`count(*)::int` })
    .from(users)
    .where(
      and(
        ne(users.id, approver.id),
        eq(users.status, "aktiv"),
        // An account, not just a row: somebody who has never set a password
        // cannot sign in, and cannot review anything.
        isNotNull(users.velveUserId),
        inArray(users.role, [...roles]),
      ),
    );

  return (row?.others ?? 0) > 0;
};
