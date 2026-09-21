import { NextResponse } from "next/server";

import { SERVICE_NAME, nowAsIso8601 } from "@/lib/service-identity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Answers "is this container alive", and nothing else. It touches no
 * dependency, so it keeps answering 200 while the database or the object
 * storage is down — that is what the container health check needs to know.
 *
 * Deliberately carries no version, commit or environment name: this route is
 * public.
 */
export function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: SERVICE_NAME,
      timestamp: nowAsIso8601(),
    },
    { headers: { "cache-control": "no-store" } },
  );
}
