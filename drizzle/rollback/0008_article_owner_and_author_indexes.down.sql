-- Indexes only, so nothing of the content is lost. Without "articles_body_idx"
-- the ownership question in lib/editorial/images reads every article row again,
-- once per delivered image byte.
DROP INDEX IF EXISTS "articles_author_updated_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "articles_body_idx";
