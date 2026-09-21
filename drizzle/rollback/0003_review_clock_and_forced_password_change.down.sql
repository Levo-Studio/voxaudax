-- Both columns are additions, so the rollback removes what 0003 added and
-- nothing else. "Wartet seit" falls back to the last edit and a password an
-- admin set stops being marked as one the owner still has to replace.
ALTER TABLE "users" DROP COLUMN "must_change_password";
ALTER TABLE "articles" DROP COLUMN "submitted_at";
