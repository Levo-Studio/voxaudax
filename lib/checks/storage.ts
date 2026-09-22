import "server-only";
import { HeadBucketCommand, S3Client } from "@aws-sdk/client-s3";

import { environment } from "@/lib/env";
import type { DependencyCheck } from "@/lib/health";

/** Below the two second race in lib/health.ts, so the check ends itself. */
const STORAGE_DEADLINE_MS = 1_500;

/**
 * Not critical: an article without its pictures is still an article, and taking
 * the instance out of rotation over the bucket would cost readers the text as
 * well. What a failure does cost is every image on the memes page and in the
 * articles, and every upload in the back office — so it has to be reported.
 *
 * A client of its own rather than the one in lib/storage: that one waits two
 * seconds for a connection and ten for an answer, which is right for serving a
 * reader and longer than this endpoint's own deadline. `HeadBucket` asks the
 * one question worth asking here — is the bucket there and are these
 * credentials good for it — and transfers nothing.
 */
export const storageCheck: DependencyCheck = {
  name: "storage",
  critical: false,
  inspect: async () => {
    const client = new S3Client({
      endpoint: environment().S3_ENDPOINT,
      region: environment().S3_REGION,
      forcePathStyle: environment().S3_FORCE_PATH_STYLE,
      credentials: {
        accessKeyId: environment().S3_ACCESS_KEY_ID,
        secretAccessKey: environment().S3_SECRET_ACCESS_KEY,
      },
      maxAttempts: 1,
      requestHandler: {
        connectionTimeout: STORAGE_DEADLINE_MS,
        requestTimeout: STORAGE_DEADLINE_MS,
        throwOnRequestTimeout: true,
      },
    });

    try {
      await client.send(new HeadBucketCommand({ Bucket: environment().S3_BUCKET }));
      return { status: "ok" };
    } finally {
      client.destroy();
    }
  },
};
