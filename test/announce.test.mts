import assert from "node:assert/strict";
import { after, describe, it } from "node:test";

import { eq } from "drizzle-orm";

import type { Member } from "@/lib/authorize";
import { db } from "@/lib/db/client";
import { articles, users } from "@/lib/db/schema";
import { approvedArticleMail } from "@/lib/editorial/announce";
import { pool } from "@/lib/db/pool";

/**
 * 8b, 11b and 12a were drawn, written, rendered and never sent: the templates
 * existed and nothing called them. These check what would now go out, without
 * anything going out — the building of a mail is separate from its posting for
 * exactly this reason.
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

after(async () => {
  await pool().end();
});

describe("the mail that goes out when an article is approved", () => {
  it("names the reviewer, the author, the category and the article's own address", async () => {
    const approver = await memberFor("julius@levo-studio.com");

    const [article] = await db
      .select({ id: articles.id, title: articles.title, slug: articles.slug })
      .from(articles)
      .where(eq(articles.status, "published"))
      .limit(1);
    assert.ok(article, "the seed has no published article");

    const delivery = await approvedArticleMail(approver, article.id);
    assert.ok(delivery, "an approved article should produce a mail");
    assert.equal(delivery.mail.template, "approval");

    const props = delivery.mail.props as {
      item: { kind: string; title: string; url: string; author: string; category: string };
      reviewer: { name: string; roleLabel: string };
      submitterEmail: string;
    };

    assert.equal(props.item.kind, "article");
    assert.equal(props.item.title, article.title);
    assert.match(props.item.url, new RegExp(`/artikel/${article.slug}$`));
    assert.equal(props.reviewer.name, approver.name);
    assert.ok(props.item.category.length > 0, "the category has to be named");
    assert.ok(props.submitterEmail.includes("@"), "the author's address has to be there");
  });

  it("goes to every admin and to the person who wrote it, and to nobody else", async () => {
    const approver = await memberFor("julius@levo-studio.com");

    const [article] = await db
      .select({ id: articles.id, authorId: articles.authorId })
      .from(articles)
      .where(eq(articles.status, "published"))
      .limit(1);
    assert.ok(article);

    const [author] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, article.authorId));
    assert.ok(author);

    const admins = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.role, "admin"));
    const active = admins.map((row) => row.email);

    const delivery = await approvedArticleMail(approver, article.id);
    assert.ok(delivery);

    assert.ok(
      delivery.to.includes(author.email),
      "the person who wrote it has to be told",
    );
    for (const recipient of delivery.to) {
      assert.ok(
        recipient === author.email || active.includes(recipient),
        `${recipient} is neither an admin nor the author`,
      );
    }
  });

  it("produces nothing for an article that is not there", async () => {
    const approver = await memberFor("julius@levo-studio.com");
    const nothing = await approvedArticleMail(
      approver,
      "00000000-0000-4000-8000-000000000000",
    );

    assert.equal(nothing, null);
  });
});
