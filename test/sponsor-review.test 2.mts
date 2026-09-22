import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import { eq } from "drizzle-orm";

import type { Member } from "@/lib/authorize";
import { db } from "@/lib/db/client";
import { pool } from "@/lib/db/pool";
import { sponsors, users } from "@/lib/db/schema";
import { approveSponsor, createSponsor, updateSponsor } from "@/lib/editorial/sponsors";

/**
 * Screen 6b's freigabe is about what the homepage shows. Editing a published
 * entry changes what was approved, and it used to reach the public site
 * unread — the same shape of hole as autosave on a published article.
 */
const memberFor = async (email: string): Promise<Member> => {
  const [row] = await db.select().from(users).where(eq(users.email, email));
  assert.ok(row, `the seed has no member ${email}`);

  return {
    id: row.id,
    velveUserId: row.velveUserId ?? row.id,
    email: row.email,
    name: row.name,
    initials: row.initials,
    role: row.role,
    form: row.form,
    bio: row.bio,
    mustChangePassword: row.mustChangePassword,
  };
};

describe("a published sponsor goes back through the review when it is edited", () => {
  let creator: Member;
  let approver: Member;
  let sponsorId: string;

  const input = (name: string) => ({
    name,
    initials: "TST",
    url: null,
    kind: "foerderverein" as const,
    startsAt: new Date("2026-01-01T00:00:00.000Z"),
    months: 12 as const,
  });

  before(async () => {
    creator = await memberFor("mira.oezkan@voxaudax.de");
    approver = await memberFor("lina.brenner@voxaudax.de");

    const [created] = await createSponsor(creator, input("Prüfeintrag"));
    sponsorId = created!.id;
  });

  after(async () => {
    await db.delete(sponsors).where(eq(sponsors.id, sponsorId));
  });

  const statusOf = async () => {
    const [row] = await db
      .select({ status: sponsors.status, name: sponsors.name })
      .from(sponsors)
      .where(eq(sponsors.id, sponsorId));
    return row!;
  };

  it("starts in the review queue and is published by an approval", async () => {
    assert.equal((await statusOf()).status, "review");
    assert.equal(await approveSponsor(approver, sponsorId), "approved");
    assert.equal((await statusOf()).status, "published");
  });

  it("returns a published entry to the queue when it is rewritten", async () => {
    await updateSponsor(sponsorId, input("Prüfeintrag, umbenannt"));

    const row = await statusOf();
    assert.equal(row.name, "Prüfeintrag, umbenannt");
    assert.equal(row.status, "review");
  });

  it("leaves an entry that is already waiting where it is", async () => {
    await updateSponsor(sponsorId, input("Prüfeintrag, noch einmal"));
    assert.equal((await statusOf()).status, "review");
  });
});

after(async () => {
  await pool().end();
});
