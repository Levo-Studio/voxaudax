import assert from "node:assert/strict";
import type { TipTapDocument } from "@/lib/content";
import { describe, it } from "node:test";

import { documentToBlocks, emptyBlock } from "@/lib/editor-blocks";

/**
 * The editor finds a line by its id to put the caret in it. Two lines sharing
 * one id sent the caret to whichever came first in the document — the headline
 * — so this is the rule that broke, and it is cheap to keep.
 */
describe("every block carries an id of its own", () => {
  it("never repeats one across a parsed document and the blocks added after it", () => {
    const document: TipTapDocument = {
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Titel" }] },
        { type: "paragraph", content: [{ type: "text", text: "Ein Absatz" }] },
        { type: "blockquote", content: [{ type: "paragraph", content: [{ type: "text", text: "Zitat" }] }] },
      ],
    };

    const ids = [
      ...documentToBlocks(document).map((block) => block.id),
      ...Array.from({ length: 20 }, () => emptyBlock().id),
    ];

    assert.equal(new Set(ids).size, ids.length, "two blocks share an id");
  });

  it("does not repeat between two parses of the same document", () => {
    const document: TipTapDocument = { type: "doc", content: [{ type: "paragraph", content: [] }] };
    const first = documentToBlocks(document).map((block) => block.id);
    const second = documentToBlocks(document).map((block) => block.id);

    assert.deepEqual(first.filter((id) => second.includes(id)), []);
  });
});
