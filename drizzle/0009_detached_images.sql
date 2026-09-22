ALTER TABLE "images" ADD COLUMN "detached_at" timestamp with time zone;--> statement-breakpoint
-- Only marked rows are ever looked for, and they are the few: a partial index
-- so the sweep does not read every picture the newspaper has ever held.
CREATE INDEX "images_detached_idx" ON "images" ("detached_at") WHERE "detached_at" IS NOT NULL;
