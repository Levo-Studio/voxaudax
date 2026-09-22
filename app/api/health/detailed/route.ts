import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import { databaseCheck } from "@/lib/checks/database";
import { mailCheck } from "@/lib/checks/mail";
import { migrationsCheck } from "@/lib/checks/migrations";
import { storageCheck } from "@/lib/checks/storage";
import { httpStatusFor, inspectDependencies } from "@/lib/health";
import { SERVICE_NAME, nowAsIso8601 } from "@/lib/service-identity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Everything the running service depends on and cannot see for itself. Storage
 * and the migration state joined the list because their absence looked exactly
 * like health: a bucket that was gone left every picture broken while this
 * route answered `ok`, and a database a release had outrun answered `select 1`
 * happily while the back office was refusing every page.
 */
const DEPENDENCIES = [databaseCheck, migrationsCheck, storageCheck, mailCheck];

/**
 * Read directly rather than through the validated environment, so that the one
 * endpoint you reach for when a deployment is broken is not itself disabled by
 * an unrelated variable being wrong.
 */
const configuredHealthToken = () => {
  const token = process.env.HEALTH_TOKEN;
  return token !== undefined && token.length > 0 ? token : null;
};

/**
 * Digests first so both sides are 32 bytes: comparing the raw strings would
 * need a length guard, and a short-circuiting guard discloses how long the
 * token is, which is the one thing that makes guessing it tractable.
 */
const matchesHealthToken = (presented: string, expected: string) => {
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(presented), digest(expected));
};

/** RFC 7235 makes the auth-scheme case-insensitive; agents do vary it. */
const bearerTokenOf = (request: Request) => {
  const header = request.headers.get("authorization");
  if (header === null) return null;

  const separator = header.indexOf(" ");
  if (separator === -1) return null;
  if (header.slice(0, separator).toLowerCase() !== "bearer") return null;

  return header.slice(separator + 1).trim() || null;
};

const unauthorized = () =>
  new NextResponse(null, {
    status: 401,
    headers: { "www-authenticate": "Bearer", "cache-control": "no-store" },
  });

/**
 * Reports what each dependency is doing, so it is guarded: the answer names
 * which part of the infrastructure is unwell and how slow it is.
 */
export async function GET(request: Request) {
  const expected = configuredHealthToken();

  if (expected === null) {
    console.error("HEALTH_TOKEN is not set, so the detailed health route is closed.");
    return new NextResponse(null, {
      status: 503,
      headers: { "cache-control": "no-store" },
    });
  }

  const presented = bearerTokenOf(request);

  if (presented === null || !matchesHealthToken(presented, expected)) {
    return unauthorized();
  }

  const report = await inspectDependencies(DEPENDENCIES);

  return NextResponse.json(
    {
      status: report.status,
      service: SERVICE_NAME,
      timestamp: nowAsIso8601(),
      uptime: Math.round(process.uptime()),
      checks: report.checks,
    },
    {
      status: httpStatusFor(report.status),
      headers: { "cache-control": "no-store" },
    },
  );
}
