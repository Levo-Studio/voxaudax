"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireCapability } from "@/lib/authorize";
import { refreshPublic } from "@/lib/refresh";
import type { ArticleCover } from "@/lib/content";
import { isCoverColorId } from "@/lib/cover";
import { db } from "@/lib/db/client";
import { images } from "@/lib/db/schema";
import {
  articleForEditor,
  createCategory,
  renameSlug,
  saveArticle,
  slugStanding,
  submitForReview,
} from "@/lib/editorial/articles";
import { readDimensions } from "@/lib/image-dimensions";
import { COVER_IMAGE_TYPES, MAXIMUM_UPLOAD_BYTES, storeObject } from "@/lib/storage";
import { parseDocumentJson } from "@/lib/tiptap";

/**
 * Everything the editor sends is re-read here. The browser decides what it
 * shows; it decides nothing about what is stored — the colour has to be one of
 * the fourteen, the body is parsed back down to the node types the toolbar can
 * produce, and a schedule that is not a date is no schedule.
 */
const draft = z.object({
  title: z.string().trim().min(1).max(200),
  teaser: z.string().trim().max(400),
  body: z.string(),
  coverWord: z.string().trim().max(40),
  coverLine: z.string().trim().max(120),
  colorId: z.string().refine(isCoverColorId, "unknown cover colour"),
  coverGrid: z.boolean(),
  categoryId: z.uuid(),
  publishAt: z.string(),
});

export type DraftInput = z.input<typeof draft>;

export const autosaveAction = async (articleId: string, input: DraftInput) => {
  const member = await requireCapability("writeOwnArticles");
  const parsed = draft.safeParse(input);
  if (!parsed.success) return { savedAt: null };

  const existing = await articleForEditor(member, articleId);
  if (existing === null) return { savedAt: null };

  const cover: ArticleCover = {
    word: parsed.data.coverWord,
    line: parsed.data.coverLine,
    colorId: parsed.data.colorId,
    grid: parsed.data.coverGrid,
  };

  const scheduled = parsed.data.publishAt.length === 0 ? null : new Date(parsed.data.publishAt);

  const savedAt = await saveArticle(member, articleId, {
    title: parsed.data.title,
    teaser: parsed.data.teaser,
    body: parseDocumentJson(parsed.data.body),
    cover,
    categoryId: parsed.data.categoryId,
    publishAt: scheduled === null || Number.isNaN(scheduled.getTime()) ? null : scheduled,
  });

  return { savedAt: savedAt?.toISOString() ?? null };
};

export const renameSlugAction = async (articleId: string, wanted: string) => {
  const member = await requireCapability("writeOwnArticles");
  const slug = await renameSlug(member, articleId, wanted);
  if (slug !== null) revalidatePath(`/admin/artikel/${articleId}`);
  return { slug };
};

/**
 * A category added while filing. Any author may add one — they are the people
 * who find out that the six the paper started with do not cover what they are
 * writing — and the name is all they give: the slug and the place in the chip
 * row are derived, so two people cannot disagree about either.
 */
export const createCategoryAction = async (name: string) => {
  await requireCapability("writeOwnArticles");

  const wanted = name.trim();
  if (wanted.length === 0 || wanted.length > 40) return { category: null };

  const category = await createCategory(wanted);
  if (category !== null) revalidatePath("/", "layout");

  return { category };
};

/** Read-only, so the editor can ask on every keystroke while a slug is typed. */
export const checkSlugAction = async (articleId: string, wanted: string) => {
  await requireCapability("writeOwnArticles");
  return slugStanding(articleId, wanted);
};

export const submitAction = async (articleId: string) => {
  const member = await requireCapability("writeOwnArticles");
  const outcome = await submitForReview(member, articleId);

  if (outcome !== "unknown" && outcome !== "alt_text_missing") {
    revalidatePath(`/admin/artikel/${articleId}`);
  }
  // Only the one that reaches readers rebuilds their pages.
  if (outcome === "published") refreshPublic.articles();

  return { outcome };
};

export type ImageUploadResult =
  | { readonly ok: true; readonly imageId: string }
  | { readonly ok: false; readonly problem: string };

/**
 * An image pasted into the body. The same checks as the cover — the type, the
 * size, and that the bytes really are an image whose dimensions can be read —
 * but it touches nothing on the article: the block holds the address, and the
 * document is saved by the autosave that follows.
 *
 * Alt text starts empty, which is the state the approval list refuses to
 * publish on. That is deliberate: a picture nobody can hear is not finished.
 */
export const uploadBodyImageAction = async (
  articleId: string,
  form: FormData,
): Promise<ImageUploadResult> => {
  const member = await requireCapability("writeOwnArticles");
  const existing = await articleForEditor(member, articleId);
  if (existing === null) return { ok: false, problem: "Der Artikel ist nicht erreichbar." };

  const file = form.get("image");
  if (!(file instanceof File)) return { ok: false, problem: "Es kam keine Datei an." };

  if (!(COVER_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return { ok: false, problem: "Erlaubt sind JPG, PNG und WebP." };
  }

  if (file.size > MAXIMUM_UPLOAD_BYTES) {
    return { ok: false, problem: "Das Bild ist größer als 8 MB." };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const size = readDimensions(bytes, file.type);
  if (size === null) return { ok: false, problem: "Die Bilddatei ließ sich nicht lesen." };

  const key = await storeObject({ prefix: "artikel", bytes, mime: file.type });

  const [image] = await db
    .insert(images)
    .values({
      key,
      mime: file.type,
      width: size.width,
      height: size.height,
      alt: null,
      uploadedBy: member.id,
    })
    .returning({ id: images.id });

  return image === undefined
    ? { ok: false, problem: "Das Bild ließ sich nicht ablegen." }
    : { ok: true, imageId: image.id };
};

