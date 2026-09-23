import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { leavesTheSite, outward } from "../lib/outward.ts";

/**
 * Every address this application writes for itself is a path, so an absolute
 * http address is by definition somewhere else. These pin that down, because
 * the day somebody writes an absolute self-link the rule quietly starts
 * opening the newspaper in a second tab.
 */

describe("a link that leaves the newspaper", () => {
  it("is any absolute http address", () => {
    for (const href of [
      "https://levo-studio.com",
      "http://example.org/x",
      "HTTPS://EXAMPLE.ORG",
      "  https://example.org  ",
    ]) {
      assert.equal(leavesTheSite(href), true, href);
    }
  });

  it("is never a path, an anchor or a query of our own", () => {
    for (const href of ["/archiv", "/artikel/x", "#weiter", "?suche=abc", ""]) {
      assert.equal(leavesTheSite(href), false, href);
    }
  });

  it("leaves mailto and tel alone, because a tab for them stays empty", () => {
    for (const href of ["mailto:redaktion@voxaudax.de", "tel:+4970711234"]) {
      assert.equal(leavesTheSite(href), false, href);
      assert.deepEqual(outward(href), {});
    }
  });

  it("carries noopener, so the opened page cannot navigate the one it came from", () => {
    const attributes = outward("https://example.org");
    assert.equal(attributes.target, "_blank");
    assert.match(attributes.rel ?? "", /noopener/);
    assert.match(attributes.rel ?? "", /noreferrer/);
  });

  it("adds nothing at all to an address of our own", () => {
    assert.deepEqual(outward("/archiv"), {});
  });
});
