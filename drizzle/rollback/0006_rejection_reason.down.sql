-- The reasons themselves are lost with the columns. Nothing else refers to
-- them, so the three drops are the whole of it.
ALTER TABLE "articles" DROP COLUMN "rejection_reason";--> statement-breakpoint
ALTER TABLE "memes" DROP COLUMN "rejection_reason";--> statement-breakpoint
ALTER TABLE "sponsors" DROP COLUMN "rejection_reason";
