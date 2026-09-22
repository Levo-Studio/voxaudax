import assert from "node:assert/strict";
import { test } from "node:test";

import { deliverAuthMail } from "@/lib/auth-delivery";

/**
 * The two branches that send nothing. Both used to throw a sentence blaming a
 * missing `RESEND_API_KEY`, which was wrong in both directions: the code never
 * read the key, so the message was false with one set and misleading without.
 *
 * Neither case here reaches the sender, so neither needs a key — which is the
 * point of the import inside the sending branch.
 */

test("a request for an address with no account sends nothing and does not throw", async () => {
  await deliverAuthMail({
    kind: "request_for_unknown_address",
    to: "niemand@voxaudax.test",
    requested: "password_reset",
  });
});

test("a kind with no template says which one, and says nothing about the key", async () => {
  const failure = await deliverAuthMail({
    kind: "magic_link",
    to: "niemand@voxaudax.test",
    userId: "u",
    token: "t",
    expiresAt: new Date(),
  }).then(
    () => undefined,
    (error: unknown) => error as Error,
  );

  assert.ok(failure !== undefined, "it must refuse rather than pretend to send");
  assert.match(failure.message, /magic_link/);
  assert.doesNotMatch(failure.message, /RESEND_API_KEY|MAIL_FROM/);
});
