import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Emits a RustFS policy document scoped to one bucket, plus a credential pair
 * to attach it to.
 *
 * The envelope is the one the RustFS console shows — `ID`, an empty `Sid`, an
 * empty `Condition` — so the output can be pasted straight in. What it drops
 * from the built-in admin policy is `admin:*`, `kms:*` and `sts:AssumeRole`:
 * those are server-wide and take no resource, so there is no version of them
 * that reaches only one bucket.
 *
 * Scoped to the bucket rather than to a prefix on purpose: RustFS has an open
 * report of prefix-conditioned policies answering 403 even when the ListBucket
 * condition and the object ARNs agree (rustfs/rustfs#1399).
 */

const S3_ARN_PREFIX = "arn:aws:s3:::";

type Role = "full" | "app" | "readonly";

const ACTIONS_BY_ROLE: Record<Role, string[]> = {
  /** Everything S3 can do, but only inside this bucket. */
  full: ["s3:*"],
  /**
   * What the application actually does: hand out a presigned PUT, read an
   * original back to derive the WebP variants, delete what an editor removed,
   * and whatever handshake the SDK performs.
   */
  app: [
    "s3:GetBucketLocation",
    "s3:ListBucket",
    "s3:GetObject",
    "s3:PutObject",
    "s3:DeleteObject",
  ],
  /** For whatever only serves the files, such as the content delivery host. */
  readonly: ["s3:GetBucketLocation", "s3:ListBucket", "s3:GetObject"],
};

const buildPolicy = (bucket: string, role: Role) => ({
  ID: "",
  Version: "2012-10-17",
  Statement: [
    {
      Sid: "",
      Effect: "Allow",
      Action: ACTIONS_BY_ROLE[role],
      Resource: [`${S3_ARN_PREFIX}${bucket}`, `${S3_ARN_PREFIX}${bucket}/*`],
      Condition: {},
    },
  ],
});

/** Upper-case alphanumerics, the shape S3 tooling expects of a key id. */
const generateAccessKeyId = () => {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  return Array.from(
    randomBytes(20),
    (byte) => alphabet[byte % alphabet.length],
  ).join("");
};

/** 32 bytes, base64url so it survives an .env file without quoting. */
const generateSecretAccessKey = () => randomBytes(32).toString("base64url");

const readOption = (name: string, fallback: string) => {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return fallback;

  const value = process.argv[index + 1];
  if (value === undefined || value.startsWith("--")) {
    throw new Error(`--${name} needs a value`);
  }
  return value;
};

const isRole = (value: string): value is Role =>
  value === "full" || value === "app" || value === "readonly";

const main = async () => {
  const bucket = readOption("bucket", "voxaudax");
  const role = readOption("role", "full");
  const outputDirectory = readOption("out", "");

  if (!isRole(role)) {
    throw new Error(`--role must be full, app or readonly, got "${role}"`);
  }

  const policyName = `${bucket}-${role}`;
  const policyJson = `${JSON.stringify(buildPolicy(bucket, role), null, 2)}\n`;

  if (outputDirectory !== "") {
    await mkdir(outputDirectory, { recursive: true });
    const policyPath = join(outputDirectory, `${policyName}.json`);
    await writeFile(policyPath, policyJson, { mode: 0o600 });
    console.error(`Policy written to ${policyPath}`);
  }

  process.stdout.write(policyJson);

  console.error(`\n# Policy name: ${policyName}`);
  console.error("# Credentials — keep these in a password manager, not a file");
  console.error(`S3_ACCESS_KEY_ID=${generateAccessKeyId()}`);
  console.error(`S3_SECRET_ACCESS_KEY=${generateSecretAccessKey()}`);
  console.error(
    `\n# In RustFS: create bucket "${bucket}", add the policy above under the`,
  );
  console.error(
    `# name "${policyName}", add a user with those credentials, attach it.`,
  );
  console.error(
    "# Do not also attach a built-in policy such as readwrite — those reach every bucket.",
  );
};

main().catch((cause: unknown) => {
  console.error(cause instanceof Error ? cause.message : cause);
  process.exit(1);
});
