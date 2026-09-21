"use server";

import { z } from "zod";

import { CONCERNS, type ContactState } from "@/lib/contact";
import { environment } from "@/lib/env";
import { sendEditorialMessage } from "@/lib/mail";

const submission = z.object({
  name: z.string().trim().min(2, "Bitte einen Namen angeben."),
  role: z.string().trim().max(80).default(""),
  email: z.email("Diese E-Mail-Adresse stimmt nicht."),
  concern: z.enum(CONCERNS),
  message: z.string().trim().min(10, "Bitte schreib etwas mehr dazu."),
  consent: z.literal("on", {
    error: "Ohne die Kenntnisnahme dürfen wir die Angaben nicht verarbeiten.",
  }),
  /** Filled in only by something that fills in every field it finds. */
  website: z.literal(""),
});

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
