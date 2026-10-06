import type { ModuleName } from "./types";

/** Origin for serverless module fan-out (separate invocation per step). */
export function analysisFanoutOrigin(): string | null {
  const explicit = (
    process.env.ANALYSIS_FANOUT_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    ""
  ).trim();
  if (explicit) return explicit.replace(/\/+$/, "");
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/+$/, "")}`;
  return null;
}

export function shouldFanOutAnalysisModules(): boolean {
  const secret = process.env.ANALYSIS_INTERNAL_SECRET?.trim();
  const origin = analysisFanoutOrigin();
  return Boolean(secret && origin);
}

/** Fire-and-forget POST to /api/brands/analyze/[jobId]/run/[module]. */
export function fanOutAnalysisModule(jobId: number, module: ModuleName): void {
  const secret = process.env.ANALYSIS_INTERNAL_SECRET?.trim();
  const origin = analysisFanoutOrigin();
  if (!secret || !origin) return;

  const url = `${origin}/api/brands/analyze/${jobId}/run/${module}`;
  void fetch(url, {
    method: "POST",
    headers: {
      "x-internal-secret": secret,
      "content-type": "application/json",
    },
    cache: "no-store",
  })
    .then((res) => {
      if (!res.ok) {
        console.error(
          `[analysis] fan-out ${module} job ${jobId} HTTP ${res.status}`,
        );
      }
    })
    .catch((err) => {
      console.error(`[analysis] fan-out ${module} job ${jobId}`, err);
    });
}
