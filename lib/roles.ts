import type { userForm, userRole } from "@/lib/db/schema";

export type Role = (typeof userRole.enumValues)[number];
export type Form = (typeof userForm.enumValues)[number];

/**
 * Screen 11c, row for row. Every route and every action asks this table through
 * `may()`; nothing decides a permission by comparing a role inline, so a row
 * changed here changes every place that reads it.
 */
export const CAPABILITIES = [
  "writeOwnArticles",
  "readOthersDrafts",
  "approveArticlesAndMemes",
  "approveSponsors",
  "manageSponsors",
  "resetOthersPassword",
  "manageUsers",
] as const;

export type Capability = (typeof CAPABILITIES)[number];

export const ROLE_MATRIX: Record<Capability, readonly Role[]> = {
  writeOwnArticles: ["autor", "redakteur", "admin"],
  readOthersDrafts: ["redakteur", "admin"],
  approveArticlesAndMemes: ["redakteur", "admin"],
  approveSponsors: ["redakteur", "admin"],
  manageSponsors: ["redakteur", "admin"],
  resetOthersPassword: ["admin"],
  manageUsers: ["admin"],
};

export const may = (role: Role, capability: Capability) =>
  ROLE_MATRIX[capability].includes(role);

/**
 * The last row of 11c. An admin is told about every submission; everyone else
 * only about their own, which is why this answers a scope rather than a boolean.
 */
export const approvalMailScope = (role: Role): "own" | "always" =>
  role === "admin" ? "always" : "own";

export const ROLE_NAMES: Record<Role, string> = {
  autor: "Autor",
  redakteur: "Redakteur",
  admin: "Admin",
};

/**
 * Screen 8a: the "Bezeichnung" the invitation carries decides the word that
 * appears on the editorial page, in the imprint and in approval mail. The role
 * is the permission; this is only its name.
 */
const ROLE_LABELS: Record<Role, Record<Form, string>> = {
  autor: {
    weiblich: "Autorin",
    maennlich: "Autor",
    neutral: "Redaktionsmitglied",
  },
  redakteur: {
    weiblich: "Redakteurin",
    maennlich: "Redakteur",
    neutral: "Redaktion",
  },
  admin: {
    weiblich: "Chefredakteurin",
    maennlich: "Chefredakteur",
    neutral: "Chefredaktion",
  },
};

export const roleLabel = (role: Role, form: Form) => ROLE_LABELS[role][form];

export const ROLE_HINTS: Record<Role, string> = {
  autor:
    "Schreibt eigene Artikel und reicht sie zur Freigabe ein. Fremde Entwürfe bleiben unsichtbar.",
  redakteur:
    "Gibt Artikel, Memes und Sponsoren frei und verwaltet Sponsoren-Laufzeiten. Keine Nutzerverwaltung.",
  admin:
    "Darf alles: freigeben, Nutzer verwalten, Rollen vergeben und Passwörter zurücksetzen.",
};

export const FORM_LABELS: Record<Form, string> = {
  weiblich: "Weiblich",
  maennlich: "Männlich",
  neutral: "Neutral",
};

/**
 * The masthead title, which is deliberately not the label the back office uses.
 * Screen 9a prints "Redakteur" over three people the role table calls `autor`:
 * inside the application that distinction decides who may publish, in the paper
 * it would only demote a member of the editorial team in public. `roleLabel`
 * above is the other audience — screen 8a's tally counts "3 Autor" and has to
 * say so.
 */
const MASTHEAD_TITLES: Record<Role, Record<Form, string>> = {
  admin: {
    weiblich: "Chefredakteurin",
    maennlich: "Chefredakteur",
    neutral: "Chefredaktion",
  },
  redakteur: {
    weiblich: "Redakteurin",
    maennlich: "Redakteur",
    neutral: "Redaktion",
  },
  autor: {
    weiblich: "Redakteurin",
    maennlich: "Redakteur",
    neutral: "Redaktion",
  },
};

export const roleTitle = (role: Role, form: Form) =>
  MASTHEAD_TITLES[role][form];
