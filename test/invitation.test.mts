import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import { and, eq, isNull } from "drizzle-orm";

import type { Member } from "@/lib/authorize";
import { db } from "@/lib/db/client";
import { invitations, users } from "@/lib/db/schema";
import { issueInvitation, openInvitation } from "@/lib/editorial/invitations";
import { pool } from "@/lib/db/pool";

/**
 * Every account in this application exists because somebody was invited, so
 * this module is the whole way in. Three of its rules are single lines that a
 * refactor takes out without anything else changing: the link dies at its
 * hour, it dies once it has been used, and issuing a new one kills the one sent
 * before. A fourth is a `case` inside an upsert: an invitation to an address
 * that already has an account does not hand that account a new role.
 *
 * `redeemInvitation` is not read here — it signs an account up in the `velve`
 * schema, and everything below is answered before that. Which is the point: the
 * link is refused, or it is not, and only then is anything created.
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

describe("an invitation link opens once, until its hour, and not after the next one", () => {
  let admin: Member;

  const invited = `test-einladung-${crypto.randomUUID()}@voxaudax.de`;

  const invite = () =>
    issueInvitation({
      invitedBy: admin,
      email: invited,
      name: "Eingeladene Person",
      initials: "EP",
      role: "autor",
      form: "neutral",
      hours: 24,
    });

  before(async () => {
    admin = await memberFor("lina.brenner@voxaudax.de");
    assert.equal(admin.role, "admin");
  });

  after(async () => {
    await db.delete(invitations).where(eq(invitations.email, invited));
    await db.delete(users).where(eq(users.email, invited));
  });

  it("opens the link it just sent", async () => {
    const { token } = await invite();
    const opened = await openInvitation(token);

    assert.equal(opened?.email, invited);
    assert.equal(opened?.role, "autor");
    assert.equal(opened?.invitedByName, admin.name);
  });

  it("opens nothing for a token that names no invitation", async () => {
    assert.equal(await openInvitation("kein-token"), null);
  });

  it("opens nothing once the hour has passed", async () => {
    const { token } = await invite();

    await db
      .update(invitations)
      .set({ expiresAt: new Date(Date.now() - 60_000) })
      .where(eq(invitations.email, invited));

    assert.equal(await openInvitation(token), null);
  });

  /**
   * The link is single-use because the account it creates exists afterwards: a
   * second redemption of the same mail would be a second sign-up on an address
   * that is taken, and the row is what refuses it.
   */
  it("opens nothing a second time once it has been redeemed", async () => {
    const { token } = await invite();

    await db
      .update(invitations)
      .set({ acceptedAt: new Date() })
      .where(eq(invitations.email, invited));

    assert.equal(await openInvitation(token), null);
  });

  /**
   * "Erneut senden" is what an admin presses when the first mail did not
   * arrive. If both links stayed open, the first one — sitting in a forwarded
   * mail thread — would still create the account weeks later.
   */
  it("kills the previous link when the invitation is sent again", async () => {
    const first = await invite();
    const second = await invite();

    assert.equal(await openInvitation(first.token), null);
    assert.equal((await openInvitation(second.token))?.email, invited);
  });

  it("leaves exactly one open invitation per address behind", async () => {
    await invite();
    await invite();

    // Only the open ones: a redeemed row stays where it is, which is how an
    // admin sees that the address was taken up at all.
    const open = await db
      .select({ id: invitations.id })
      .from(invitations)
      .where(and(eq(invitations.email, invited), isNull(invitations.acceptedAt)));

    assert.equal(open.length, 1);
  });
});

/**
 * An invitation is not a way to hand somebody a role. The address row is
 * upserted, so an invitation addressed to somebody who already works here meets
 * their account — and writing the invited role into it would promote a signed-in
 * autor to admin without anybody having given them the role.
 */
describe("an invitation to an address that already has an account changes nothing about it", () => {
  let admin: Member;
  let existingId: string;

  const existing = `test-vorhanden-${crypto.randomUUID()}@voxaudax.de`;

  before(async () => {
    admin = await memberFor("lina.brenner@voxaudax.de");

    const [created] = await db
      .insert(users)
      .values({
        email: existing,
        name: "Vorhandene Person",
        initials: "VP",
        role: "autor",
        form: "neutral",
        status: "aktiv",
      })
      .returning({ id: users.id });

    existingId = created!.id;
  });

  after(async () => {
    await db.delete(invitations).where(eq(invitations.email, existing));
    await db.delete(users).where(eq(users.id, existingId));
  });

  it("leaves the role, the name and the status where they were", async () => {
    await issueInvitation({
      invitedBy: admin,
      email: existing,
      name: "Umbenannt durch die Einladung",
      initials: "XX",
      role: "admin",
      form: "weiblich",
      hours: 24,
    });

    const [row] = await db
      .select({
        role: users.role,
        name: users.name,
        form: users.form,
        status: users.status,
      })
      .from(users)
      .where(eq(users.id, existingId));

    assert.equal(row?.role, "autor");
    assert.equal(row?.name, "Vorhandene Person");
    assert.equal(row?.form, "neutral");
    assert.equal(row?.status, "aktiv");
  });
});

after(async () => {
  await pool().end();
});
