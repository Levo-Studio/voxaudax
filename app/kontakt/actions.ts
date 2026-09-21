"use server";

import { z } from "zod";

import {
  CONCERNS,
  MAX_EMAIL_LENGTH,
  MAX_MESSAGE_LENGTH,
  MAX_NAME_LENGTH,
  MAX_ROLE_LENGTH,
  type ContactState,
} from "@/lib/contact";
import { environment } from "@/lib/env";
import { sendEditorialMessage } from "@/lib/mail";
import { rateLimiter } from "@/lib/rate-limit";

const submission = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Bitte einen Namen angeben.")
    .max(MAX_NAME_LENGTH, "Der Name ist zu lang."),
  role: z.string().trim().max(MAX_ROLE_LENGTH).default(""),
  email: z
    .email("Diese E-Mail-Adresse stimmt nicht.")
    .max(MAX_EMAIL_LENGTH, "Diese E-Mail-Adresse stimmt nicht."),
  concern: z.enum(CONCERNS),
  message: z
    .string()
    .trim()
    .min(10, "Bitte schreib etwas mehr dazu.")
    .max(MAX_MESSAGE_LENGTH, "Die Nachricht ist zu lang für dieses Formular."),
  consent: z.literal("on", {
    error: "Ohne die Kenntnisnahme dürfen wir die Angaben nicht verarbeiten.",
  }),
  /** Filled in only by something that fills in every field it finds. */
  website: z.literal(""),
});

/**
 * Three messages from one address, and one of the three back every ten minutes.
 * The honeypot above turns away whatever fills in every field it finds; this is
 * what stands between the rest and an unmetered relay to the editorial inbox.
 * It is held on the process scope because development reloads this module on
 * every edit, and a limiter that forgot everything each time would not be one.
 */
const processScope = globalThis as typeof globalThis & {
  voxAudaxContactLimit?: ReturnType<typeof rateLimiter>;
};

const withinAllowance = (processScope.voxAudaxContactLimit ??= rateLimiter({
  capacity: 3,
  refillMs: 10 * 60 * 1_000,
}));

const mailtoFallback = (
  subject: string,
  name: string,
  role: string,
  body: string,
) => {
  const to = environment().MAIL_TO_EDITORIAL;
  const lines = [
    role.length === 0 ? `Name: ${name}` : `Name: ${name} (${role})`,
    "",
    body,
  ].join("\n");

  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines)}`;
};

export const submitContactMessage = async (
  _previous: ContactState,
  form: FormData,
): Promise<ContactState> => {
  const parsed = submission.safeParse({
    name: form.get("name") ?? "",
    role: form.get("role") ?? "",
    email: form.get("email") ?? "",
    concern: form.get("concern") ?? "",
    message: form.get("message") ?? "",
    consent: form.get("consent") ?? "",
    website: form.get("website") ?? "",
  });

  if (!parsed.success) {
    return {
      status: "invalid",
      problems: parsed.error.issues.map((issue) => issue.message),
    };
  }

  const { name, role, email, concern, message } = parsed.data;

  if (!withinAllowance(email.toLowerCase()).allowed) {
    return {
      status: "throttled",
      problems: [],
      fallback: mailtoFallback(concern, name, role, message),
    };
  }

  const outcome = await sendEditorialMessage({
    name,
    role,
    email,
    subject: concern,
    body: message,
  });

  if (outcome.sent) return { status: "sent", problems: [] };

  return {
    status: outcome.reason,
    problems: [],
    fallback: mailtoFallback(concern, name, role, message),
  };
};
