-- Fails while any row has no kind, which is what the column now allows. Fill
-- those rows first, or leave the migration in place.
ALTER TABLE "sponsors" ALTER COLUMN "kind" SET NOT NULL;
