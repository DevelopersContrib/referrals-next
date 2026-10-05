const INFRA =
  /prisma|P1001|P2024|P2028|rds\.amazonaws|Can't reach database|connection pool|ECONNREFUSED|ETIMEDOUT|:3306|datasource/i;

/** Log the real error. Callers send only `fallback` to the browser. */
export function logServerError(scope: string, err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`[${scope}]`, msg);
}

export function isInfraError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err ?? "");
  return INFRA.test(msg);
}

/**
 * Domain errors (validation, not found) may pass through.
 * Database and driver errors never do.
 */
export function clientSafeMessage(
  err: unknown,
  fallback = "This step couldn't finish",
): string {
  logServerError("api", err);
  if (isInfraError(err)) return fallback;
  const msg = err instanceof Error ? err.message.trim() : "";
  if (!msg || msg.length > 240) return fallback;
  return msg;
}
