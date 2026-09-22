import "server-only";
import { randomUUID } from "node:crypto";

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import { environment } from "@/lib/env";

/**
 * Screen 10b and the editor's cover tab both cap an upload at 8 MB, and both
 * name the types they take. The meme uploader also takes GIF, which the cover
 * does not: an animated cover would move behind the headline.
 */
export const MAXIMUM_UPLOAD_BYTES = 8 * 1024 * 1024;

export const COVER_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const MEME_IMAGE_TYPES = [...COVER_IMAGE_TYPES, "image/gif"] as const;

/**
 * A logo arrives as whatever the company happens to have, and refusing a JPG
 * only means somebody converts it badly first. Transparency does not matter
 * either: the tile is a fixed box on its own background, and a picture without
 * an alpha channel simply fills it.
 *
 * SVG stays in the list, and is the one type that needs care rather than
 * trust — `imageHeaders` hands it over as a download under a sandbox, because
 * an SVG opened as an address of its own is a document that runs script.
 */
export const LOGO_IMAGE_TYPES = [
  "image/svg+xml",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/avif",
] as const;

const processScope = globalThis as typeof globalThis & {
  voxAudaxS3?: S3Client;
};

const client = () =>
  (processScope.voxAudaxS3 ??= new S3Client({
    endpoint: environment().S3_ENDPOINT,
    region: environment().S3_REGION,
    forcePathStyle: environment().S3_FORCE_PATH_STYLE,
    credentials: {
      accessKeyId: environment().S3_ACCESS_KEY_ID,
      secretAccessKey: environment().S3_SECRET_ACCESS_KEY,
    },
    // The node handler waits indefinitely by default, and the image route hands
    // the stream straight to the reader. A storage host that accepts the socket
    // and then says nothing would otherwise hold the request open for as long
    // as it cared to, one worker at a time. `throwOnRequestTimeout` is not
    // optional here: without it the handler logs that the deadline passed and
    // then goes on waiting anyway.
    requestHandler: {
      connectionTimeout: 2_000,
      requestTimeout: 10_000,
      throwOnRequestTimeout: true,
    },
  }));

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};

/**
 * The key is drawn rather than taken from the file name: a name the browser
 * supplies decides nothing about where the bytes land, so no upload can reach
 * another object's key or carry a path of its own.
 */
export const storeObject = async (input: {
  readonly prefix: "memes" | "cover" | "artikel" | "logos" | "avatare";
  readonly bytes: Uint8Array;
  readonly mime: string;
}) => {
  const key = `${input.prefix}/${randomUUID()}.${EXTENSIONS[input.mime] ?? "bin"}`;

  await client().send(
    new PutObjectCommand({
      Bucket: environment().S3_BUCKET,
      Key: key,
      Body: input.bytes,
      ContentType: input.mime,
    }),
  );

  return key;
};

/**
 * A key the bucket does not hold is an answer and not a failure: the S3 client
 * raises `NoSuchKey`, and letting it out turned a missing object into a 500
 * about the storage host — while the caller's own `object === null` branch,
 * which answers 404, could never be reached.
 */
const objectIsMissing = (cause: unknown) => {
  const error = cause as {
    readonly name?: unknown;
    readonly $metadata?: { readonly httpStatusCode?: number };
  };

  return (
    error.name === "NoSuchKey" ||
    error.name === "NotFound" ||
    error.$metadata?.httpStatusCode === 404
  );
};

export const readObject = async (key: string) => {
  let object;

  try {
    object = await client().send(
      new GetObjectCommand({ Bucket: environment().S3_BUCKET, Key: key }),
    );
  } catch (cause) {
    if (objectIsMissing(cause)) return null;
    throw cause;
  }

  const body = object.Body;
  if (body === undefined) return null;

  return {
    // Handed on as a stream rather than as a buffer: an 8 MB meme read into
    // the heap is 8 MB the process holds for as long as the reader takes, and
    // a gallery asks for dozens of them at once. The bytes pass through.
    stream: body.transformToWebStream(),
    mime: object.ContentType ?? "application/octet-stream",
  };
};

/**
 * Removes the bytes behind a key. A key the bucket does not hold is not an
 * error — S3 answers a delete of a missing object with success, and that is the
 * right answer here too: the caller wanted it gone, and it is.
 */
export const removeObject = async (key: string) => {
  await client().send(
    new DeleteObjectCommand({ Bucket: environment().S3_BUCKET, Key: key }),
  );
};
