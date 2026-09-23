import "server-only";
import { cookies, headers } from "next/headers";

import { velveAuth } from "@/lib/auth";
import { clientAddress, parseTrustedProxies } from "@/lib/client-address";
import { environment } from "@/lib/env";

/**
 * The attributes @velve/auth writes itself when its own HTTP handler answers.
 * That handler is not mounted: the back office calls the server methods, which
 * return the token rather than setting a cookie, so this module is the only
 * thing that reads or writes one and the name is ours to choose.
 *
 * Development drops the `__Host-` prefix and `Secure`, because WebKit refuses
 * such a cookie over plain http — localhost included, measured against the
 * engine rather than assumed — and a session that is never stored ends the
 * moment the response that set it is over. Production is https and keeps both:
 * the prefix is what pins the cookie to this exact host and path, and it is
 * worth more there than the convenience is here.
 */
const HTTPS_ONLY = process.env.NODE_ENV === "production";

const SESSION_COOKIE = HTTPS_ONLY ? "__Host-velve_session" : "velve_session";

const COOKIE_ATTRIBUTES = {
  httpOnly: true,
  secure: HTTPS_ONLY,
  sameSite: "lax",
  path: "/",
} as const;

export const readSessionToken = async () =>
  (await cookies()).get(SESSION_COOKIE)?.value;

/**
 * "Angemeldet bleiben" on screen 7a decides how long the browser keeps the
 * token, not how long the session lives: `"session"` writes no Max-Age, so the
 * cookie goes when the browser closes while the row keeps its own deadlines.
 */
export const writeSessionToken = async (
  token: string,
  lifetime: number | "session",
) => {
  (await cookies()).set(SESSION_COOKIE, token, {
    ...COOKIE_ATTRIBUTES,
    ...(lifetime === "session" ? {} : { maxAge: lifetime }),
  });
};

export const clearSessionToken = async () => {
  (await cookies()).set(SESSION_COOKIE, "", {
    ...COOKIE_ATTRIBUTES,
    maxAge: 0,
  });
};

/**
 * The six fields every server method takes beside its own input.
 *
 * `origin` is required and not optional, and a state-changing call must hand
 * over the browser's own `Origin` header so that the library's check does the
 * work it exists for. A page render is a top-level navigation and carries no
 * such header; refusing to resolve a session there would lock every page out,
 * so a read falls back to this installation's own origin — which is a statement
 * about the request being a render, not a permission granted to a caller.
 */
export const callFields = async (kind: "render" | "mutation") => {
  const header = await headers();
  const origin = header.get("origin");

  if (kind === "mutation" && origin === null) {
    throw new Error("A state-changing call arrived without an Origin header.");
  }

  return {
    origin: origin ?? new URL(environment().NEXT_PUBLIC_SITE_URL).origin,
    // Not the raw header. It is a list, and it is written by whoever is
    // calling unless a proxy in front is named — `lib/client-address` has the
    // whole of why.
    ipAddress: clientAddress(
      header.get("x-forwarded-for"),
      parseTrustedProxies(environment().TRUSTED_PROXIES),
    ),
    userAgent: header.get("user-agent"),
  };
};

/**
 * A disabled account is not an error this application has anything to say
 * about: the library refuses to resolve the session, and the answer the back
 * office wants is that there is nobody signed in — `requireMember` then sends
 * the browser to the login. Uncaught, it turned every page into a 500 the
 * moment an account was switched off.
 *
 * Only that one code is swallowed. Anything else is a real failure and stays
 * one, because a login screen is a bad way to report a broken database.
 */
export const resolveSession = async () => {
  const sessionToken = await readSessionToken();
  if (sessionToken === undefined) return null;

  try {
    return await velveAuth().session.resolve({
      sessionToken,
      ...(await callFields("render")),
    });
  } catch (cause) {
    if ((cause as { code?: unknown }).code === "account_disabled") return null;
    throw cause;
  }
};
