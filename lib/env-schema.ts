import { z } from "zod";

const senderMustNotBeUnattended = (address: string) =>
  !/no-?reply/i.test(address);

export const environmentSchema = z.object({
  DATABASE_URL: z.url(),

  /**
   * The object storage API. Reached only from the server: nothing in the bucket
   * is public, so this host never appears in markup, in a redirect or in a
   * signed URL handed to a browser.
   */
  S3_ENDPOINT: z.url(),
  S3_ACCESS_KEY_ID: z.string().min(1),
  S3_SECRET_ACCESS_KEY: z.string().min(1),
  S3_BUCKET: z.string().min(1),
  S3_REGION: z.string().min(1),
  S3_FORCE_PATH_STYLE: z
    .enum(["true", "false"])
    .transform((value) => value === "true"),

  RESEND_API_KEY: z.string().min(1),
  MAIL_FROM: z
    .string()
    .min(1)
    .refine(
      senderMustNotBeUnattended,
      "must not be a noreply address — replies go to a person",
    ),
  MAIL_TO_EDITORIAL: z.email(),

  AUTH_SECRET: z
    .string()
    .refine(
      (value) => Buffer.byteLength(value, "utf8") >= 32,
      "must be at least 32 bytes; @velve/auth refuses to start below that",
    ),
  HEALTH_TOKEN: z.string().min(32),

  NEXT_PUBLIC_SITE_URL: z.url(),

  /**
   * Articles are scheduled to the minute ("18.09.2026, 07:00") and read by
   * people in one place, so the server must not decide what that means from
   * whatever the container's clock happens to be set to.
   */
  TZ: z.string().min(1),
});
