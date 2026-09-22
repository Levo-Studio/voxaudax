import { db } from "../lib/db/client.ts";
import { users } from "../lib/db/schema.ts";
import { invitationPath, issueInvitation } from "../lib/editorial/invitations.ts";
const email = "probe.pruefer@probe.invalid";
const [row] = await db.insert(users)
  .values({ email, name: "Probe Admin", initials: "PA", role: "admin", form: "neutral", status: "eingeladen" })
  .onConflictDoUpdate({ target: users.email, set: { role: "admin", status: "eingeladen" } })
  .returning({ id: users.id });
const { token } = await issueInvitation({
  invitedBy: { id: row.id, velveUserId: "", email, name: "Probe Admin", initials: "PA", role: "admin", form: "neutral", bio: null, mustChangePassword: false },
  email, name: "Probe Admin", initials: "PA", role: "admin", form: "neutral", hours: 24,
});
console.log(`http://localhost:7896${invitationPath(token)}`);
await db.$client.end();
