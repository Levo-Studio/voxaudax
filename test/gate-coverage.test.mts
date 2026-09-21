import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import { describe, it } from "node:test";

import { approvalMailScope, CAPABILITIES, may, roleLabel } from "@/lib/roles";

/**
 * A rule enforced in one place is only enforced in one place while nothing has
 * quietly grown a second way in. This walks the route tree and holds every page
 * and every action against the gate, so a screen added later fails the build
 * rather than the review.
 */

const ADMIN = join(process.cwd(), "app", "admin");

const GATE = /requireMember|requireCapability/;

/**
 * The five that are reached without a session, by name, because every one of
 * them is a decision and not an oversight:
 *
 *  - the login itself,
 *  - the page behind an invitation link and its action, where the account does
 *    not exist yet,
 *  - "Passwort vergessen" and the page the mailed link leads to.
 *
 * Each is answered identically whether or not the address or the token names
 * anything, which is the property that replaces a session here.
 */
const WITHOUT_A_SESSION = new Set([
  "page.tsx",
  "login-form.tsx",
  "sign-in.ts",
  "sign-in-state.ts",
  "actions.ts",
  "einladung/[token]/page.tsx",
  "einladung/[token]/accept-form.tsx",
  "einladung/[token]/actions.ts",
  "passwort-vergessen/page.tsx",
  "passwort-vergessen/request-form.tsx",
  "passwort-vergessen/actions.ts",
  "passwort/[token]/page.tsx",
  "passwort/[token]/set-form.tsx",
  "passwort/[token]/actions.ts",
]);

const walk = async (directory: string): Promise<string[]> => {
  const entries = await readdir(directory, { withFileTypes: true });
  const found: string[] = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) found.push(...(await walk(path)));
    else found.push(path);
  }

  return found;
};

describe("every route in the back office goes through the gate", () => {
  it("has a page or an action that asks for a member, or is on the list that does not", async () => {
    const files = await walk(ADMIN);
    const unguarded: string[] = [];

    for (const file of files) {
      const name = relative(ADMIN, file);
      if (WITHOUT_A_SESSION.has(name)) continue;

      const source = readFileSync(file, "utf8");

      // A client component holds no authority and carries none: it is a view
      // over what a server module already decided, and every action it calls is
      // in a "use server" file that asks for its own member.
      if (source.startsWith('"use client"')) continue;

      if (!GATE.test(source)) unguarded.push(name);
    }

    assert.deepEqual(unguarded, []);
  });

  it("guards every server action file, not only the pages", async () => {
    const files = await walk(ADMIN);
    const unguarded: string[] = [];

    for (const file of files) {
      const name = relative(ADMIN, file);
      if (WITHOUT_A_SESSION.has(name)) continue;

      const source = readFileSync(file, "utf8");
      if (!source.startsWith('"use server"')) continue;
      if (!GATE.test(source)) unguarded.push(name);
    }

    assert.deepEqual(unguarded, []);
  });

  it("names no role inline where a capability belongs", async () => {
    const files = await walk(ADMIN);
    const comparing: string[] = [];

    for (const file of files) {
      const source = readFileSync(file, "utf8");
      // A comparison against a role literal is the shape this whole module
      // exists to stop: the matrix decides, and `may()` is how it is asked.
      if (/role\s*===\s*"(autor|redakteur|admin)"/.test(source)) {
        comparing.push(relative(ADMIN, file));
      }
    }

    assert.deepEqual(comparing, []);
  });
});

describe("the role matrix answers screen 11c row for row", () => {
  it("lets every role write and submit their own articles", () => {
    for (const role of ["autor", "redakteur", "admin"] as const) {
      assert.equal(may(role, "writeOwnArticles"), true, role);
    }
  });

  it("keeps other people's drafts from an autor and shows them to the other two", () => {
    assert.equal(may("autor", "readOthersDrafts"), false);
    assert.equal(may("redakteur", "readOthersDrafts"), true);
    assert.equal(may("admin", "readOthersDrafts"), true);
  });

  it("gives approval to redakteur and admin and to nobody else", () => {
    for (const capability of ["approveArticlesAndMemes", "approveSponsors", "manageSponsors"] as const) {
      assert.equal(may("autor", capability), false, capability);
      assert.equal(may("redakteur", capability), true, capability);
      assert.equal(may("admin", capability), true, capability);
    }
  });

  it("keeps the two admin-only rows admin-only", () => {
    for (const capability of ["resetOthersPassword", "manageUsers"] as const) {
      assert.equal(may("autor", capability), false, capability);
      assert.equal(may("redakteur", capability), false, capability);
      assert.equal(may("admin", capability), true, capability);
    }
  });

  it("sends approval mail to an admin always and to everyone else about their own", () => {
    assert.equal(approvalMailScope("autor"), "own");
    assert.equal(approvalMailScope("redakteur"), "own");
    assert.equal(approvalMailScope("admin"), "always");
  });

  it("covers the seven rows the screen draws and no more", () => {
    assert.equal(CAPABILITIES.length, 7);
  });

  it("names a role the way screen 8a's Bezeichnung does", () => {
    assert.equal(roleLabel("admin", "weiblich"), "Chefredakteurin");
    assert.equal(roleLabel("admin", "maennlich"), "Chefredakteur");
    assert.equal(roleLabel("admin", "neutral"), "Chefredaktion");
    assert.equal(roleLabel("autor", "weiblich"), "Autorin");
    assert.equal(roleLabel("autor", "neutral"), "Redaktionsmitglied");
    assert.equal(roleLabel("redakteur", "weiblich"), "Redakteurin");
    assert.equal(roleLabel("redakteur", "neutral"), "Redaktion");
  });
});
