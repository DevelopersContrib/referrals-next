/**
 * Lightweight in-memory rate limiter.
 *
 * NOTE: state lives in the process, so on serverless (per-instance, cold
 * starts) this is best-effort defense-in-depth, not a hard guarantee. It
 * meaningfully raises the cost of brute-force / abuse from a single source
 * without external infra. For strict, cross-instance limits, back this with
 * Redis/Upstash. All calls fail OPEN — a limiter bug must never block traffic.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

function prune(now: number) {
  // Keep memory bounded; only runs when the map grows large.
  if (buckets.size < 5000) return;
  for (const [key, b] of buckets) {
    if (now > b.resetAt) buckets.delete(key);
  }
}

/**
 * Returns true if the request is allowed, false if it exceeds `limit`
 * within `windowMs`. Fails open on any unexpected error.
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  try {
    const now = Date.now();
    const existing = buckets.get(key);

    if (!existing || now > existing.resetAt) {
      prune(now);
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }

    existing.count += 1;
    return existing.count <= limit;
  } catch {
    return true;
  }
}

/** Best-effort client IP from proxy headers. */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") || "unknown";
}
