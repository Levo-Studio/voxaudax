"use server";

import { revalidatePath } from "next/cache";

import { refreshPublic } from "@/lib/refresh";

import { requireCapability } from "@/lib/authorize";
import { createMeme, deleteMeme, editMeme, setMemeVisibility } from "@/lib/editorial/memes";
import { readDimensions } from "@/lib/image-dimensions";
import {
  MAXIMUM_UPLOAD_BYTES,
  MEME_IMAGE_TYPES,
  removeObject,
  storeObject,
} from "@/lib/storage";

export type UploadState = { readonly problem: string | null; readonly uploaded: boolean };

/**
 * Screen 10b's alt text is the one field marked "Pflichtfeld", so an upload
 * without one is refused here rather than allowed in and caught at the review
 * grid. A meme created by anyone still waits for a freigabe by somebody else.
 */
export const uploadMemeAction = async (
  _state: UploadState,
  form: FormData,
): Promise<UploadState> => {
  const member = await requireCapability("writeOwnArticles");

  const file = form.get("image");
  const alt = String(form.get("alt") ?? "").trim();
  const caption = String(form.get("caption") ?? "").trim();
  const visible = form.get("visibility") !== "hidden";

  if (!(file instanceof File) || file.size === 0) {
    return { problem: "Es kam keine Datei an.", uploaded: false };
  }

  if (alt.length === 0) {
    return { problem: "Ohne Alt-Text wird das Meme nicht angelegt.", uploaded: false };
  }

  if (!(MEME_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return { problem: "Erlaubt sind JPG, PNG, WebP und GIF.", uploaded: false };
  }

  if (file.size > MAXIMUM_UPLOAD_BYTES) {
    return { problem: "Das Bild ist größer als 8 MB.", uploaded: false };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const size = readDimensions(bytes, file.type);
  if (size === null) return { problem: "Die Bilddatei ließ sich nicht lesen.", uploaded: false };

  let key: string;

  try {
    key = await storeObject({ prefix: "memes", bytes, mime: file.type });
  } catch (cause) {
    // The bucket is the one thing in this form that fails from outside it, and
    // it was the only refusal the form could not report: letting it out took
    // the whole column with it, alt text and caption included, where a problem
    // the state already carries leaves them standing for a second attempt.
    console.error("error", "a meme image could not be stored", { cause });
    return {
      problem: "Das Bild ließ sich gerade nicht ablegen. Versuch es gleich noch einmal.",
      uploaded: false,
    };
  }

  await createMeme({
    member,
    imageKey: key,
    mime: file.type,
    width: size.width,
    height: size.height,
    alt,
    caption: caption.length === 0 ? null : caption,
    visible,
  });

  revalidatePath("/admin/memes");
  refreshPublic.memes();
  return { problem: null, uploaded: true };
};

/**
 * Screen 11c files memes under the same row as articles: a redakteur or an
 * admin decides whether one is online, and an autor does not. Both of these
 * asked only for a member, so an autor could take somebody else's published
 * meme offline and rewrite its caption.
 */
export const toggleMemeVisibilityAction = async (form: FormData) => {
  await requireCapability("approveArticlesAndMemes");
  const memeId = String(form.get("memeId") ?? "");
  await setMemeVisibility(memeId, form.get("visible") === "on");
  revalidatePath("/admin/memes");
  refreshPublic.memes();
};

/**
 * Whoever may take a meme off the wall may also remove it, which is the same
 * decision one step further. It is needed when somebody is recognisable on the
 * picture and asks for it to go: hidden, the file stays in the bucket and is
 * still served to every signed-in member, so hiding does not answer that.
 */
export const deleteMemeAction = async (form: FormData) => {
  await requireCapability("approveArticlesAndMemes");

  const { deleted, imageKey } = await deleteMeme(String(form.get("memeId") ?? ""));
  if (!deleted) return;

  // After the row, so a failure in the bucket never leaves a meme pointing at
  // bytes that are gone.
  await removeObject(imageKey);

  revalidatePath("/admin/memes");
  refreshPublic.memes();
};

export const editMemeAction = async (form: FormData) => {
  await requireCapability("approveArticlesAndMemes");
  const alt = String(form.get("alt") ?? "").trim();
  if (alt.length === 0) return;

  const caption = String(form.get("caption") ?? "").trim();

  await editMeme({
    memeId: String(form.get("memeId") ?? ""),
    alt,
    caption: caption.length === 0 ? null : caption,
    visible: form.get("visible") === "on",
  });

  revalidatePath("/admin/memes");
  refreshPublic.memes();
};
