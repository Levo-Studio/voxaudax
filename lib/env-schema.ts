import { z } from "zod";

/**
 * "kein noreply als Absendername" is about the display name, not the mailbox.
 * A verified sending subdomain usually has no inbox at all, so the address may
 * well be noreply@ — what must not happen is a mail that presents itself as
 * unattended. The name has to read as a person or a desk, and lib/mail sets
 * Reply-To to MAIL_TO_EDITORIAL so an answer reaches one.
 */
const displayNameOf = (sender: string) => {
  const angled = /^\s*(.*?)\s*<[^>]+>\s*$/.exec(sender);
  return angled === null ? "" : angled[1].replace(/^"|"$/g, "");
};

const senderMustNotBeUnattended = (sender: string) => {
  const name = displayNameOf(sender);
  return name === "" ? true : !/no-?reply|do-?not-?reply/i.test(name);
};

const isCanonicalBase64Url = (value: string) =>
  /^[A-Za-z0-9_-]+={0,2}$/.test(value) &&
  (value.includes("=") ? value.length % 4 === 0 : true);

const decodedByteLength = (value: string) =>
  Buffer.from(value, "base64url").byteLength;

const namesAKnownTimeZone = (zone: string) => {
  try {
    new Intl.DateTimeFormat("de-DE", { timeZone: zone });
    return true;
  } catch {
    return false;
  }
};

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

  /**
   * Allowed to be empty. Sending is one subsystem, and signing in is not it —
   * demanding a mail key before anyone can log in would make a missing key look
   * like a broken deployment. lib/mail refuses at send time and names it, and
   * the detailed health route reports its absence as degraded rather than down.
   */
  RESEND_API_KEY: z.string(),
  MAIL_FROM: z
    .string()
    .min(1)
    .refine(
      senderMustNotBeUnattended,
      'the display name must not read as unattended; write it as "Vox Audax Redaktion <noreply@mail.voxaudax.de>"',
    ),
  MAIL_TO_EDITORIAL: z.email(),

  /**
   * The proxies in front of this application, as CIDR ranges or plain
   * addresses, separated by commas. Empty — the default — means there is none,
   * and then no `X-Forwarded-For` is believed at all.
   *
   * Behind Traefik this has to name Traefik's own range, or the rate limiter
   * counts every caller into one bucket. It is a topology fact and not a
   * secret, which is why it stands in `.env.example` with a value.
   */
  TRUSTED_PROXIES: z.string().default(""),

  /**
   * @velve/auth reads this as canonical base64url and needs 32 decoded bytes.
   * Measuring the string instead would pass a 32-character value carrying 24
   * bytes of entropy, and `openssl rand -base64 32` — which produces "+", "/"
   * and padding — is rejected outright as root_key_malformed rather than being
   * decoded. Both mistakes are caught here rather than at first sign-in.
   */
  AUTH_SECRET: z
    .string()
    .refine(isCanonicalBase64Url, {
      message:
        'must be canonical base64url. Generate it with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64url\'))"',
    })
    .refine(
      (value) => decodedByteLength(value) >= 32,
      "must decode to at least 32 bytes; @velve/auth refuses to start below that",
    ),
  HEALTH_TOKEN: z.string().min(32),

  NEXT_PUBLIC_SITE_URL: z.url(),

  /**
   * Articles are scheduled to the minute ("18.09.2026, 07:00") and read by
   * people in one place, so the server must not decide what that means from
   * whatever the container's clock happens to be set to. It also becomes the
   * zone of every database session, so a name the zone database does not know
   * would take the connections down with it rather than quietly falling back.
   */
  TZ: z
    .string()
    .min(1)
    .refine(namesAKnownTimeZone, "must name a time zone, such as Europe/Berlin"),
});
