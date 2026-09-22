import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { documentToMarkdown, markdownToDocument } from "@/lib/markdown";
import { parseDocument, parseDocumentJson } from "@/lib/tiptap";
import { freeSlug, slugify } from "@/lib/slug";
import { readingTimeMinutes } from "@/lib/reading-time";
import { countWords } from "@/lib/word-count";

/**
 * The editor offers two spellings of one document, and the claim that makes
 * that safe is that they are one document. These read that claim back.
 */
describe("Markdown and TipTap are two spellings of one document", () => {
  const source = [
    "Als der Antrag am 3. Juni das vierte Mal auf der Tagesordnung stand, hatte ihn niemand gelesen.",
    "",
    "## Vier Sitzungen bis zur Einigung",
    "",
    "Die Schulleitung wollte eine **Komplettregelung**, die SMV eine Ausnahme für die *Oberstufe*.",
    "",
    "> „Wir haben die Oberstufenregelung aufgegeben.“",
    "",
    "- ab Oktober in der Hausordnung",
    "- Durchsetzung bei den Aufsichten",
    "",
    "![Die Tagesordnung an der Wand](/api/bilder/2f0f3f6e-6f64-4d1a-9a6f-0f2f5c8d4f11)",
    "",
    "[Protokoll der Sitzung](/artikel/smv-protokoll-juni)",
    "",
    "---",
  ].join("\n");

  it("parses every construction the toolbar names", () => {
    const document = markdownToDocument(source);
    const kinds = document.content.map((node) => node.type);

    assert.deepEqual(kinds, [
      "paragraph",
      "heading",
      "paragraph",
      "blockquote",
      "bulletList",
      "image",
      "paragraph",
      "horizontalRule",
    ]);
  });

  it("writes the same Markdown back out", () => {
    const once = markdownToDocument(source);
    const twice = markdownToDocument(documentToMarkdown(once));

    assert.deepEqual(twice, once);
  });

  it("reads an image back as an image and not as an exclamation mark and a link", () => {
    const [node] = markdownToDocument(
      "![Die Tafel nach der Stunde](/api/bilder/7c1d)",
    ).content;

    assert.equal(node?.type, "image");
    assert.equal(node?.attrs?.src, "/api/bilder/7c1d");
    assert.equal(node?.attrs?.alt, "Die Tafel nach der Stunde");
  });

  it("carries an image through the whole round trip, which is what autosave writes", () => {
    const document = {
      type: "doc" as const,
      content: [
        { type: "paragraph", content: [{ type: "text", text: "Davor." }] },
        {
          type: "image",
          attrs: { src: "/api/bilder/7c1d", alt: "Die Tafel nach der Stunde" },
        },
        { type: "paragraph", content: [{ type: "text", text: "Danach." }] },
      ],
    };

    assert.deepEqual(markdownToDocument(documentToMarkdown(document)), document);
  });

  it("keeps a quote's second paragraph a second paragraph", () => {
    const quote = {
      type: "doc" as const,
      content: [
        {
          type: "blockquote",
          content: [
            { type: "paragraph", content: [{ type: "text", text: "Erster Absatz." }] },
            { type: "paragraph", content: [{ type: "text", text: "Zweiter Absatz." }] },
          ],
        },
      ],
    };

    assert.deepEqual(markdownToDocument(documentToMarkdown(quote)), quote);
  });

  it("keeps the marks rather than the characters that wrote them", () => {
    const [, , paragraph] = markdownToDocument(source).content;
    const marks = (paragraph?.content ?? []).flatMap((node) =>
      (node.marks ?? []).map((mark) => mark.type),
    );

    assert.deepEqual(marks, ["bold", "italic"]);
  });
});

describe("what the server accepts into the body column", () => {
  it("drops a node type the toolbar cannot produce", () => {
    const parsed = parseDocument({
      type: "doc",
      content: [{ type: "script", content: [{ type: "text", text: "alert(1)" }] }],
    });

    assert.deepEqual(parsed.content.map((node) => node.type), ["paragraph"]);
  });

  it("drops a javascript: link and keeps the text it wrapped", () => {
    const parsed = parseDocument({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "harmlos",
              marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }],
            },
          ],
        },
      ],
    });

    const [paragraph] = parsed.content;
    assert.equal(paragraph?.content?.[0]?.text, "harmlos");
    assert.deepEqual(paragraph?.content?.[0]?.marks, undefined);
  });

  it("keeps an http link and a same-site path", () => {
    const parsed = parseDocument({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "a", marks: [{ type: "link", attrs: { href: "/artikel/x" } }] },
            {
              type: "text",
              text: "b",
              marks: [{ type: "link", attrs: { href: "https://example.org/y" } }],
            },
          ],
        },
      ],
    });

    const hrefs = (parsed.content[0]?.content ?? []).map((node) => node.marks?.[0]?.attrs?.href);
    assert.deepEqual(hrefs, ["/artikel/x", "https://example.org/y"]);
  });

  it("keeps an image this installation serves itself", () => {
    const parsed = parseDocument({
      type: "doc",
      content: [
        {
          type: "image",
          attrs: {
            src: "/api/bilder/2f0f3f6e-6f64-4d1a-9a6f-0f2f5c8d4f11",
            alt: "Die Tafel nach der Stunde",
          },
        },
      ],
    });

    assert.equal(parsed.content[0]?.type, "image");
    assert.equal(parsed.content[0]?.attrs?.alt, "Die Tafel nach der Stunde");
  });

  it("drops an image pointed at somebody else's host, which would report every reader", () => {
    for (const src of [
      "https://tracker.example/pixel.png",
      "http://tracker.example/pixel.png",
      "//tracker.example/pixel.png",
      "/api/bilder/../../etc/passwd",
      "javascript:alert(1)",
      "",
    ]) {
      const parsed = parseDocument({
        type: "doc",
        content: [{ type: "image", attrs: { src, alt: "" } }],
      });

      assert.deepEqual(parsed.content.map((node) => node.type), ["paragraph"], src);
    }
  });

  it("answers an empty document rather than throwing on rubbish", () => {
    assert.deepEqual(parseDocumentJson("{ not json").content, [
      { type: "paragraph", content: [] },
    ]);
  });

  it("holds a heading to the two levels the toolbar offers", () => {
    const parsed = parseDocument({
      type: "doc",
      content: [{ type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "x" }] }],
    });

    assert.equal(parsed.content[0]?.attrs?.level, 2);
  });
});

describe("slugs", () => {
  it("spells German letters out rather than dropping their marks", () => {
    assert.equal(slugify("Grüße aus dem Büro"), "gruesse-aus-dem-buero");
    assert.equal(slugify("Straße & Weg"), "strasse-weg");
  });

  it("writes the title of screen 3b the way the screen prints it", () => {
    assert.equal(
      slugify("SMV setzt Handykompromiss durch"),
      "smv-setzt-handykompromiss-durch",
    );
  });

  it("steps aside for a slug that is taken, historic ones included", () => {
    const taken = new Set(["sommerfest", "sommerfest-2"]);
    assert.equal(freeSlug("Sommerfest", taken), "sommerfest-3");
  });
});

describe("the figures the editor prints", () => {
  it("reads 1204 words as six minutes, as screen 3b does", () => {
    assert.equal(readingTimeMinutes(1204), 6);
  });

  it("never reads a short text as zero minutes", () => {
    assert.equal(readingTimeMinutes(12), 1);
  });

  it("counts words across nodes and not characters", () => {
    const document = markdownToDocument("## Titel\n\nZwei Wörter hier.\n\n- und eins");
    assert.equal(countWords(document), 6);
  });
});
