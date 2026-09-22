-- PostgreSQL cannot remove a value from an enum, so the type is rebuilt without
-- it. Rejected memes and sponsors go back into the queue they were taken out
-- of — there is nowhere else to put them once the value is gone, and they are
-- already invisible and inactive, so nothing of theirs reaches a reader.
UPDATE "memes" SET "status" = 'review' WHERE "status" = 'abgelehnt';--> statement-breakpoint
UPDATE "sponsors" SET "status" = 'review' WHERE "status" = 'abgelehnt';--> statement-breakpoint
ALTER TYPE "public"."approval_status" RENAME TO "approval_status_with_rejected";--> statement-breakpoint
CREATE TYPE "public"."approval_status" AS ENUM('review', 'published');--> statement-breakpoint
ALTER TABLE "memes" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "sponsors" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "memes" ALTER COLUMN "status" TYPE "public"."approval_status" USING "status"::text::"public"."approval_status";--> statement-breakpoint
ALTER TABLE "sponsors" ALTER COLUMN "status" TYPE "public"."approval_status" USING "status"::text::"public"."approval_status";--> statement-breakpoint
ALTER TABLE "memes" ALTER COLUMN "status" SET DEFAULT 'review';--> statement-breakpoint
ALTER TABLE "sponsors" ALTER COLUMN "status" SET DEFAULT 'review';--> statement-breakpoint
DROP TYPE "public"."approval_status_with_rejected";
