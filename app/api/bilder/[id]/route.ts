import { eq } from "drizzle-orm";

import { currentMember } from "@/lib/authorize";
import { db } from "@/lib/db/client";
import { images, memes } from "@/lib/db/schema";
import { readObject } from "@/lib/storage";

/**
 * The bucket is private and the storage host never reaches a browser, so the
 * bytes are read here and served from this origin.
 *
 * An image that belongs to a published meme is public; everything else needs a
 * member, because a cover uploaded to a draft is part of that draft.
 */
export const GET = async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id } = await params;

  const [image] = await db
    .select({ key: images.key, mime: images.mime, memeStatus: memes.status, memeVisible: memes.visible })
    .from(images)
    .leftJoin(memes, eq(memes.imageId, images.id))
    .where(eq(images.id, id));

  if (image === undefined) return new Response(null, { status: 404 });

  const publiclyVisible = image.memeStatus === "published" && image.memeVisible === true;

  if (!publiclyVisible && (await currentMember()) === null) {
    return new Response(null, { status: 404 });
  }

  const object = await readObject(image.key);
  if (object === null) return new Response(null, { status: 404 });

  return new Response(new Uint8Array(object.bytes), {
    headers: {
      "Content-Type": image.mime,
      "Cache-Control": publiclyVisible
        ? "public, max-age=31536000, immutable"
        : "private, no-store",
    },
  });
};
