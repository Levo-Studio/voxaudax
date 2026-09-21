import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import { databaseCheck } from "@/lib/checks/database";
import { environment } from "@/lib/env";
import { httpStatusFor, inspectDependencies } from "@/lib/health";
import { SERVICE_NAME, nowAsIso8601 } from "@/lib/service-identity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEPENDENCIES = [databaseCheck];

const matchesHealthToken = (presented: string, expected: string) => {
  const presentedBytes = Buffer.from(presented);
  const expectedBytes = Buffer.from(expected);

  return (
    presentedBytes.length === expectedBytes.length &&
    timingSafeEqual(presentedBytes, expectedBytes)
  );
};

const bearerTokenOf = (request: Request) => {
  const header = request.headers.get("authorization") ?? "";
  return header.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
};

/**
 * Reports what each dependency is doing, so it is guarded: the answer names
 * which part of the infrastructure is unwell and how slow it is.
 */
export async function GET(request: Request) {
  const presented = bearerTokenOf(request);

  if (
    presented === null ||
    !matchesHealthToken(presented, environment().HEALTH_TOKEN)
  ) {
    return new NextResponse(null, {
      status: 401,
      headers: { "www-authenticate": "Bearer", "cache-control": "no-store" },
    });
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
