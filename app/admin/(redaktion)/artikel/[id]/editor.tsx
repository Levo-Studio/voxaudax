"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";

import { ArticleBody } from "@/components/article-body";
import { ArticleCover } from "@/components/article-cover";
import { BlockEditor } from "@/components/admin/block-editor";
import { Avatar, FIELD_CLASS, LABEL_CLASS, PANEL_CLASS, PRIMARY_BUTTON_CLASS, QUIET_BUTTON_CLASS } from "@/components/admin/controls";
import { Segmented } from "@/components/admin/segmented";
import {
  autosaveAction,
  clearCoverImageAction,
  renameSlugAction,
  setCoverAltAction,
  submitAction,
  uploadCoverAction,
} from "@/app/admin/(redaktion)/artikel/[id]/actions";
import type { ArticleCover as CoverValue, TipTapDocument } from "@/lib/content";
import { COVER_COLORS, coverColorById, type CoverColorId } from "@/lib/cover";
import { blocksToDocument, documentToBlocks, htmlToInline, type Block } from "@/lib/editor-blocks";
import { documentToMarkdown, markdownToDocument } from "@/lib/markdown";
import { formatWordCount, readingTimeMinutes } from "@/lib/reading-time";
import { countWords } from "@/lib/word-count";

type Category = { readonly id: string; readonly name: string };

export type EditorArticle = {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly teaser: string;
  readonly body: TipTapDocument;
  readonly cover: CoverValue;
  readonly categoryId: string;
  readonly status: "draft" | "review" | "published";
  readonly publishAt: string | null;
  readonly authorName: string;
  readonly authorInitials: string;
};

const STATUS_LABELS = { draft: "Entwurf", review: "Review", published: "Veröffentlicht" } as const;

const TAB_CLASS = (active: boolean) =>
  `cursor-pointer border-none bg-transparent px-1 pt-3 pb-[11px] font-control text-xs font-bold tracking-[0.02em] transition-[color,box-shadow] duration-200 ease-out ${
    active ? "text-tx shadow-[inset_0_-2px_0_var(--ac)]" : "text-tm hover:text-tx"
  }`;

const AUTOSAVE_DELAY_MS = 1200;

const CLOCK = new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit" });

/**
 * Screen 3b on the desktop and 4b on 375 px — the same editor, with the right
 * column becoming a strip of tabs under the text.
 *
 * The body never becomes an HTML string: the blocks are turned into TipTap JSON
 * here, the server parses that JSON down to the node types the toolbar can
 * produce, and the row holds the result. The Markdown mode writes into the same
 * document, so switching modes is a change of spelling and not of storage.
 */
export function Editor({
  article,
  categories,
  coverImageAlt,
  hasCoverImage,
  canPublish,
}: {
  article: EditorArticle;
  categories: readonly Category[];
  coverImageAlt: string;
  hasCoverImage: boolean;
  canPublish: boolean;
}) {
  const [title, setTitle] = useState(article.title);
  const [teaser, setTeaser] = useState(article.teaser);
  const [blocks, setBlocks] = useState<readonly Block[]>(() => documentToBlocks(article.body));
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [cover, setCover] = useState({
    word: article.cover.word,
    line: article.cover.line,
    colorId: article.cover.colorId as CoverColorId,
  });
  const [categoryId, setCategoryId] = useState(article.categoryId);
  const [publishAt, setPublishAt] = useState(article.publishAt ?? "");
  const [slug, setSlug] = useState(article.slug);
  const [tab, setTab] = useState<"cover" | "meta" | "publish">("cover");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [status, setStatus] = useState(article.status);
  const [alt, setAlt] = useState(coverImageAlt);
  const [coverImage, setCoverImage] = useState(hasCoverImage);
  const [uploadProblem, setUploadProblem] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const document_: TipTapDocument = useMemo(
    () =>
      markdown === null
        ? blocksToDocument(blocks, htmlToInline)
        : markdownToDocument(markdown),
    [blocks, markdown],
  );

  const wordCount = countWords(document_);
  const dirty = useRef(false);

  useEffect(() => {
    if (!dirty.current) return;

    const handle = window.setTimeout(() => {
      startTransition(async () => {
        const answer = await autosaveAction(article.id, {
          title,
          teaser,
          body: JSON.stringify(document_),
          coverWord: cover.word,
          coverLine: cover.line,
          colorId: cover.colorId,
          categoryId,
          publishAt,
        });
        if (answer.savedAt !== null) setSavedAt(new Date(answer.savedAt));
      });
    }, AUTOSAVE_DELAY_MS);

    return () => window.clearTimeout(handle);
  }, [article.id, title, teaser, document_, cover, categoryId, publishAt]);

  const touch = <T,>(set: (value: T) => void) => (value: T) => {
    dirty.current = true;
    set(value);
  };

  const toMarkdown = () => setMarkdown(documentToMarkdown(blocksToDocument(blocks, htmlToInline)));

  const toRichText = () => {
    if (markdown !== null) setBlocks(documentToBlocks(markdownToDocument(markdown)));
    setMarkdown(null);
  };

  const rename = () => {
    const wanted = window.prompt("Neuer Slug", slug);
    if (wanted === null || wanted.trim().length === 0) return;
    startTransition(async () => {
      const answer = await renameSlugAction(article.id, wanted.trim());
      if (answer.slug !== null) setSlug(answer.slug);
    });
  };

  const submit = () =>
    startTransition(async () => {
      const answer = await submitAction(article.id);
      if (answer.submitted) setStatus("review");
    });

  const upload = (file: File) => {
    setUploadProblem(null);
    const form = new FormData();
    form.set("image", file);
    startTransition(async () => {
      const answer = await uploadCoverAction(article.id, form);
      if (answer.ok) {
        setCoverImage(true);
        setAlt("");
      } else {
        setUploadProblem(answer.problem);
      }
    });
  };

  const colour = coverColorById(cover.colorId);
  const savedLabel = savedAt === null ? "Autosave aktiv" : `Autosave · ${CLOCK.format(savedAt)}`;

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[1fr_340px]">
      <div className={PANEL_CLASS}>
        <div className="flex flex-wrap items-center gap-3 border-b border-bd px-4 py-3 text-[12.5px] font-semibold md:px-[30px]">
          <Link href="/admin/artikel" className="text-tm no-underline transition-colors duration-200 ease-out hover:text-tx">
            ← Artikel
          </Link>
          <span className="text-tm">{savedLabel}</span>
          <span className="rounded-full border border-bd bg-s2 px-2.5 py-[5px] text-tm">
            {STATUS_LABELS[status]}
          </span>
          <div className="ml-auto flex gap-2">
            <Link
              href={`/admin/artikel/${article.id}/vorschau`}
              className="rounded-lg border border-bd px-3.5 py-2 text-[12.5px] font-bold text-tx no-underline transition-colors duration-200 ease-out hover:border-ac"
            >
              Vorschau
            </Link>
            <button
              type="button"
              onClick={submit}
              disabled={status !== "draft"}
              className={`${PRIMARY_BUTTON_CLASS} py-2 text-[12.5px]`}
            >
              Zur Freigabe
            </button>
          </div>
        </div>

        <div className="px-4 pt-6 md:px-[30px]">
          <div className={LABEL_CLASS}>Titel</div>
          <input
            value={title}
            onChange={(event) => touch(setTitle)(event.target.value)}
            aria-label="Titel"
            className="mt-2 w-full border-none bg-transparent p-0 text-[25px] leading-[1.08] font-extrabold tracking-[-0.04em] text-tx outline-none md:text-[34px]"
          />
          <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[12.5px] font-semibold text-tm">
            <span>Slug</span>
            <code className="rounded-md border border-bd bg-s2 px-2 py-1 font-mono text-xs">{slug}</code>
            <button
              type="button"
              onClick={rename}
              className="cursor-pointer border-none bg-transparent p-0 font-control text-[12.5px] font-semibold text-ac"
            >
              bearbeiten
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2.5 border-y border-bd px-4 py-2.5 md:px-[30px]">
          <div className="min-w-[190px]">
            <Segmented
              name="editor-mode"
              value={markdown === null ? "rich" : "md"}
              options={[
                { value: "rich", label: "Rich Text" },
                { value: "md", label: "Markdown" },
              ]}
              onChange={(value) => (value === "rich" ? toRichText() : toMarkdown())}
            />
          </div>
          {markdown === null ? null : (
            <div className="flex flex-wrap items-center gap-3.5 font-mono text-[11.5px] text-tm">
              <span>## H2</span>
              <span>**fett**</span>
              <span>*kursiv*</span>
              <span>[link](url)</span>
              <span>&gt; Zitat</span>
              <span>- Liste</span>
              <span>---</span>
            </div>
          )}
          <span className="ml-auto text-[11.5px] font-semibold text-tm">Speicherung als TipTap-JSON</span>
        </div>

        {markdown === null ? (
          <div className="px-4 pt-6 pb-9 md:px-[30px]">
            <BlockEditor blocks={blocks} onChange={touch(setBlocks)} />
            <div className="mt-[22px] text-[12.5px] font-semibold text-tm">
              {formatWordCount(wordCount)} Wörter · {readingTimeMinutes(wordCount)} Min Lesezeit
            </div>
          </div>
        ) : (
          <div className="grid gap-px bg-bd md:grid-cols-2">
            <textarea
              value={markdown}
              onChange={(event) => touch(setMarkdown)(event.target.value)}
              aria-label="Markdown"
              rows={20}
              className="m-0 resize-y bg-s1 px-[26px] py-6 font-mono text-[13px] leading-[1.75] text-tx outline-none"
            />
            <div className="bg-s1 px-[26px] py-6">
              <div className={LABEL_CLASS}>Vorschau im echten Layout</div>
              <div className="mt-3.5">
                <ArticleBody document={document_} />
              </div>
            </div>
          </div>
        )}
      </div>

      <aside className={PANEL_CLASS}>
        <div role="tablist" aria-label="Artikel-Einstellungen" className="grid grid-cols-3 border-b border-bd px-4">
          <button type="button" role="tab" aria-selected={tab === "cover"} onClick={() => setTab("cover")} className={TAB_CLASS(tab === "cover")}>
            Cover
          </button>
          <button type="button" role="tab" aria-selected={tab === "meta"} onClick={() => setTab("meta")} className={TAB_CLASS(tab === "meta")}>
            Details
          </button>
          <button type="button" role="tab" aria-selected={tab === "publish"} onClick={() => setTab("publish")} className={TAB_CLASS(tab === "publish")}>
            Veröffentlichen
          </button>
        </div>

        {tab === "cover" ? (
          <div className="va-in">
            <div className="border-b border-bd px-[18px] pt-[18px] pb-4">
              <div className="flex items-baseline justify-between">
                <span className={LABEL_CLASS}>Vorschau</span>
                <span className="text-[11.5px] font-semibold text-tm">
                  {coverImage ? "eigenes Bild" : `generiert · ${colour.name}`}
                </span>
              </div>
              <div className="mt-3 overflow-hidden rounded-[10px]">
                <ArticleCover
                  title={title}
                  colorId={cover.colorId}
                  eyebrow="Titelthema"
                  word={cover.word}
                  line={cover.line}
                  variant="card"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 border-b border-bd px-[18px] py-4">
              <div>
                <label className={`${LABEL_CLASS} mb-1.5`} htmlFor="cover-word">Cover-Wort</label>
                <input id="cover-word" value={cover.word} onChange={(event) => touch(setCover)({ ...cover, word: event.target.value })} className={FIELD_CLASS} />
              </div>
              <div>
                <label className={`${LABEL_CLASS} mb-1.5`} htmlFor="cover-line">Cover-Zeile</label>
                <input id="cover-line" value={cover.line} onChange={(event) => touch(setCover)({ ...cover, line: event.target.value })} className={FIELD_CLASS} />
              </div>
            </div>

            <div className="border-b border-bd px-[18px] py-4">
              <span className={LABEL_CLASS}>Farbe · Vorschlag aus Titel-Hash</span>
              <div className="mt-2 flex flex-wrap gap-[7px]">
                {COVER_COLORS.map((swatch) => (
                  <button
                    key={swatch.id}
                    type="button"
                    aria-label={swatch.name}
                    title={swatch.name}
                    aria-pressed={swatch.id === cover.colorId}
                    onClick={() => touch(setCover)({ ...cover, colorId: swatch.id })}
                    style={{ background: swatch.value }}
                    className={`h-[26px] w-[26px] cursor-pointer rounded-[7px] transition-[border-color] duration-200 ease-out ${
                      swatch.id === cover.colorId ? "border-2 border-tx" : "border border-bd"
                    }`}
                  />
                ))}
              </div>
              <p className="mt-2 text-[11.5px] font-semibold text-tm">
                {colour.name} · Vorschlag kommt aus dem Titel-Hash, eigene Farbwerte sind nicht
                möglich.
              </p>
            </div>

            <div
              className="px-[18px] pt-4 pb-[18px]"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const file = event.dataTransfer.files[0];
                if (file !== undefined) upload(file);
              }}
            >
              <label className="block cursor-pointer rounded-[10px] border-[1.5px] border-dashed border-bd p-3.5 text-center text-[12.5px] font-semibold text-tm">
                Eigenes Bild hierher ziehen
                <span className="mt-1 block text-[11.5px] font-medium">
                  JPG, PNG, WebP · max 8 MB · ersetzt das Cover
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file !== undefined) upload(file);
                  }}
                />
              </label>

              {uploadProblem === null ? null : (
                <p role="alert" className="mt-2 text-[11.5px] font-semibold text-ac2">{uploadProblem}</p>
              )}

              {coverImage ? (
                <>
                  <label className={`${LABEL_CLASS} mt-3 mb-1.5 text-ac2`} htmlFor="cover-alt">
                    Alt-Text · Pflichtfeld bei eigenem Bild
                  </label>
                  <input
                    id="cover-alt"
                    value={alt}
                    onChange={(event) => setAlt(event.target.value)}
                    onBlur={() => startTransition(async () => {
                      await setCoverAltAction(article.id, alt);
                    })}
                    className={alt.trim().length === 0 ? `${FIELD_CLASS} border-ac2` : FIELD_CLASS}
                  />
                  <button
                    type="button"
                    onClick={() => startTransition(async () => {
                      await clearCoverImageAction(article.id);
                      setCoverImage(false);
                    })}
                    className={`${QUIET_BUTTON_CLASS} mt-2 w-full py-2 text-[12.5px]`}
                  >
                    Bild entfernen, Cover wieder generieren
                  </button>
                </>
              ) : (
                <p className="mt-3 text-[11.5px] font-bold text-tm">
                  Alt-Text · Pflichtfeld bei eigenem Bild
                </p>
              )}
            </div>
          </div>
        ) : null}

        {tab === "meta" ? (
          <div className="va-in">
            <div className="border-b border-bd px-[18px] py-4">
              <div className={LABEL_CLASS}>Kategorie</div>
              <div className="mt-2 flex flex-wrap gap-1.5 text-xs font-bold">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    aria-pressed={category.id === categoryId}
                    onClick={() => touch(setCategoryId)(category.id)}
                    className={`cursor-pointer rounded-full px-[11px] py-1.5 font-control transition-colors duration-200 ease-out ${
                      category.id === categoryId ? "border-none bg-ac text-s1" : "border border-bd bg-transparent text-tm hover:text-tx"
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-b border-bd px-[18px] py-4">
              <div className={LABEL_CLASS}>Autor</div>
              <div className="mt-2 flex items-center gap-[9px] text-[13.5px] font-semibold">
                <Avatar initials={article.authorInitials} />
                {article.authorName}
              </div>
            </div>

            <div className="border-b border-bd px-[18px] py-4">
              <label className={`${LABEL_CLASS} mb-1.5`} htmlFor="teaser">Teaser · 1–2 Sätze</label>
              <textarea
                id="teaser"
                rows={3}
                value={teaser}
                onChange={(event) => touch(setTeaser)(event.target.value)}
                className={FIELD_CLASS}
              />
            </div>

            <div className="px-[18px] pt-4 pb-[18px]">
              <div className={LABEL_CLASS}>Umfang</div>
              <div className="mt-2 flex gap-[18px] text-[13px] font-semibold">
                <span>{formatWordCount(wordCount)} Wörter</span>
                <span className="text-tm">{readingTimeMinutes(wordCount)} Min Lesezeit</span>
              </div>
            </div>
          </div>
        ) : null}

        {tab === "publish" ? (
          <div className="va-in">
            <div className="border-b border-bd px-[18px] py-4">
              <div className={LABEL_CLASS}>Status</div>
              <div className="mt-2.5 flex flex-col gap-[9px] text-[13px] font-semibold">
                {(["draft", "review", "published"] as const).map((candidate) => (
                  <span key={candidate} className={`flex justify-between ${status === candidate ? "" : "text-tm"}`}>
                    <span>{STATUS_LABELS[candidate]}</span>
                    <span className={status === candidate ? "text-ac" : ""}>
                      {status === candidate ? "aktuell" : candidate === "review" ? "offen" : "—"}
                    </span>
                  </span>
                ))}
              </div>
            </div>

            <div className="border-b border-bd px-[18px] py-4">
              <label className={`${LABEL_CLASS} mb-1.5`} htmlFor="publish-at">Termin</label>
              <input
                id="publish-at"
                type="datetime-local"
                value={publishAt}
                onChange={(event) => touch(setPublishAt)(event.target.value)}
                className={FIELD_CLASS}
              />
              <p className="mt-1.5 text-[11.5px] font-medium text-tm">
                Erscheint automatisch — ab diesem Zeitpunkt ist der freigegebene Artikel öffentlich.
              </p>
            </div>

            <div className="border-b border-bd px-[18px] py-4">
              <span className={LABEL_CLASS}>Slug</span>
              <code className="mt-1.5 block font-mono text-xs">{slug}</code>
              <p className="mt-1.5 text-[11.5px] font-medium text-tm">
                Bleibt nach Veröffentlichung stabil, alte Slugs leiten weiter.
              </p>
            </div>

            <div className="flex flex-col gap-2 px-[18px] pt-4 pb-[18px]">
              <button type="button" onClick={submit} disabled={status !== "draft"} className={PRIMARY_BUTTON_CLASS}>
                Zur Freigabe einreichen
              </button>
              <Link
                href={`/admin/artikel/${article.id}/vorschau`}
                className={`${QUIET_BUTTON_CLASS} text-center no-underline`}
              >
                Vorschau im echten Layout
              </Link>
              {canPublish ? null : (
                <p className="text-[11.5px] font-medium text-tm">
                  Als Autor kannst du einreichen, aber nicht selbst veröffentlichen.
                </p>
              )}
            </div>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
