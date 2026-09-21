import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { Client } from "pg";

import { environmentSchema } from "../lib/env-schema.ts";

/**
 * Answers whether each dependency is reachable with the credentials this
 * process was given, and says nothing else. No value from the environment is
 * ever printed — not a host, not a bucket, not a key — because the whole point
 * of running this is to check secrets, and a check that echoes them back is a
 * worse leak than the problem it diagnoses.
 *
 * Run it as: node --env-file=.env scripts/check-connections.mts
 */

type Outcome = { name: string; ok: boolean; detail: string };

const describe = (cause: unknown) => {
  const code = (cause as { code?: unknown; name?: unknown } | null)?.code;
  if (typeof code === "string") return code;
  const name = (cause as { name?: unknown } | null)?.name;
  return typeof name === "string" ? name : "failed";
};

const checkEnvironment = (): Outcome => {
  const result = environmentSchema.safeParse(process.env);
  return result.success
    ? { name: "environment", ok: true, detail: "every key present and valid" }
    : {
        name: "environment",
        ok: false,
        detail: result.error.issues
          .map((issue) => `${issue.path.join(".")} (${issue.message})`)
          .join(", "),
      };
};

const checkDatabase = async (url: string): Promise<Outcome> => {
  const client = new Client({
    connectionString: url,
    connectionTimeoutMillis: 5_000,
  });
  client.on("error", () => undefined);

  try {
    await client.connect();
    const { rows } = await client.query<{ version: string }>(
      "select version() as version",
    );
    const server = rows[0].version.split(" ").slice(0, 2).join(" ");
    const { rows: writable } = await client.query<{ can: boolean }>(
      "select not pg_is_in_recovery() as can",
    );
    return {
      name: "database",
      ok: true,
      detail: `${server}, ${writable[0].can ? "writable" : "read-only replica"}`,
    };
  } catch (cause) {
    return { name: "database", ok: false, detail: describe(cause) };
  } finally {
    await client.end().catch(() => undefined);
  }
};

const checkObjectStorage = async (
  endpoint: string,
  bucket: string,
  region: string,
  forcePathStyle: boolean,
  accessKeyId: string,
  secretAccessKey: string,
): Promise<Outcome> => {
  const s3 = new S3Client({
    endpoint,
    region,
    forcePathStyle,
    credentials: { accessKeyId, secretAccessKey },
  });

  try {
    await s3.send(new HeadBucketCommand({ Bucket: bucket }));
    return { name: "object storage", ok: true, detail: "bucket reachable" };
  } catch (cause) {
    return { name: "object storage", ok: false, detail: describe(cause) };
  } finally {
    s3.destroy();
  }
};

/**
 * Reaching the bucket proves nothing about being allowed to write to it, and
 * the whole upload path depends on that. Opt-in, because it puts an object in
 * someone's bucket; it removes it again and fails loudly if it cannot.
 */
const checkObjectRoundTrip = async (
  endpoint: string,
  bucket: string,
  region: string,
  forcePathStyle: boolean,
  accessKeyId: string,
  secretAccessKey: string,
): Promise<Outcome> => {
  const s3 = new S3Client({
    endpoint,
    region,
    forcePathStyle,
    credentials: { accessKeyId, secretAccessKey },
  });
  const key = `.probe/${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const written = "voxaudax connection probe";
  const done: string[] = [];

  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: written,
        ContentType: "text/plain",
      }),
    );
    done.push("put");

    const read = await s3.send(
      new GetObjectCommand({ Bucket: bucket, Key: key }),
    );
    const body = await read.Body?.transformToString();
    if (body !== written) throw new Error("what came back is not what went in");
    done.push("get");

    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    done.push("delete");

    return { name: "storage write", ok: true, detail: done.join(", ") };
  } catch (cause) {
    await s3
      .send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
      .catch(() => undefined);
    return {
      name: "storage write",
      ok: false,
      detail: `${describe(cause)} after ${done.join(", ") || "nothing"}`,
    };
  } finally {
    s3.destroy();
  }
};

/**
 * Each dependency is checked from the raw variables it needs, not from a fully
 * validated environment: an unusable mail key must not stop the database from
 * being reachable, or this reports nothing on the day it is most needed.
 */
const required = (key: string) => {
  const value = process.env[key];
  if (value === undefined || value === "") {
    throw new Error(`${key} is not set`);
  }
  return value;
};

const main = async () => {
  const outcomes: Outcome[] = [checkEnvironment()];

  try {
    const env = {
      DATABASE_URL: required("DATABASE_URL"),
      S3_ENDPOINT: required("S3_ENDPOINT"),
      S3_BUCKET: required("S3_BUCKET"),
      S3_REGION: required("S3_REGION"),
      S3_FORCE_PATH_STYLE: process.env.S3_FORCE_PATH_STYLE === "true",
      S3_ACCESS_KEY_ID: required("S3_ACCESS_KEY_ID"),
      S3_SECRET_ACCESS_KEY: required("S3_SECRET_ACCESS_KEY"),
      RESEND_API_KEY: process.env.RESEND_API_KEY ?? "",
    };
    outcomes.push(await checkDatabase(env.DATABASE_URL));
    outcomes.push(
      await checkObjectStorage(
        env.S3_ENDPOINT,
        env.S3_BUCKET,
        env.S3_REGION,
        env.S3_FORCE_PATH_STYLE,
        env.S3_ACCESS_KEY_ID,
        env.S3_SECRET_ACCESS_KEY,
      ),
    );
    if (process.argv.includes("--write")) {
      outcomes.push(
        await checkObjectRoundTrip(
          env.S3_ENDPOINT,
          env.S3_BUCKET,
          env.S3_REGION,
          env.S3_FORCE_PATH_STYLE,
          env.S3_ACCESS_KEY_ID,
          env.S3_SECRET_ACCESS_KEY,
        ),
      );
    }

    outcomes.push({
      name: "mail",
      ok: env.RESEND_API_KEY.length > 0,
      detail: env.RESEND_API_KEY.length > 0 ? "key present" : "no key yet",
    });
  } catch (cause) {
    outcomes.push({
      name: "connectivity",
      ok: false,
      detail: cause instanceof Error ? cause.message : "unusable",
    });
  }

  for (const outcome of outcomes) {
    console.log(`${outcome.ok ? "ok  " : "FAIL"}  ${outcome.name.padEnd(15)} ${outcome.detail}`);
  }

  if (outcomes.some((outcome) => !outcome.ok)) process.exit(1);
};

main().catch((cause: unknown) => {
  console.error(cause instanceof Error ? cause.message : cause);
  process.exit(1);
});
