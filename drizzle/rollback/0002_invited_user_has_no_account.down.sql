-- Fails while any row has no account linked, which is what the column now
-- allows; clear those rows first or leave the migration in place.
ALTER TABLE "users" ALTER COLUMN "velve_user_id" SET NOT NULL;
