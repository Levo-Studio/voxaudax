-- Reverses 0000_editorial_schema.sql, and destroys everything it created.
-- Run it only against a database whose editorial content is expendable.
-- 0001 must be rolled back first: its constraint sits on "users".
DROP TABLE IF EXISTS "slug_history";
DROP TABLE IF EXISTS "invitations";
DROP TABLE IF EXISTS "memes";
DROP TABLE IF EXISTS "sponsors";
DROP TABLE IF EXISTS "articles";
DROP TABLE IF EXISTS "pages";
DROP TABLE IF EXISTS "categories";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_avatar_image_id_images_id_fk";
DROP TABLE IF EXISTS "images";
DROP TABLE IF EXISTS "users";
DROP TYPE IF EXISTS "public"."user_status";
DROP TYPE IF EXISTS "public"."user_role";
DROP TYPE IF EXISTS "public"."user_form";
DROP TYPE IF EXISTS "public"."sponsor_kind";
DROP TYPE IF EXISTS "public"."article_status";
DROP TYPE IF EXISTS "public"."approval_status";
DELETE FROM "drizzle"."__drizzle_migrations";
