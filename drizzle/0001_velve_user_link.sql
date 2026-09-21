-- Written by hand. drizzle-kit is confined to `public`, so it can neither see
-- `velve.user` nor emit a reference to it; a snapshot that owned the velve
-- schema would also be a snapshot that could drop it.
--
-- ON DELETE CASCADE is what @velve/auth requires of every reference to
-- velve.user(id): deleting an account has to empty every table holding its rows.
ALTER TABLE "users"
  ADD CONSTRAINT "users_velve_user_id_velve_user_id_fk"
  FOREIGN KEY ("velve_user_id") REFERENCES "velve"."user"("id")
  ON DELETE cascade ON UPDATE no action;
