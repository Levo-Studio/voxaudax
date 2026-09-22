-- The column holds when a picture stopped being shown, nothing of the picture
-- itself. Dropping it makes every marked image count as attached again, which
-- is the state before this migration and loses no file.
DROP INDEX IF EXISTS "images_detached_idx";--> statement-breakpoint
ALTER TABLE "images" DROP COLUMN IF EXISTS "detached_at";
