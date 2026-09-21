CREATE TYPE "public"."approval_status" AS ENUM('review', 'published');--> statement-breakpoint
CREATE TYPE "public"."article_status" AS ENUM('draft', 'review', 'published');--> statement-breakpoint
CREATE TYPE "public"."sponsor_kind" AS ENUM('druckkosten', 'material', 'technik', 'foerderverein');--> statement-breakpoint
CREATE TYPE "public"."user_form" AS ENUM('weiblich', 'maennlich', 'neutral');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('autor', 'redakteur', 'admin');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('eingeladen', 'aktiv');--> statement-breakpoint
CREATE TABLE "articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"teaser" text NOT NULL,
	"body" jsonb NOT NULL,
	"cover" jsonb NOT NULL,
	"category_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"status" "article_status" DEFAULT 'draft' NOT NULL,
	"publish_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"word_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "articles_slug_unique" UNIQUE("slug"),
	CONSTRAINT "articles_cover_color_known" CHECK ("articles"."cover"->>'colorId' IN ('violett', 'ultramarin', 'azur', 'petrol', 'tanne', 'oliv', 'signalgelb', 'bernstein', 'rost', 'karmin', 'magenta', 'kastanie', 'schiefer', 'schwarz')),
	CONSTRAINT "articles_published_has_date" CHECK ("articles"."status" <> 'published' OR "articles"."published_at" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"position" smallint NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"mime" text NOT NULL,
	"alt" text,
	"blurhash" text,
	"uploaded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "images_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"role" "user_role" NOT NULL,
	"form" "user_form" NOT NULL,
	"token_sha256" "bytea" NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"invited_by" uuid NOT NULL,
	"accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invitations_token_sha256_unique" UNIQUE("token_sha256")
);
--> statement-breakpoint
CREATE TABLE "memes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"image_id" uuid NOT NULL,
	"caption" text,
	"visible" boolean DEFAULT true NOT NULL,
	"status" "approval_status" DEFAULT 'review' NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "memes_image_id_unique" UNIQUE("image_id")
);
--> statement-breakpoint
CREATE TABLE "pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"body" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pages_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "slug_history" (
	"old_slug" text PRIMARY KEY NOT NULL,
	"article_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sponsors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"initials" text NOT NULL,
	"logo_image_id" uuid,
	"url" text,
	"kind" "sponsor_kind" NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"status" "approval_status" DEFAULT 'review' NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sponsors_runtime_ordered" CHECK ("sponsors"."ends_at" > "sponsors"."starts_at")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"velve_user_id" uuid NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"initials" text NOT NULL,
	"role" "user_role" DEFAULT 'autor' NOT NULL,
	"form" "user_form" DEFAULT 'neutral' NOT NULL,
	"bio" text,
	"ressorts" text[] DEFAULT '{}'::text[] NOT NULL,
	"avatar_image_id" uuid,
	"status" "user_status" DEFAULT 'eingeladen' NOT NULL,
	"invited_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_velve_user_id_unique" UNIQUE("velve_user_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "images" ADD CONSTRAINT "images_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memes" ADD CONSTRAINT "memes_image_id_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memes" ADD CONSTRAINT "memes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slug_history" ADD CONSTRAINT "slug_history_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sponsors" ADD CONSTRAINT "sponsors_logo_image_id_images_id_fk" FOREIGN KEY ("logo_image_id") REFERENCES "public"."images"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sponsors" ADD CONSTRAINT "sponsors_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_avatar_image_id_images_id_fk" FOREIGN KEY ("avatar_image_id") REFERENCES "public"."images"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "articles_published_idx" ON "articles" USING btree ("published_at" DESC NULLS LAST) WHERE "articles"."status" = 'published';--> statement-breakpoint
CREATE INDEX "articles_category_published_idx" ON "articles" USING btree ("category_id","published_at" DESC NULLS LAST) WHERE "articles"."status" = 'published';--> statement-breakpoint
CREATE INDEX "articles_author_published_idx" ON "articles" USING btree ("author_id","published_at" DESC NULLS LAST) WHERE "articles"."status" = 'published';--> statement-breakpoint
CREATE INDEX "articles_status_updated_idx" ON "articles" USING btree ("status","updated_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "articles_search_idx" ON "articles" USING gin (to_tsvector('german', "title" || ' ' || "teaser"));--> statement-breakpoint
CREATE UNIQUE INDEX "categories_position_idx" ON "categories" USING btree ("position");--> statement-breakpoint
CREATE INDEX "invitations_open_idx" ON "invitations" USING btree ("email") WHERE "invitations"."accepted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "memes_gallery_idx" ON "memes" USING btree ("created_at" DESC NULLS LAST) WHERE "memes"."status" = 'published' AND "memes"."visible";--> statement-breakpoint
CREATE INDEX "memes_status_idx" ON "memes" USING btree ("status","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "slug_history_article_idx" ON "slug_history" USING btree ("article_id");--> statement-breakpoint
CREATE INDEX "sponsors_visible_idx" ON "sponsors" USING btree ("ends_at","starts_at") WHERE "sponsors"."active" AND "sponsors"."status" = 'published';--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role","name");