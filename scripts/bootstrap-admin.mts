
import { db } from "../lib/db/client.ts";
import { users } from "../lib/db/schema.ts";
import { invitationPath, issueInvitation } from "../lib/editorial/invitations.ts";
import { environment } from "../lib/env.ts";
import { initialsOf } from "../lib/format.ts";

/**
 * The first administrator, who cannot be invited by anyone because nobody
 * exists yet to do the inviting. Every other account is created through the
 * back office; this one closes the circle once, and it is the only path that
 * does — it refuses to run the moment a real account exists.
 *
 * It creates no password and no session: it issues the same one-time link the
 * back office issues, and the person sets their own password behind it.
 *
 *   node --env-file=.env scripts/bootstrap-admin.mts \
 *     --email julius@levo-studio.com --name "Julius Grimm" --form maennlich
 */

const option = (name: string) => {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return undefined;
  const value = process.argv[index + 1];
  return value === undefined || value.startsWith("--") ? undefined : value;
};

const isForm = (value: string): value is "weiblich" | "maennlich" | "neutral" =>
  value === "weiblich" || value === "maennlich" || value === "neutral";

const main = async () => {
  const email = option("email");
  const name = option("name");
  const form = option("form") ?? "neutral";

  if (email === undefined || name === undefined) {
    throw new Error("--email and --name are both required");
  }
  if (!isForm(form)) {
    throw new Error(`--form must be weiblich, maennlich or neutral`);
  }

  // A second run once somebody has an account would be a way to mint an
  // administrator without going through the back office, so it is refused.
  const withAccount = await db.query.users.findFirst({
    columns: { email: true },
    where: (row, { isNotNull }) => isNotNull(row.velveUserId),
  });

  if (withAccount !== undefined) {
    throw new Error(
      "An account already exists, so the back office can do the inviting. Use it.",
    );
  }

  const initials = initialsOf(name);

  // issueInvitation writes the member row itself, but it needs a member to
  // attribute the invitation to. The first administrator invites themselves.
  const [placeholder] = await db
    .insert(users)
    .values({ email, name, initials, role: "admin", form, status: "eingeladen" })
    .onConflictDoUpdate({
      target: users.email,
      set: { name, initials, role: "admin", form },
    })
    .returning({ id: users.id });

  const { token } = await issueInvitation({
    invitedBy: {
      id: placeholder.id,
      velveUserId: "",
      email,
      name,
      initials,
      role: "admin",
      form,
      bio: null,
      mustChangePassword: false,
    },
    email,
    name,
    initials,
    role: "admin",
    form,
    hours: 168,
  });

  // The canonical origin by default, but a link into a site that is not
  // deployed yet helps nobody — --base points it at wherever it is running.
  const base = option("base") ?? environment().NEXT_PUBLIC_SITE_URL;
  const link = new URL(invitationPath(token), base).toString();

  console.log(`Administrator angelegt: ${name} <${email}>`);
  console.log(`Der Link gilt sieben Tage und lässt sich einmal verwenden:\n`);
  console.log(link);

  await db.$client.end();
};

main().catch(async (cause: unknown) => {
  console.error(cause instanceof Error ? cause.message : cause);
  await db.$client.end().catch(() => undefined);
  process.exit(1);
});
