"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { ArticleBody } from "@/components/article-body";
import { ArticleCover } from "@/components/article-cover";
import { BlockEditor } from "@/components/admin/block-editor";
import { toast } from "@/components/admin/toast";
import { RejectionNote } from "@/components/admin/rejection-note";
import {
  Avatar,
  FIELD_CLASS,
  LABEL_CLASS,
  PANEL_CLASS,
  PANEL_HEADING_CLASS,
  PRIMARY_BUTTON_CLASS,
  QUIET_BUTTON_CLASS,
} from "@/components/admin/controls";
import { Segmented } from "@/components/admin/segmented";
import {
  autosaveAction,
  createCategoryAction,
  checkSlugAction,
  renameSlugAction,
  submitAction,
  uploadBodyImageAction,
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
  readonly rejectionReason: string | null;
  readonly title: string;
  readonly teaser: string;
  readonly body: TipTapDocument;
  readonly cover: CoverValue;
  readonly categoryId: string;
  readonly status: "draft" | "review" | "published";
  readonly publishAt: string | null;
  /** The stand every write from this screen is pinned to. */
  readonly updatedAt: string;
  readonly authorName: string;
  readonly authorInitials: string;
};

const STATUS_LABELS = { draft: "Entwurf", review: "Review", published: "Veröffentlicht" } as const;

const TAB_CLASS = (active: boolean) =>
  `inline-flex min-h-11 cursor-pointer items-center border-none bg-transparent px-1 font-control text-xs font-bold tracking-[0.02em] transition-[color,box-shadow] duration-200 ease-out md:min-h-0 md:pt-3 md:pb-[11px] ${
    active ? "text-tx shadow-[inset_0_-2px_0_var(--ac)]" : "text-tm hover:text-tx"
  }`;

const AUTOSAVE_DELAY_MS = 1200;

/**
 * What a writer is told when the draft moved under them. It names the reload
 * rather than offering a button, because merging two versions of a text is not
 * something this screen can do on their behalf.
 */
const OVERTAKEN_NOTICE =
  "Der Entwurf wurde woanders geändert. Lade die Seite neu — sonst überschreibst du fremde Änderungen.";

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
  canPublish,
}: {
  article: EditorArticle;
  categories: readonly Category[];
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
    grid: article.cover.grid ?? true,
  });
  const [categoryId, setCategoryId] = useState(article.categoryId);
  const [categoryList, setCategoryList] = useState<readonly Category[]>(categories);
  const [newCategory, setNewCategory] = useState("");
  const [slugDraft, setSlugDraft] = useState<string | null>(null);
  const [slugStanding, setSlugStanding] = useState<{
    slug: string;
    free: boolean;
    reason: string;
  } | null>(null);
  const [categoryProblem, setCategoryProblem] = useState<string | null>(null);
  const [publishAt, setPublishAt] = useState(article.publishAt ?? "");
  const [slug, setSlug] = useState(article.slug);
  const [tab, setTab] = useState<"cover" | "meta" | "publish">("cover");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [status, setStatus] = useState(article.status);
  const [busy, startTransition] = useTransition();

  /**
   * Deriving the document from the blocks needs a DOM: `htmlToInline` walks
   * what `contentEditable` left in the element. React runs a `useMemo` during
   * the server render as well, where there is no `document` — which took every
   * load of this screen down with a `ReferenceError` before the page had a
   * chance to hydrate.
   *
   * So the stored body is the first answer, verbatim, and the derivation runs
   * in an effect: the server pass reads the row, and the browser takes over
   * from there.
   */
  const [document_, setDocument] = useState<TipTapDocument>(article.body);

  useEffect(() => {
    setDocument(
      markdown === null
        ? blocksToDocument(blocks, htmlToInline)
        : markdownToDocument(markdown),
    );
  }, [blocks, markdown]);

  const wordCount = countWords(document_);
  const dirty = useRef(false);

  /**
   * Whether anything typed has not reached the server yet. `dirty` above says
   * "has ever been edited" and stays true for the session, which is right for
   * the autosave and wrong for a question about leaving — nobody wants to be
   * asked about work that is already saved.
   */
  const [unsaved, setUnsaved] = useState(false);
  const edits = useRef(0);
  const router = useRouter();

  /**
   * The stand of the row every write is pinned to, in a reference rather than
   * in state: it changes with each save and must not set the autosave off
   * again. Once the server has refused a write because somebody else moved the
   * row, nothing more is sent — a second attempt would carry the same document
   * and the same answer, and the only way on is a reload.
   */
  const knownUpdatedAt = useRef(article.updatedAt);
  const [overtaken, setOvertaken] = useState(false);

  /**
   * `saveArticle` writes only a draft — everything else it answers with `null`
   * and nothing is stored. The mask opened all the same and looked like a
   * working editor: somebody could rewrite a published article, watch the
   * autosave tick past and lose all of it on the next reload. Safe it was;
   * honest it was not.
   *
   * The way back into editing is the review page, which returns an article to
   * its author as a draft.
   */
  const locked = status !== "draft";

  useEffect(() => {
    if (!dirty.current || overtaken || locked) return;

    const handle = window.setTimeout(() => {
      // What the document stood at when this save was sent. Anything typed
      // while it is in flight moves the count, and then the answer does not
      // describe what is on screen any more.
      const sentAt = edits.current;

      startTransition(async () => {
        let answer: Awaited<ReturnType<typeof autosaveAction>>;

        // The same reason `storeNow` catches: a write that throws would take
        // the editor down through the boundary, with everything typed since
        // the last save inside it. The next keystroke starts the timer again.
        try {
          answer = await autosaveAction(article.id, {
            title,
            teaser,
            body: JSON.stringify(document_),
            coverWord: cover.word,
            coverLine: cover.line,
            colorId: cover.colorId,
            coverGrid: cover.grid ?? true,
            categoryId,
            publishAt,
            knownUpdatedAt: knownUpdatedAt.current,
          });
        } catch {
          toast("Gerade ließ sich nichts speichern. Der Text steht noch hier.", "problem");
          return;
        }

        if (answer.conflict) {
          setOvertaken(true);
          toast(OVERTAKEN_NOTICE, "problem");
          return;
        }
        if (answer.savedAt === null) return;
        knownUpdatedAt.current = answer.savedAt;
        setSavedAt(new Date(answer.savedAt));
        if (edits.current === sentAt) setUnsaved(false);
      });
    }, AUTOSAVE_DELAY_MS);

    return () => window.clearTimeout(handle);
  }, [article.id, title, teaser, document_, cover, categoryId, publishAt, overtaken, locked]);

  const touch = <T,>(set: (value: T) => void) => (value: T) => {
    dirty.current = true;
    edits.current += 1;
    setUnsaved(true);
    set(value);
  };

  /**
   * The write, read through a reference rather than closed over: the listener
   * below is registered once per state of `unsaved` and would otherwise keep
   * the function it was mounted with — and with it the title and the text as
   * they were at that moment.
   */
  const store = useRef<() => Promise<boolean>>(async () => true);

  /**
   * Leaving with something unsaved writes it instead of asking about it. The
   * question was the wrong one: nobody who has just typed a page wants to be
   * asked whether to keep it, and the answer is always the same.
   *
   * A link inside the application does not unload the page, so the click is
   * caught first, the article is written, and the navigation follows — the
   * notice in the corner says it happened. A closed tab cannot be given the
   * same treatment, because a browser grants no time for a request on the way
   * out; what is at risk there is the autosave's own delay of just over a
   * second, and no longer the minutes a question would have covered.
   */
  useEffect(() => {
    if (!unsaved) return;

    const intercept = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as Element | null)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement) || anchor.target === "_blank") return;

      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin) return;
      if (destination.pathname === window.location.pathname) return;

      event.preventDefault();
      const going = destination.pathname + destination.search;

      startTransition(async () => {
        // Only once it is written. Leaving anyway after a write that never
        // arrived would be the one thing this interception exists to prevent.
        if (await store.current()) router.push(going as Route);
      });
    };

    document.addEventListener("click", intercept, true);
    return () => document.removeEventListener("click", intercept, true);
  }, [unsaved, router]);

  const toMarkdown = () => setMarkdown(documentToMarkdown(blocksToDocument(blocks, htmlToInline)));

  const toRichText = () => {
    if (markdown !== null) setBlocks(documentToBlocks(markdownToDocument(markdown)));
    setMarkdown(null);
  };

  const [dropProblem, setDropProblem] = useState<string | null>(null);

  /**
   * One upload for both editors. What differs is only where the address lands:
   * markdown gets `![](…)` at the caret, the rich text gets a block — the file
   * takes the same route either way, and so does the refusal.
   */
  const uploadDropped = (file: File, place: (address: string) => void) => {
    setDropProblem(null);
    const carrier = new FormData();
    carrier.set("image", file);

    startTransition(async () => {
      const answer = await uploadBodyImageAction(article.id, carrier);
      if (!answer.ok) {
        setDropProblem(answer.problem);
        toast(answer.problem, "problem");
        return;
      }
      place(`/bild/${answer.imageId}`);
      toast("Bild eingefügt. Alt-Text nicht vergessen.");
    });
  };

  const markdownBox = useRef<HTMLTextAreaElement>(null);
  const slugDialog = useRef<HTMLDialogElement>(null);

  /** At the caret, on its own line, the way a picture sits between paragraphs. */
  const insertIntoMarkdown = (address: string) => {
    const box = markdownBox.current;
    const text = markdown ?? "";
    const at = box?.selectionStart ?? text.length;
    const snippet = `\n![](${address})\n`;
    const next = `${text.slice(0, at)}${snippet}${text.slice(at)}`;

    touch(setMarkdown)(next);
    window.requestAnimationFrame(() => {
      box?.focus();
      const after = at + snippet.length;
      box?.setSelectionRange(after, after);
    });
  };

  const addCategory = () => {
    const wanted = newCategory.trim();
    if (wanted.length === 0) return;

    startTransition(async () => {
      const answer = await createCategoryAction(wanted);
      if (answer.category === null) {
        setCategoryProblem("Der Name ergibt keine Kategorie — höchstens 40 Zeichen.");
        return;
      }
      setCategoryProblem(null);
      setNewCategory("");
      setCategoryList((known) =>
        known.some((entry) => entry.id === answer.category!.id)
          ? known
          : [...known, answer.category!],
      );
      touch(setCategoryId)(answer.category.id);
      toast(`Kategorie „${answer.category.name}" angelegt und gewählt.`);
    });
  };

  /**
   * The browser's own prompt was a system dialog in a page that has a design:
   * grey, in the wrong typeface, and with no room to say whether the address
   * is still free. This one is the page's own.
   */
  const openRename = () => {
    setSlugDraft(slug);
    setSlugStanding(null);
    slugDialog.current?.showModal();
  };

  useEffect(() => {
    if (slugDraft === null) return;

    const handle = window.setTimeout(() => {
      startTransition(async () => {
        setSlugStanding(await checkSlugAction(article.id, slugDraft));
      });
    }, 220);

    return () => window.clearTimeout(handle);
  }, [article.id, slugDraft]);

  const rename = () => {
    const wanted = slugDraft?.trim() ?? "";
    if (wanted.length === 0) return;

    startTransition(async () => {
      const answer = await renameSlugAction(article.id, wanted);
      if (answer.slug !== null) {
        setSlug(answer.slug);
        // The rename wrote the row, so the next autosave is pinned to what it
        // left behind rather than to the stand from before the rename.
        if (answer.updatedAt !== null) knownUpdatedAt.current = answer.updatedAt;
        toast(`Die Adresse lautet jetzt /artikel/${answer.slug}`);
      }
      slugDialog.current?.close();
    });
  };

  const [submitProblem, setSubmitProblem] = useState<string | null>(null);

  /**
   * The write itself, awaitable. `startTransition` hands back nothing, so a
   * caller that has to know when the article is stored — the one that leaves
   * the page afterwards — cannot go through the button's handler.
   */
  const storeNow = async () => {
    let answer: Awaited<ReturnType<typeof autosaveAction>>;

    /**
     * The action reports a refused write, but it throws on a database that is
     * not there — and a rejected action inside a transition reaches the error
     * boundary, which replaces this editor along with the page of text that has
     * not been written yet. Caught here, the text stays on screen and the
     * notice says what happened; `false` also keeps the interception above from
     * navigating away from it.
     */
    try {
      answer = await autosaveAction(article.id, {
        title,
        teaser,
        body: JSON.stringify(document_),
        coverWord: cover.word,
        coverLine: cover.line,
        colorId: cover.colorId,
        coverGrid: cover.grid ?? true,
        categoryId,
        publishAt,
        knownUpdatedAt: knownUpdatedAt.current,
      });
    } catch {
      toast("Gerade ließ sich nichts speichern. Der Text steht noch hier.", "problem");
      return false;
    }

    if (answer.conflict) {
      setOvertaken(true);
      toast(OVERTAKEN_NOTICE, "problem");
      return true;
    }

    if (answer.savedAt === null) {
      toast("Der Entwurf ließ sich nicht speichern.", "problem");
      return true;
    }

    knownUpdatedAt.current = answer.savedAt;
    setSavedAt(new Date(answer.savedAt));
    setUnsaved(false);
    toast("Als Entwurf gespeichert.");
    return true;
  };

  /**
   * The autosave already writes a second after the last keystroke, so the
   * button changes nothing the article would not have got anyway. What it
   * changes is knowing: somebody who has typed a page should be able to press
   * something and be told it is stored, rather than read a timestamp and hope.
   */
  const saveDraft = () =>
    startTransition(async () => {
      await storeNow();
    });
  store.current = storeNow;

  const submit = () =>
    startTransition(async () => {
      const { outcome } = await submitAction(article.id);

      if (outcome === "alt_text_missing") {
        setSubmitProblem("Ein Bild ohne Alt-Text lässt sich nicht veröffentlichen.");
        toast("Ein Bild ohne Alt-Text lässt sich nicht veröffentlichen.", "problem");
        return;
      }

      setSubmitProblem(null);
      if (outcome === "published") {
        setStatus("published");
        toast("Der Artikel ist veröffentlicht.");
      }
      if (outcome === "submitted") {
        setStatus("review");
        toast("Der Artikel wartet jetzt auf die Freigabe.");
      }
    });


  const colour = coverColorById(cover.colorId);
  const savedLabel = unsaved
    ? "Nicht gesichert"
    : savedAt === null
      ? "Autosave aktiv"
      : `Autosave · ${CLOCK.format(savedAt)}`;

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[1fr_340px]">
      <div className={PANEL_CLASS}>
        <div className="flex flex-wrap items-center gap-3 border-b border-bd px-4 py-3 text-[12.5px] font-semibold md:px-[30px]">
          <Link href="/admin/artikel" className="text-tm no-underline transition-colors duration-200 ease-out hover:text-tx">
            ← Artikel
          </Link>
          <span className={unsaved ? "font-bold text-ac2" : "text-tm"}>{savedLabel}</span>
          <span className="rounded-full border border-bd bg-s2 px-2.5 py-[5px] text-tm">
            {STATUS_LABELS[status]}
          </span>
          <div className="ml-auto flex gap-2">
            <Link
              href={`/admin/artikel/${article.id}/vorschau`}
              // inline-flex, because an inline link's text sits on its
              // baseline and the button beside it centres its own label — the
              // two words then stood at different heights in the same row.
              className="inline-flex items-center rounded-lg border border-bd px-3.5 py-2 text-[12.5px] font-bold text-tx no-underline transition-colors duration-200 ease-out hover:border-ac"
            >
              Vorschau
            </Link>
            <button
              type="button"
              onClick={saveDraft}
              disabled={status !== "draft"}
              className="inline-flex cursor-pointer items-center rounded-lg border border-bd bg-transparent px-3.5 py-2 font-control text-[12.5px] font-bold text-tx transition-colors duration-200 ease-out hover:border-ac disabled:cursor-not-allowed disabled:opacity-45"
            >
              Als Entwurf speichern
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={status !== "draft"}
              className={`${PRIMARY_BUTTON_CLASS} py-2 text-[12.5px]`}
            >
              {canPublish ? "Veröffentlichen" : "Zur Freigabe"}
            </button>
          </div>
        </div>

        {/* Where the reason belongs: on the article, at the top, in front of
            the person who has to answer it. It folds away, because it is read
            once and then worked on. */}
        {article.rejectionReason === null || status !== "draft" ? null : (
          <div className="mx-4 mt-5 rounded-[10px] border border-ac2 px-4 py-3 md:mx-[30px]">
            <div className="text-[11px] font-bold tracking-[0.1em] text-ac2 uppercase">
              Zurückgegeben
            </div>
            <RejectionNote reason={article.rejectionReason} />
          </div>
        )}

        {locked ? (
          <p
            role="status"
            className="mx-4 mt-5 rounded-[10px] border border-bd bg-s2 px-4 py-3 text-[13px] leading-[1.55] font-semibold text-tm md:mx-[30px]"
          >
            Dieser Artikel steht auf „{STATUS_LABELS[status]}“ und lässt sich hier nicht
            ändern — gespeichert wird nur ein Entwurf. Zurück in den Entwurf kommt er
            über die Freigabe.
          </p>
        ) : null}

        <div className="px-4 pt-6 md:px-[30px]">
          <div className={LABEL_CLASS}>Titel</div>
          <input
            value={title}
            onChange={(event) => touch(setTitle)(event.target.value)}
            readOnly={locked}
            aria-label="Titel"
            className="va-focus-underline mt-2 w-full border-none bg-transparent p-0 text-[25px] leading-[1.08] font-extrabold tracking-[-0.04em] text-tx md:text-[34px]"
          />
          <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[12.5px] font-semibold text-tm">
            <span>Slug</span>
            <code className="rounded-md border border-bd bg-s2 px-2 py-1 font-mono text-xs">{slug}</code>
            <button
              type="button"
              onClick={openRename}
              className="cursor-pointer border-none bg-transparent p-0 font-control text-[12.5px] font-semibold text-ac transition-opacity duration-200 ease-out hover:opacity-75"
            >
              bearbeiten
            </button>
          </div>
        </div>

        {/* A real dialog, not a div that only says `aria-modal`: the browser
            keeps the focus inside it, closes it on Escape from every element
            and hands the focus back to „bearbeiten" afterwards. Kept above the
            middle, as the other dialogs are. */}
        <dialog
          ref={slugDialog}
          aria-label="Slug ändern"
          onClose={() => setSlugDraft(null)}
          onClick={(event) => {
            if (event.target === event.currentTarget) slugDialog.current?.close();
          }}
          className={`${PANEL_CLASS} mx-auto mt-6 mb-auto w-[min(420px,calc(100vw-40px))] p-0 text-tx backdrop:bg-black/40 md:mt-10`}
        >
          {slugDraft === null ? null : (
            <div className="va-in">
              <div className={PANEL_HEADING_CLASS}>Adresse des Artikels</div>
              <div className="flex flex-col gap-3 p-5">
                <label className={LABEL_CLASS} htmlFor="slug-draft">
                  Slug
                </label>
                <div className="flex items-baseline gap-2.5">
                  <input
                    id="slug-draft"
                    autoFocus
                    value={slugDraft}
                    onChange={(event) => setSlugDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && slugStanding?.free === true) rename();
                    }}
                    className={`${FIELD_CLASS} font-mono`}
                  />
                  {/* Right of the field, because that is where the answer to
                      "is this one still to be had" belongs — beside what was
                      typed, not underneath it. */}
                  <span
                    className={`shrink-0 text-[11.5px] font-bold whitespace-nowrap ${
                      slugStanding === null
                        ? "text-tm"
                        : slugStanding.free
                          ? "text-ac"
                          : "text-ac2"
                    }`}
                  >
                    {slugStanding === null
                      ? "prüft …"
                      : slugStanding.reason === "leer"
                        ? "leer"
                        : slugStanding.reason === "eigener"
                          ? "aktuell"
                          : slugStanding.free
                            ? "frei"
                            : "belegt"}
                  </span>
                </div>

                <p className="m-0 text-[12.5px] leading-[1.55] font-medium text-tm">
                  {slugStanding === null || slugStanding.slug.length === 0
                    ? "Aus dem Namen wird eine Adresse gemacht."
                    : `/artikel/${slugStanding.slug}`}
                  {" · "}
                  Alte Adressen leiten weiter.
                </p>

                <div className="mt-1 flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={rename}
                    disabled={slugStanding === null || !slugStanding.free || busy}
                    className={`${PRIMARY_BUTTON_CLASS} disabled:cursor-not-allowed disabled:opacity-45`}
                  >
                    Übernehmen
                  </button>
                  <button
                    type="button"
                    onClick={() => slugDialog.current?.close()}
                    className={QUIET_BUTTON_CLASS}
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            </div>
          )}
        </dialog>

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
          <div inert={locked} className="px-4 pt-6 pb-9 md:px-[30px]">
            <BlockEditor
              blocks={blocks}
              onChange={touch(setBlocks)}
              onDropImage={uploadDropped}
            />
            {dropProblem === null ? null : (
              <p role="alert" className="mt-3 text-[12.5px] font-semibold text-ac2">
                {dropProblem}
              </p>
            )}
            <div className="mt-[22px] text-[12.5px] font-semibold text-tm">
              {formatWordCount(wordCount)} Wörter · {readingTimeMinutes(wordCount)} Min Lesezeit
            </div>
          </div>
        ) : (
          <div className="grid gap-px bg-bd md:grid-cols-2">
            <textarea
              ref={markdownBox}
              value={markdown}
              readOnly={locked}
              onChange={(event) => touch(setMarkdown)(event.target.value)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                const file = event.dataTransfer.files[0];
                if (file === undefined) return;
                event.preventDefault();
                uploadDropped(file, insertIntoMarkdown);
              }}
              onPaste={(event) => {
                const file = event.clipboardData.files[0];
                if (file === undefined) return;
                event.preventDefault();
                uploadDropped(file, insertIntoMarkdown);
              }}
              aria-label="Markdown"
              rows={20}
              className="va-focus-inside m-0 resize-y bg-s1 px-[26px] py-6 font-mono text-[13px] leading-[1.75] text-tx"
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
        {/* Drawn as tabs, announced as what they are: three toggles in a
            group. `role="tab"` would promise a panel to jump to and the arrow
            keys to move between them, and neither is here. */}
        <div role="group" aria-label="Artikel-Einstellungen" className="grid grid-cols-3 border-b border-bd px-4">
          <button type="button" aria-pressed={tab === "cover"} onClick={() => setTab("cover")} className={TAB_CLASS(tab === "cover")}>
            Cover
          </button>
          <button type="button" aria-pressed={tab === "meta"} onClick={() => setTab("meta")} className={TAB_CLASS(tab === "meta")}>
            Details
          </button>
          <button type="button" aria-pressed={tab === "publish"} onClick={() => setTab("publish")} className={TAB_CLASS(tab === "publish")}>
            Veröffentlichen
          </button>
        </div>

        {tab === "cover" ? (
          <div className="va-in">
            <div className="border-b border-bd px-[18px] pt-[18px] pb-4">
              <div className="flex items-baseline justify-between">
                {/* The article head, not the card: that is the panel the grid
                    is drawn on, so a preview on a card showed the switch doing
                    nothing. Its own variant, because the real one is sized
                    against the window and this box is 300px wide. */}
                <span className={LABEL_CLASS}>Vorschau · Artikelkopf</span>
                <span className="text-[11.5px] font-semibold text-tm">
                  {`generiert · ${colour.name}`}
                </span>
              </div>
              <div className="mt-3 overflow-hidden rounded-[10px]">
                <ArticleCover
                  title={title}
                  colorId={cover.colorId}
                  grid={cover.grid}
                  eyebrow="Titelthema"
                  word={cover.word}
                  line={cover.line}
                  variant="preview"
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

            {/* The template draws the grid on every generated cover. On a busy
                cover word it competes with the type, so it is a choice — and
                only a choice where the panel is generated: a photograph never
                had one. */}
            <div className="flex items-center justify-between gap-4 border-b border-bd px-[18px] py-4">
              <span>
                <label className={LABEL_CLASS} htmlFor="cover-grid">
                  Karo im Hintergrund
                </label>
                <span className="mt-1 block text-[11.5px] font-medium text-tm">
                  {cover.grid === false
                    ? "Aus — glatte Fläche."
                    : "An — wie in der Vorlage."}
                </span>
              </span>
              <label className="inline-flex min-h-11 cursor-pointer items-center">
                <input
                  id="cover-grid"
                  type="checkbox"
                  checked={cover.grid !== false}
                  onChange={(event) =>
                    touch(setCover)({ ...cover, grid: event.target.checked })
                  }
                  className="peer sr-only"
                />
                {/* The two states are computed rather than expressed with
                    peer-checked, because the knob is a descendant of the
                    track and not its sibling — which is what that variant
                    selects. */}
                <span
                  className={`flex h-6 w-[42px] items-center rounded-full p-[2px] transition-[background,border-color] duration-200 ease-out peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ac ${
                    cover.grid === false
                      ? "justify-start border border-bd bg-s2"
                      : "justify-end border border-transparent bg-ac"
                  }`}
                >
                  <span className="size-[18px] rounded-full bg-s1 shadow-sm" />
                </span>
              </label>
            </div>

          </div>
        ) : null}

        {tab === "meta" ? (
          <div className="va-in">
            <div className="border-b border-bd px-[18px] py-4">
              <div className={LABEL_CLASS}>Kategorie</div>
              <div className="mt-2 flex flex-wrap gap-1.5 text-xs font-bold">
                {categoryList.map((category) => (
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

              {/* The six the paper started with are not the six it will always
                  need, and the person who finds that out is the one filing the
                  article. A new one is picked straight away — nobody adds a
                  category they did not want to use. */}
              <div className="mt-2.5 flex gap-1.5">
                <input
                  value={newCategory}
                  onChange={(event) => setNewCategory(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter") return;
                    event.preventDefault();
                    addCategory();
                  }}
                  maxLength={40}
                  placeholder="Eigene Kategorie"
                  aria-label="Eigene Kategorie"
                  className={FIELD_CLASS}
                />
                <button
                  type="button"
                  onClick={addCategory}
                  disabled={newCategory.trim().length === 0}
                  className={`${QUIET_BUTTON_CLASS} shrink-0 disabled:cursor-not-allowed disabled:opacity-45`}
                >
                  Anlegen
                </button>
              </div>
              {categoryProblem === null ? null : (
                <p role="alert" className="mt-1.5 text-[11.5px] font-semibold text-ac2">
                  {categoryProblem}
                </p>
              )}
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
                readOnly={locked}
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
                {canPublish ? "Jetzt veröffentlichen" : "Zur Freigabe einreichen"}
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
              {submitProblem === null ? null : (
                <p role="alert" className="text-[11.5px] font-semibold text-ac2">
                  {submitProblem}
                </p>
              )}
            </div>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
