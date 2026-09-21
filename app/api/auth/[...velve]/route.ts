import { toWebHandler } from "@velve/auth/http";

import { velveAuth } from "@/lib/auth";

const BASE_PATH = "/api/auth";

/**
 * Accounts are created behind an admin invitation and nowhere else, so the two
 * routes that would open one answer as if they did not exist. 404 rather than
 * 403: a refusal that names the route still tells a caller it is there.
 */
const UNREACHABLE = new Set(["/sign-up", "/sign-up/passwordless"]);

let handler: ((request: Request) => Promise<Response>) | undefined;

const handle = async (request: Request) => {
  const { pathname } = new URL(request.url);
  const route = pathname.slice(BASE_PATH.length).replace(/\/+$/, "");

  if (UNREACHABLE.has(route)) return new Response(null, { status: 404 });

  handler ??= toWebHandler(velveAuth(), { basePath: BASE_PATH });
  return handler(request);
};

export const GET = handle;
export const POST = handle;
