"use server";

import { revalidatePath } from "next/cache";

import { requireCapability, requireMember } from "@/lib/authorize";
import { createMeme, editMeme, setMemeVisibility } from "@/lib/editorial/memes";
import { readDimensions } from "@/lib/image-dimensions";
import { MAXIMUM_UPLOAD_BYTES, MEME_IMAGE_TYPES, storeObject } from "@/lib/storage";

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

  const key = await storeObject({ prefix: "memes", bytes, mime: file.type });

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
  return { problem: null, uploaded: true };
};

export const toggleMemeVisibilityAction = async (form: FormData) => {
  await requireMember();
  const memeId = String(form.get("memeId") ?? "");
  await setMemeVisibility(memeId, form.get("visible") === "on");
  revalidatePath("/admin/memes");
};

export const editMemeAction = async (form: FormData) => {
  await requireMember();
  const alt = String(form.get("alt") ?? "").trim();
  if (alt.length === 0) return;

  const caption = String(form.get("caption") ?? "").trim();

  await editMeme({
    memeId: String(form.get("memeId") ?? ""),
    imageId: String(form.get("imageId") ?? ""),
    alt,
    caption: caption.length === 0 ? null : caption,
    visible: form.get("visible") === "on",
  });

  revalidatePath("/admin/memes");
};
