import "server-only";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";

import { environment } from "@/lib/env";

/**
 * One client per process, for the same reason the database keeps one pool:
 * development reloads these modules on every edit, and a client per reload
 * leaks its connection agent.
 */
const processScope = globalThis as typeof globalThis & {
  voxAudaxStorage?: S3Client;
};

const client = () =>
  (processScope.voxAudaxStorage ??= new S3Client({
    endpoint: environment().S3_ENDPOINT,
    region: environment().S3_REGION,
    forcePathStyle: environment().S3_FORCE_PATH_STYLE,
    credentials: {
      accessKeyId: environment().S3_ACCESS_KEY_ID,
      secretAccessKey: environment().S3_SECRET_ACCESS_KEY,
    },
    // The node handler waits indefinitely by default, and /bild/[id] hands the
    // stream straight to the reader. A storage host that accepts the socket and
    // then says nothing would otherwise hold the request open for as long as it
    // cared to, one worker at a time. `throwOnRequestTimeout` is not optional
    // here: without it the handler logs that the deadline passed and then goes
    // on waiting anyway.
    requestHandler: {
      connectionTimeout: 2_000,
      requestTimeout: 10_000,
      throwOnRequestTimeout: true,
    },
  }));

/**
 * Reads an object as a stream the response can pass straight through. Nothing
 * in the bucket is public and no signed URL is ever handed out, so this is the
 * only way bytes leave the store — and the browser only ever learns this
 * origin's own address.
 */
export const readObject = async (key: string) => {
  const object = await client().send(
    new GetObjectCommand({ Bucket: environment().S3_BUCKET, Key: key }),
  );

  return object.Body?.transformToWebStream();
};
