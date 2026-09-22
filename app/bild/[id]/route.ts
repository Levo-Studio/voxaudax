import { currentMember } from "@/lib/authorize";
import { imageAccess, imageHeaders, mayReadImage } from "@/lib/editorial/images";
import { readObject } from "@/lib/storage";

/**
 * Serves an image from the object store under this origin. The database holds
 * the object key and never a URL, so the storage host appears in no markup, no
 * redirect and no signed link — the browser asks this application and this
 * application reads the bytes.
 *
 * This is the address every page writes (`imageHref`), so it is the address the
 * rule has to hold at. What may be read is decided in `lib/editorial/images`
 * and nowhere else: a second reader of these bytes that answered the question
 * itself would sooner or later answer it differently, which is exactly how a
 * meme that was hidden again went on being served from here.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Unknown and out of reach answer the same: a 403 is still an answer about it. */
const notFound = () => new Response("Nicht gefunden", { status: 404 });

export const GET = async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id } = await params;
  if (!UUID.test(id)) return notFound();

  const access = await imageAccess(id);
  if (access === null) return notFound();

  const member = access.publiclyVisible ? null : await currentMember();
  if (!(await mayReadImage(access, member))) return notFound();

  let object: Awaited<ReturnType<typeof readObject>>;

  try {
    object = await readObject(access.key);
  } catch {
    // The row promises an object the bucket does not have. Which key is
    // missing belongs in the log, not in the response.
    console.error(`Image ${id} is recorded but its object could not be read`);
    return notFound();
  }

  if (object === null) return notFound();

  return new Response(object.stream, { headers: imageHeaders(access) });
};
