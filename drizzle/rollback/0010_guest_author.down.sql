-- The column holds a byline typed into the editor for somebody without an
-- account. Dropping it makes every one of those articles read as written by
-- the member who owns the row — which is where they stood before, and loses
-- only the guest's name.
ALTER TABLE "articles" DROP COLUMN IF EXISTS "guest_author";
