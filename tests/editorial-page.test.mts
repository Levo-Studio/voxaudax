import assert from "node:assert/strict";
import { test } from "node:test";

import {
  editorialPageDocument,
  editorialPageFields,
  paragraphsOf,
  splitEditorialPage,
} from "../lib/editorial-page.ts";

const fields = {
  title: "Die Redaktion",
  intro: "Wir entscheiden selbst.\n\nFeste Treffen gibt es nicht.",
  heading: "Mitmachen",
  invitation: "Du willst bei der Vox Audax mitmachen? Wir freuen uns auf dich!",
  note: "Betreuende Lehrkraft: jemand.",
};

test("reads back what it wrote", () => {
  const document = editorialPageDocument(fields);
  assert.deepEqual(editorialPageFields(fields.title, document.content), fields);
});

test("writes the pieces the public pages split it into", () => {
  const { intro, invitation, note } = splitEditorialPage(editorialPageDocument(fields).content);

  assert.equal(intro.length, 2);
  assert.equal(invitation?.heading.type, "heading");
  assert.equal(invitation?.text.content?.[0]?.text, fields.invitation);
  assert.equal(note.length, 1);
});

test("keeps the invitation one paragraph, however it was pasted", () => {
  const document = editorialPageDocument({
    ...fields,
    invitation: "Du willst mitmachen?\nSprich uns an\n\noder schreib uns!",
  });
  const { invitation, note } = splitEditorialPage(document.content);

  assert.equal(invitation?.text.content?.[0]?.text, "Du willst mitmachen? Sprich uns an oder schreib uns!");
  assert.equal(note.length, 1);
});

test("starts a paragraph at a blank line and nowhere else", () => {
  assert.deepEqual(paragraphsOf("eins\nzwei\n \ndrei\r\n\r\nvier"), ["eins zwei", "drei", "vier"]);
  assert.deepEqual(paragraphsOf("  \n\n  "), []);
});

test("reads a page with a line break inside a paragraph", () => {
  const read = editorialPageFields("Die Redaktion", [
    { type: "paragraph", content: [{ type: "text", text: "a" }, { type: "hardBreak" }, { type: "text", text: "b" }] },
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Mitmachen" }] },
    { type: "paragraph", content: [{ type: "text", text: "komm" }] },
  ]);

  assert.equal(read.intro, "a\nb");
  assert.equal(read.invitation, "komm");
  assert.equal(read.note, "");
});
