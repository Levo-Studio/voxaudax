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

describe("who has to go through the review and who does not", () => {
  let author: Member;
  let approver: Member;
  let sponsorId: string;
  let ownId: string;

  const input = (name: string) => ({
    name,
    initials: "TST",
    url: null,
    startsAt: new Date("2026-01-01T00:00:00.000Z"),
    months: 12 as const,
  });

  before(async () => {
    // An autor is the only role the queue is for; everybody else is the queue.
    author = await memberFor("emil.radtke@voxaudax.de");
    approver = await memberFor("lina.brenner@voxaudax.de");

    const [created] = await createSponsor(author, input("Prüfeintrag"));
    sponsorId = created!.id;

    const [own] = await createSponsor(approver, input("Eintrag der Redaktionsleitung"));
    ownId = own!.id;
  });

  after(async () => {
    await db.delete(sponsors).where(eq(sponsors.id, sponsorId));
    await db.delete(sponsors).where(eq(sponsors.id, ownId));
  });

  const statusOf = async () => {
    const [row] = await db
      .select({ status: sponsors.status, name: sponsors.name })
      .from(sponsors)
      .where(eq(sponsors.id, sponsorId));
    return row!;
  };

  const statusById = async (id: string) => {
    const [row] = await db
      .select({ status: sponsors.status })
      .from(sponsors)
      .where(eq(sponsors.id, id));
    return row!.status;
  };

  it("queues what an autor enters, and publishes it on approval", async () => {
    assert.equal((await statusOf()).status, "review");
    assert.equal(await approveSponsor(approver, sponsorId), "approved");
    assert.equal((await statusOf()).status, "published");
  });

  it("publishes what somebody who may approve enters, without a queue", async () => {
    assert.equal(await statusById(ownId), "published");
  });

  it("returns an autor's published entry to the queue when it is rewritten", async () => {
    await updateSponsor(author, sponsorId, input("Prüfeintrag, umbenannt"));

    const row = await statusOf();
    assert.equal(row.name, "Prüfeintrag, umbenannt");
    assert.equal(row.status, "review");
  });

  it("leaves an entry that is already waiting where it is", async () => {
    await updateSponsor(author, sponsorId, input("Prüfeintrag, noch einmal"));
    assert.equal((await statusOf()).status, "review");
  });

  it("does not send an approver's own change back to the queue", async () => {
    await updateSponsor(approver, ownId, input("Eintrag der Redaktionsleitung, geändert"));
    assert.equal(await statusById(ownId), "published");
  });
});

after(async () => {
  await pool().end();
});
