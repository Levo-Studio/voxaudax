import { currentMember } from "@/lib/authorize";
import { imageAccess, imageHeaders, mayReadImage } from "@/lib/editorial/images";
import { readObject } from "@/lib/storage";

/**
 * Transport only: what may be read, and with which headers it is answered, is
 * decided in `lib/editorial/images`, so a second reader of these bytes cannot
 * decide either of them differently.
 *
 * Every refusal is the same 404, whether the image is unknown or merely out of
 * reach — a 403 about an image would still be an answer about it.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const missing = () => new Response(null, { status: 404 });

export const GET = async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id } = await params;

  // The column is a uuid, so anything else names no image — and asking the
  // database about it is an error rather than an empty answer.
  if (!UUID.test(id)) return missing();

  const access = await imageAccess(id);
  if (access === null) return missing();

  const member = access.publiclyVisible ? null : await currentMember();
  if (!(await mayReadImage(access, member))) return missing();

  const object = await readObject(access.key);
  if (object === null) return missing();

  return new Response(object.stream, { headers: imageHeaders(access) });
};
