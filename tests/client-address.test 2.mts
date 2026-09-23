import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { clientAddress, parseTrustedProxies } from "../lib/client-address.ts";

/**
 * The header used to be handed over exactly as it arrived, which meant a list
 * was counted as one address and anybody could write themselves a fresh bucket.
 * These pin the rule the library states (S-RATE-3) so the two cannot drift.
 */

const DOCKER = parseTrustedProxies("172.16.0.0/12");

describe("who the rate limiter counts", () => {
  it("believes nothing when no proxy is named", () => {
    assert.equal(clientAddress("1.2.3.4", []), null);
    assert.equal(clientAddress("1.2.3.4", parseTrustedProxies("")), null);
  });

  it("takes the caller behind a proxy that is named", () => {
    assert.equal(clientAddress("1.2.3.4, 172.18.0.2", DOCKER), "1.2.3.4");
  });

  it("takes the rightmost address nobody trusted vouched for", () => {
    // The leftmost is whatever the client chose to write; the rightmost that
    // is not a trusted proxy is the last hop actually observed.
    assert.equal(
      clientAddress("9.9.9.9, 1.2.3.4, 172.18.0.2", DOCKER),
      "1.2.3.4",
      "a prepended address must not be able to pick its own bucket",
    );
  });

  it("answers nothing when every hop was a proxy", () => {
    assert.equal(clientAddress("172.18.0.9, 172.18.0.2", DOCKER), null);
  });

  it("answers nothing when the header is absent", () => {
    assert.equal(clientAddress(null, DOCKER), null);
  });

  it("matches an address outside the range as the caller", () => {
    assert.equal(clientAddress("203.0.113.7", DOCKER), "203.0.113.7");
  });

  it("trusts nothing through a range that does not parse", () => {
    for (const broken of ["10.0.0.0/", "10.0.0.0/33", "not-a-range", "10.0.0.0/-1"]) {
      assert.equal(
        clientAddress("1.2.3.4, 10.0.0.9", parseTrustedProxies(broken)),
        "10.0.0.9",
        `${broken} must match nothing, so the rightmost hop stands`,
      );
    }
  });

  it("reads a list of several proxies, spaces and all", () => {
    const list = parseTrustedProxies(" 10.0.0.0/8 , 172.16.0.0/12 ,, 192.168.1.5 ");
    assert.deepEqual(list, ["10.0.0.0/8", "172.16.0.0/12", "192.168.1.5"]);
    assert.equal(clientAddress("1.2.3.4, 192.168.1.5, 10.1.2.3", list), "1.2.3.4");
  });

  it("names an exact address, which is how an IPv6 proxy is covered", () => {
    const list = parseTrustedProxies("::1");
    assert.equal(clientAddress("1.2.3.4, ::1", list), "1.2.3.4");
  });

  it("refuses an octet above 255 rather than reading it as a range", () => {
    assert.equal(clientAddress("1.2.3.4, 10.0.0.300", parseTrustedProxies("10.0.0.0/8")), "10.0.0.300");
  });
});
