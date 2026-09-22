-- PostgreSQL cannot remove a value from an enum, so the type is rebuilt without
-- it. Anyone who had left is counted as active again and reappears on the
-- masthead — there is nowhere else to put them once the value is gone.
UPDATE "users" SET "status" = 'aktiv' WHERE "status" = 'ehemalig';--> statement-breakpoint
ALTER TYPE "public"."user_status" RENAME TO "user_status_with_former";--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('eingeladen', 'aktiv');--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "status" TYPE "public"."user_status" USING "status"::text::"public"."user_status";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "status" SET DEFAULT 'eingeladen';--> statement-breakpoint
DROP TYPE "public"."user_status_with_former";
