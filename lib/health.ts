import "server-only";

const CHECK_TIMEOUT_MS = 2_000;

export type CheckStatus = "ok" | "degraded" | "error";

/** What a check reports about itself, before timing is added. */
export type CheckObservation = {
  status: CheckStatus;
  error?: string;
} & Record<string, unknown>;

export type CheckResult = CheckObservation & { latencyMs: number };

export type DependencyCheck = {
  name: string;
  /** A failing critical check makes the whole service report `error`. */
  critical: boolean;
  inspect: () => Promise<CheckObservation>;
};

class CheckTimeout extends Error {}

/**
 * Driver messages carry hosts, ports and sometimes credentials
 * ("connect ECONNREFUSED 10.0.0.4:5432"), and this endpoint must not hand those
 * out. So nothing thrown is ever echoed: a failure is classified into one of a
 * fixed set of phrases, and anything unrecognised reports nothing at all.
 */
const classifyFailure = (cause: unknown): string => {
  if (cause instanceof CheckTimeout) return "timed out";

  // node-postgres reports its own connect timeout with this message and no code.
  if (cause instanceof Error && cause.message === "timeout expired") {
    return "connection timed out";
  }

  const code = (cause as { code?: unknown } | null)?.code;

  switch (typeof code === "string" ? code : "") {
    case "ECONNREFUSED":
      return "connection refused";
    case "ENOTFOUND":
    case "EAI_AGAIN":
      return "host not resolvable";
    case "ETIMEDOUT":
    case "ECONNRESET":
      return "connection timed out";
    case "28P01":
    case "28000":
      return "authentication failed";
    case "3D000":
      return "database does not exist";
    case "AccessDenied":
    case "InvalidAccessKeyId":
    case "SignatureDoesNotMatch":
      return "access denied";
    case "NoSuchBucket":
      return "bucket does not exist";
    default:
      return "check failed";
  }
};

const timeoutAfterTwoSeconds = () =>
  new Promise<never>((_, reject) => {
    setTimeout(
      () => reject(new CheckTimeout()),
      CHECK_TIMEOUT_MS,
    ).unref?.();
  });

const runOneCheck = async (check: DependencyCheck): Promise<CheckResult> => {
  const startedAt = performance.now();

  try {
    const outcome = await Promise.race([
      check.inspect(),
      timeoutAfterTwoSeconds(),
    ]);
    return { ...outcome, latencyMs: Math.round(performance.now() - startedAt) };
  } catch (cause) {
    return {
      status: check.critical ? "error" : "degraded",
      latencyMs: Math.round(performance.now() - startedAt),
      error: classifyFailure(cause),
    };
  }
};

const worstOf = (results: readonly CheckResult[]): CheckStatus => {
  if (results.some((result) => result.status === "error")) return "error";
  if (results.some((result) => result.status === "degraded")) return "degraded";
  return "ok";
};

export type HealthReport = {
  status: CheckStatus;
  checks: Record<string, CheckResult>;
};

export const inspectDependencies = async (
  checks: readonly DependencyCheck[],
): Promise<HealthReport> => {
  const results = await Promise.all(checks.map(runOneCheck));

  return {
    status: worstOf(results),
    checks: Object.fromEntries(
      checks.map((check, index) => [check.name, results[index]]),
    ),
  };
};

/** `degraded` still serves traffic; only `error` takes the instance out. */
export const httpStatusFor = (status: CheckStatus) =>
  status === "error" ? 503 : 200;
