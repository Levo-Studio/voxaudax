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
