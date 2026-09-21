import { imageRecord } from "@/lib/queries";
import { readObject } from "@/lib/storage";

/**
 * Serves an image from the object store under this origin. The database holds
 * the object key and never a URL, so the storage host appears in no markup, no
 * redirect and no signed link — the browser asks this application and this
 * application reads the bytes.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const notFound = () => new Response("Nicht gefunden", { status: 404 });

export const GET = async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id } = await params;
  if (!UUID.test(id)) return notFound();

  const image = await imageRecord(id);
  if (image === undefined) return notFound();

  let object: Awaited<ReturnType<typeof readObject>>;

  try {
    object = await readObject(image.key);
  } catch {
    // The row promises an object the bucket does not have. Which key is
    // missing belongs in the log, not in the response.
    console.error(`Image ${id} is recorded but its object could not be read`);
    return notFound();
  }

  if (object === null) return notFound();

  return new Response(object.bytes, {
    headers: {
      "content-type": image.mime,
      // The id names one immutable object: a changed picture is a new row.
      "cache-control": "public, max-age=31536000, immutable",
      "content-disposition": "inline",
      "x-content-type-options": "nosniff",
    },
  });
};
