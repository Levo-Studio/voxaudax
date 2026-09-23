import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  customType,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

import type { ArticleCover, TipTapDocument } from "../content.ts";
// Relative and extensioned so the seed and migration scripts, which run on
// node without a bundler, resolve the same module the application does.
import { COVER_COLORS } from "../cover.ts";

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType: () => "bytea",
});

const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const userRole = pgEnum("user_role", ["autor", "redakteur", "admin"]);

/**
 * Drives the gendered role label on the editorial page, in the imprint and in
 * approval mail — "Redaktionsleitung" is one word for one role.
 */
export const userForm = pgEnum("user_form", [
  "weiblich",
  "maennlich",
  "neutral",
]);

/**
 * `ehemalig` is where somebody goes who has left but whose work has not. The
 * row stays so the articles keep an author with a name; everything that lists
 * the editorial team asks for `aktiv` and therefore stops showing them.
 */
export const userStatus = pgEnum("user_status", [
  "eingeladen",
  "aktiv",
  "ehemalig",
]);

export const articleStatus = pgEnum("article_status", [
  "draft",
  "review",
  "published",
]);

/**
 * `abgelehnt` is where a submission goes that a reviewer turned down. Without
 * it a rejection had nowhere to put the row, so it stayed in the queue and the
 * button looked broken. An article is returned to `draft` instead — its author
 * is expected to work on it again, which is not true of a meme or a sponsor.
 */
export const approvalStatus = pgEnum("approval_status", [
  "review",
  "published",
  "abgelehnt",
]);

export const sponsorKind = pgEnum("sponsor_kind", [
  "druckkosten",
  "material",
  "technik",
  "foerderverein",
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    /**
     * The account in the `velve` schema, null until the invited person sets a
     * password and one exists — which is what `status` reports. The foreign key
     * onto `velve.user(id)` is added by its own migration: drizzle-kit manages
     * `public` only, and a schema it managed would be a schema it could drop.
     */
    velveUserId: uuid("velve_user_id").unique(),

    email: text("email").notNull().unique(),
    name: text("name").notNull(),
    initials: text("initials").notNull(),
    role: userRole("role").notNull().default("autor"),
    form: userForm("form").notNull().default("neutral"),
    bio: text("bio"),
    ressorts: text("ressorts").array().notNull().default(sql`'{}'::text[]`),
    avatarImageId: uuid("avatar_image_id").references(
      (): AnyPgColumn => images.id,
      { onDelete: "set null" },
    ),
    status: userStatus("status").notNull().default("eingeladen"),

    /**
     * Screen 12a: a password an admin set and handed over personally is not the
     * person's own yet, so the next sign-in leads to the account page and no
     * further until they have replaced it.
     */
    mustChangePassword: boolean("must_change_password").notNull().default(false),

    invitedAt: timestamp("invited_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (table) => [index("users_role_idx").on(table.role, table.name)],
);

/** A label and an archive filter. Categories have no page of their own. */
export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),

    /**
     * The chip row reads Schulpolitik, Veranstaltungen, Politik, Kultur, Sport,
     * Vermischtes — an editorial order that neither the name nor the slug sorts
     * into.
     */
    position: smallint("position").notNull(),
  },
  (table) => [uniqueIndex("categories_position_idx").on(table.position)],
);

export const images = pgTable("images", {
  id: uuid("id").primaryKey().defaultRandom(),

  /** The object key inside the bucket. Never a URL: the server serves the bytes. */
  key: text("key").notNull().unique(),

  width: integer("width").notNull(),
  height: integer("height").notNull(),
  mime: text("mime").notNull(),

  /** Null is the "Alt-Text fehlt" the approval list refuses to publish on. */
  alt: text("alt"),

  blurhash: text("blurhash"),
  uploadedBy: uuid("uploaded_by").references((): AnyPgColumn => users.id, {
    onDelete: "set null",
  }),

  /**
   * When the last article that showed this picture stopped showing it.
   *
   * Set rather than deleted, because the editor saves a second after the last
   * keystroke: a picture removed and put back — an undo, a cut and paste, a
   * block dragged past the end of the list — would otherwise be gone between
   * the two saves, and what came back would point at nothing. Putting it back
   * clears this again; what stays marked for a day is swept.
   *
   * Only the article path ever writes it, so a meme and a sponsor's logo,
   * which no article body names, are never marked and never swept.
   */
  detachedAt: timestamp("detached_at", { withTimezone: true }),

  createdAt: createdAt(),
});

const coverColorIds = COVER_COLORS.map((color) => `'${color.id}'`).join(", ");

export const articles = pgTable(
  "articles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    teaser: text("teaser").notNull(),
    body: jsonb("body").$type<TipTapDocument>().notNull(),
    cover: jsonb("cover").$type<ArticleCover>().notNull(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    /**
     * A name typed into the editor, for somebody who wrote a piece and has no
     * account — a guest, a class, somebody who wrote once. Null is the normal
     * case and means the byline is the account holder's own name.
     *
     * `authorId` stays whatever it was: it is who owns the row in the back
     * office and decides who may edit it, which is a different question from
     * whose name stands under the headline.
     */
    guestAuthor: text("guest_author"),

    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    status: articleStatus("status").notNull().default("draft"),

    /**
     * Why a reviewer sent it back, in their own words. Kept on the row rather
     * than mailed and forgotten: the person who has to act on it is looking at
     * the article, not at their inbox. Cleared when it is submitted again, so
     * a reason never outlives the draft it was about.
     */
    rejectionReason: text("rejection_reason"),

    /** What the review list's "Wartet seit" counts from, and no edit moves it. */
    submittedAt: timestamp("submitted_at", { withTimezone: true }),

    publishAt: timestamp("publish_at", { withTimezone: true }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    wordCount: integer("word_count").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "articles_cover_color_known",
      sql`${table.cover}->>'colorId' IN (${sql.raw(coverColorIds)})`,
    ),
    check(
      "articles_published_has_date",
      sql`${table.status} <> 'published' OR ${table.publishedAt} IS NOT NULL`,
    ),
    index("articles_published_idx")
      .on(table.publishedAt.desc())
      .where(sql`${table.status} = 'published'`),
    index("articles_category_published_idx")
      .on(table.categoryId, table.publishedAt.desc())
      .where(sql`${table.status} = 'published'`),
    index("articles_author_published_idx")
      .on(table.authorId, table.publishedAt.desc())
      .where(sql`${table.status} = 'published'`),
    index("articles_status_updated_idx").on(
      table.status,
      table.updatedAt.desc(),
    ),

    /**
     * The three indexes above are partial on `status = 'published'`, and the
     * back office asks without a status: an author's list, their count and the
     * count per status all filter on `author_id` alone, which no partial index
     * and no foreign key covers.
     */
    index("articles_author_updated_idx").on(table.authorId, table.updatedAt.desc()),

    /**
     * `imageAccess` asks which article a picture stands in, and it asks on
     * every delivered byte. `jsonb_path_ops` indexes exactly the one question
     * put to this column — containment — and nothing else about the document.
     */
    index("articles_body_idx").using("gin", sql`${table.body} jsonb_path_ops`),
    index("articles_search_idx").using(
      "gin",
      sql`to_tsvector('german', ${table.title} || ' ' || ${table.teaser})`,
    ),
  ],
);

/** A slug survives its article: every earlier one redirects to the current URL. */
export const slugHistory = pgTable(
  "slug_history",
  {
    oldSlug: text("old_slug").primaryKey(),
    articleId: uuid("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (table) => [index("slug_history_article_idx").on(table.articleId)],
);

export const memes = pgTable(
  "memes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    imageId: uuid("image_id")
      .notNull()
      .unique()
      .references(() => images.id, { onDelete: "restrict" }),
    caption: text("caption"),
    visible: boolean("visible").notNull().default(true),
    status: approvalStatus("status").notNull().default("review"),

    /** Why it was turned down, in the reviewer's own words. */
    rejectionReason: text("rejection_reason"),

    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: createdAt(),
  },
  (table) => [
    index("memes_gallery_idx")
      .on(table.createdAt.desc())
      .where(sql`${table.status} = 'published' AND ${table.visible}`),
    index("memes_status_idx").on(table.status, table.createdAt.desc()),
  ],
);

export const sponsors = pgTable(
  "sponsors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),

    /** "SP" for Sportgeschäft Renz — the tile's fallback, and not derivable. */
    initials: text("initials").notNull(),

    logoImageId: uuid("logo_image_id").references(() => images.id, {
      onDelete: "set null",
    }),
    url: text("url"),
    /**
     * No longer asked for, no longer shown, and no longer written. The column
     * stays until somebody decides the four values on the existing rows may be
     * lost — dropping it is not something an interface change should do behind
     * a reader's back.
     */
    kind: sponsorKind("kind"),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    active: boolean("active").notNull().default(true),
    status: approvalStatus("status").notNull().default("review"),

    /** Why it was turned down, in the reviewer's own words. */
    rejectionReason: text("rejection_reason"),

    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: createdAt(),
  },
  (table) => [
    check("sponsors_runtime_ordered", sql`${table.endsAt} > ${table.startsAt}`),
    index("sponsors_visible_idx")
      .on(table.endsAt, table.startsAt)
      .where(sql`${table.active} AND ${table.status} = 'published'`),
  ],
);

/** Impressum, Datenschutz and the paragraph above the editorial list. */
export const pages = pgTable("pages", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  body: jsonb("body").$type<TipTapDocument>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const invitations = pgTable(
  "invitations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    role: userRole("role").notNull(),
    form: userForm("form").notNull(),

    /** The link is single-use; only what the redemption compares is stored. */
    tokenSha256: bytea("token_sha256").notNull().unique(),

    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    invitedBy: uuid("invited_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (table) => [
    index("invitations_open_idx")
      .on(table.email)
      .where(sql`${table.acceptedAt} IS NULL`),
  ],
);
