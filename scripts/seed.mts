import { randomBytes, createHash } from "node:crypto";

import { and, eq, isNull, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import type { ArticleCover } from "../lib/content.ts";
import { suggestCoverColorId } from "../lib/cover.ts";
import * as schema from "../lib/db/schema.ts";
import { environmentSchema } from "../lib/env-schema.ts";
import { countWords } from "../lib/word-count.ts";
import {
  ARTICLES,
  CATEGORIES,
  INVITATIONS,
  MEMBERS,
  PAGES,
  SPONSORS,
} from "./seed-content.mts";
import { document } from "./seed-prose.mts";

/**
 * The editorial content of the design template, written as rows. Every insert
 * is keyed on what the design already treats as unique — the address, the slug,
 * the sponsor's name — so a second run changes the rows rather than adding a
 * second set.
 *
 * Run it as: node --env-file=.env scripts/seed.mts
 */

const connection = environmentSchema
  .pick({ DATABASE_URL: true })
  .safeParse(process.env);

if (!connection.success) {
  console.error("DATABASE_URL is missing or is not a URL.");
  process.exit(1);
}

const pool = new Pool({ connectionString: connection.data.DATABASE_URL });
pool.on("error", () => undefined);
const db = drizzle(pool, { schema });

const seedUsers = async () => {
  const rows = [
    ...MEMBERS.map((member) => ({ ...member, status: "aktiv" as const, invitedAt: null })),
    ...INVITATIONS.map((invited) => ({
      email: invited.email,
      name: invited.name,
      initials: invited.initials,
      role: invited.role,
      form: invited.form,
      bio: null,
      ressorts: [] as string[],
      status: "eingeladen" as const,
      invitedAt: new Date(invited.invitedAt),
    })),
  ];

  await db
    .insert(schema.users)
    .values(rows.map((row) => ({ ...row, ressorts: [...row.ressorts] })))
    .onConflictDoUpdate({
      target: schema.users.email,
      set: {
        name: sql`excluded.name`,
        initials: sql`excluded.initials`,
        role: sql`excluded.role`,
        form: sql`excluded.form`,
        bio: sql`excluded.bio`,
        ressorts: sql`excluded.ressorts`,
        status: sql`excluded.status`,
        invitedAt: sql`excluded.invited_at`,
      },
    });

  const stored = await db
    .select({ id: schema.users.id, email: schema.users.email })
    .from(schema.users);

  return new Map(stored.map((user) => [user.email, user.id]));
};

const seedCategories = async () => {
  await db
    .insert(schema.categories)
    .values(
      CATEGORIES.map((category, index) => ({ ...category, position: index })),
    )
    .onConflictDoUpdate({
      target: schema.categories.slug,
      set: { name: sql`excluded.name`, position: sql`excluded.position` },
    });

  const stored = await db
    .select({ id: schema.categories.id, slug: schema.categories.slug })
    .from(schema.categories);

  return new Map(stored.map((category) => [category.slug, category.id]));
};

const seedArticles = async (
  userIds: Map<string, string>,
  categoryIds: Map<string, string>,
) => {
  const rows = ARTICLES.map((article) => {
    const body = document(article.body);
    const cover: ArticleCover = {
      word: article.coverWord,
      line: article.coverLine,
      colorId: suggestCoverColorId(article.title),
    };
    const publishedAt = new Date(article.publishedAt);

    return {
      slug: article.slug,
      title: article.title,
      teaser: article.teaser,
      body,
      cover,
      categoryId: categoryIds.get(article.category)!,
      authorId: userIds.get(article.author)!,
      status: "published" as const,
      publishAt: publishedAt,
      publishedAt,
      wordCount: countWords(body),
      updatedAt: publishedAt,
    };
  });

  await db
    .insert(schema.articles)
    .values(rows)
    .onConflictDoUpdate({
      target: schema.articles.slug,
      set: {
        title: sql`excluded.title`,
        teaser: sql`excluded.teaser`,
        body: sql`excluded.body`,
        cover: sql`excluded.cover`,
        categoryId: sql`excluded.category_id`,
        authorId: sql`excluded.author_id`,
        status: sql`excluded.status`,
        publishAt: sql`excluded.publish_at`,
        publishedAt: sql`excluded.published_at`,
        wordCount: sql`excluded.word_count`,
        updatedAt: sql`excluded.updated_at`,
      },
    });

  return rows.length;
};

const seedSponsors = async (userIds: Map<string, string>) => {
  for (const sponsor of SPONSORS) {
    const values = {
      name: sponsor.name,
      initials: sponsor.initials,
      url: sponsor.url,
      kind: sponsor.kind,
      startsAt: new Date(sponsor.startsAt),
      endsAt: new Date(sponsor.endsAt),
      active: true,
      status: sponsor.status,
      createdBy:
        sponsor.createdBy === null ? null : userIds.get(sponsor.createdBy)!,
    };

    const [existing] = await db
      .select({ id: schema.sponsors.id })
      .from(schema.sponsors)
      .where(eq(schema.sponsors.name, sponsor.name));

    if (existing === undefined) await db.insert(schema.sponsors).values(values);
    else
      await db
        .update(schema.sponsors)
        .set(values)
        .where(eq(schema.sponsors.id, existing.id));
  }

  return SPONSORS.length;
};

const seedPages = async () => {
  await db
    .insert(schema.pages)
    .values(
      PAGES.map((page) => ({
        slug: page.slug,
        title: page.title,
        body: document(page.body),
      })),
    )
    .onConflictDoUpdate({
      target: schema.pages.slug,
      set: {
        title: sql`excluded.title`,
        body: sql`excluded.body`,
        updatedAt: sql`now()`,
      },
    });

  return PAGES.length;
};

/**
 * The link itself is generated, hashed and dropped on the floor. A seeded
 * invitation has to be re-sent to be usable, which is the only safe state for
 * one that ships in a repository.
 */
const seedInvitations = async (userIds: Map<string, string>) => {
  const invitedBy = userIds.get("lina.brenner@voxaudax.de")!;
  let written = 0;

  for (const invitation of INVITATIONS) {
    const [open] = await db
      .select({ id: schema.invitations.id })
      .from(schema.invitations)
      .where(
        and(
          eq(schema.invitations.email, invitation.email),
          isNull(schema.invitations.acceptedAt),
        ),
      );

    if (open !== undefined) continue;

    await db.insert(schema.invitations).values({
      email: invitation.email,
      name: invitation.name,
      role: invitation.role,
      form: invitation.form,
      tokenSha256: createHash("sha256").update(randomBytes(32)).digest(),
      expiresAt: new Date(invitation.expiresAt),
      invitedBy,
      createdAt: new Date(invitation.invitedAt),
    });

    written += 1;
  }

  return written;
};

try {
  const userIds = await seedUsers();
  console.log(`users        ${MEMBERS.length} members, ${INVITATIONS.length} invited`);

  const categoryIds = await seedCategories();
  console.log(`categories   ${CATEGORIES.length}`);

  console.log(`articles     ${await seedArticles(userIds, categoryIds)}`);
  console.log(`sponsors     ${await seedSponsors(userIds)}`);
  console.log(`pages        ${await seedPages()}`);
  console.log(`invitations  ${await seedInvitations(userIds)} newly issued`);
} finally {
  await pool.end();
}
