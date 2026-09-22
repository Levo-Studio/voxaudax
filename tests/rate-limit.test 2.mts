import assert from "node:assert/strict";
import { mock, test } from "node:test";

import { rateLimiter } from "../lib/rate-limit.ts";

const MINUTE = 60 * 1_000;

test("lets three through, then holds the address until one comes back", () => {
  mock.timers.enable({ apis: ["Date"], now: 0 });

  try {
    const allow = rateLimiter({ capacity: 3, refillMs: 10 * MINUTE });

    assert.equal(allow("a@example.org").allowed, true);
    assert.equal(allow("a@example.org").allowed, true);
    assert.equal(allow("a@example.org").allowed, true);

    const refused = allow("a@example.org");
    assert.equal(refused.allowed, false);
    assert.equal(refused.allowed === false && refused.retryAfterSeconds, 600);

    // Another address has its own bucket.
    assert.equal(allow("b@example.org").allowed, true);

    mock.timers.tick(10 * MINUTE);
    assert.equal(allow("a@example.org").allowed, true);
    assert.equal(allow("a@example.org").allowed, false);
  } finally {
    mock.timers.reset();
  }
});
