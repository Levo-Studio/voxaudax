import "server-only";
import { cookies, headers } from "next/headers";

import { velveAuth } from "@/lib/auth";
import { environment } from "@/lib/env";

/**
 * The name and the attributes @velve/auth writes itself when its own HTTP
 * handler answers. That handler is not mounted: the back office calls the
 * server methods, which return the token rather than setting a cookie, so this
 * module is the only thing that writes a session cookie. The name is still the
 * library's own, so a token this file wrote is a token the library reads.
 */
const SESSION_COOKIE = "__Host-velve_session";

const COOKIE_ATTRIBUTES = {
  httpOnly: true,
  secure: true,
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
    ipAddress: header.get("x-forwarded-for"),
    userAgent: header.get("user-agent"),
  };
};

export const resolveSession = async () => {
  const sessionToken = await readSessionToken();
  if (sessionToken === undefined) return null;

  return velveAuth().session.resolve({
    sessionToken,
    ...(await callFields("render")),
  });
};
