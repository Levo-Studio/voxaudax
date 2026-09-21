import "server-only";
import { z } from "zod";

const senderMustNotBeUnattended = (address: string) =>
  !/no-?reply/i.test(address);

const environmentSchema = z.object({
  DATABASE_URL: z.url(),

  S3_ENDPOINT: z.url(),
  S3_ACCESS_KEY_ID: z.string().min(1),
  S3_SECRET_ACCESS_KEY: z.string().min(1),
  S3_BUCKET: z.string().min(1),
  S3_REGION: z.string().min(1),
  S3_FORCE_PATH_STYLE: z
    .enum(["true", "false"])
    .transform((value) => value === "true"),
  CDN_BASE_URL: z.url(),

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
});

const describeFailure = (error: z.ZodError) =>
  error.issues
    .map((issue) => `  ${issue.path.join(".")} — ${issue.message}`)
    .join("\n");

const readEnvironment = () => {
  const result = environmentSchema.safeParse(process.env);

  if (!result.success) {
    throw new Error(
      `Environment is unusable, so the process is stopping before it serves anything:\n${describeFailure(result.error)}\n\nSee .env.example for the keys this application needs.`,
    );
  }

  return result.data;
};

let validatedOnce: z.infer<typeof environmentSchema> | undefined;

export const environment = () => (validatedOnce ??= readEnvironment());

export type Environment = ReturnType<typeof environment>;
