import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Builds a least-privilege RustFS policy for one bucket, and a credential pair
 * to attach it to.
 *
 * Scoped to the whole bucket rather than to a prefix on purpose: RustFS has an
 * open report of prefix-conditioned policies answering 403 even when the
 * ListBucket condition and the object ARNs agree (rustfs/rustfs#1399). A bucket
 * that holds nothing but this project's objects does not need the prefix to be
 * the security boundary, and a boundary that might silently fail closed is
 * worse than one that is simply coarser.
 */

const S3_ARN_PREFIX = "arn:aws:s3:::";

type Role = "app" | "readonly";

/**
 * What the application genuinely does: hand out a presigned PUT, read an
 * original back to derive the WebP variants, drop an object when an editor
 * deletes a meme or replaces a cover, and whatever handshake the SDK performs.
 * Anything absent here — creating buckets, editing policies, configuring
 * versioning — is denied by omission.
 */
const ACTIONS_BY_ROLE: Record<Role, { onBucket: string[]; onObjects: string[] }> = {
  app: {
    onBucket: ["s3:GetBucketLocation", "s3:ListBucket"],
    onObjects: ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
  },
  readonly: {
    onBucket: ["s3:GetBucketLocation", "s3:ListBucket"],
    onObjects: ["s3:GetObject"],
  },
};

const buildPolicy = (bucket: string, role: Role) => {
  const { onBucket, onObjects } = ACTIONS_BY_ROLE[role];

  return {
    Version: "2012-10-17",
    Statement: [
      {
        Sid: "BucketLevel",
        Effect: "Allow",
        Action: onBucket,
        Resource: [`${S3_ARN_PREFIX}${bucket}`],
      },
      {
        Sid: "ObjectLevel",
        Effect: "Allow",
        Action: onObjects,
        Resource: [`${S3_ARN_PREFIX}${bucket}/*`],
      },
    ],
  };
};

/** Upper-case alphanumerics, the shape S3 tooling expects of a key id. */
const generateAccessKeyId = () => {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const bytes = randomBytes(20);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
};

/** 32 bytes, base64url so it survives an .env file without quoting. */
const generateSecretAccessKey = () => randomBytes(32).toString("base64url");

const readOption = (name: string, fallback: string) => {
  const flag = `--${name}`;
  const index = process.argv.indexOf(flag);
  if (index === -1) return fallback;

  const value = process.argv[index + 1];
  if (value === undefined || value.startsWith("--")) {
    throw new Error(`${flag} needs a value`);
  }
  return value;
};

const isRole = (value: string): value is Role =>
  value === "app" || value === "readonly";

const main = async () => {
  const bucket = readOption("bucket", "voxaudax");
  const role = readOption("role", "app");
  const outputDirectory = readOption("out", "");

  if (!isRole(role)) {
    throw new Error(`--role must be "app" or "readonly", got "${role}"`);
  }

  const policyName = `${bucket}-${role}`;
  const policy = buildPolicy(bucket, role);
  const accessKeyId = generateAccessKeyId();
  const secretAccessKey = generateSecretAccessKey();
  const policyJson = `${JSON.stringify(policy, null, 2)}\n`;

  if (outputDirectory !== "") {
    await mkdir(outputDirectory, { recursive: true });
    const policyPath = join(outputDirectory, `${policyName}.policy.json`);
    await writeFile(policyPath, policyJson, { mode: 0o600 });
    console.log(`Policy written to ${policyPath}`);
    console.log(
      "The credentials are printed below and deliberately not written to disk.\n",
    );
  }

  console.log(`# Policy "${policyName}" — bucket ${bucket}, role ${role}`);
  console.log(policyJson);

  console.log("# Credentials — store these in a password manager, not in a file");
  console.log(`S3_ACCESS_KEY_ID=${accessKeyId}`);
  console.log(`S3_SECRET_ACCESS_KEY=${secretAccessKey}`);
  console.log();

  console.log("# In RustFS, in this order:");
  console.log(`#   1. create the bucket "${bucket}" if it does not exist`);
  console.log(`#   2. add a policy named "${policyName}" with the JSON above`);
  console.log("#   3. add a user with the access key and secret above");
  console.log(`#   4. attach "${policyName}" to that user`);
  console.log(
    "#      Console, or the admin API: add-user, then set-user-or-group-policy.",
  );
  console.log(
    `#   Do not also attach a built-in policy such as readwrite — it grants every bucket.`,
  );
};

main().catch((cause: unknown) => {
  console.error(cause instanceof Error ? cause.message : cause);
  process.exit(1);
});
