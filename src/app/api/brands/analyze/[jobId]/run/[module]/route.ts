import { NextRequest, NextResponse, after } from "next/server";
import { runModuleAndAdvance } from "@/lib/analysis/orchestrator";
import { isModuleName } from "@/lib/analysis/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// POST /api/brands/analyze/[jobId]/run/[module]
// Internal-only: runs a single analyzer module in the background (after response),
// then schedules its dependents. Guarded by ANALYSIS_INTERNAL_SECRET.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string; module: string }> }
) {
  const secret = process.env.ANALYSIS_INTERNAL_SECRET;
  if (!secret || req.headers.get("x-internal-secret") !== secret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { jobId, module } = await params;
  const id = parseInt(jobId, 10);
  if (!Number.isFinite(id) || !isModuleName(module)) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  after(async () => {
    await runModuleAndAdvance(id, module);
  });

  return NextResponse.json({ accepted: true }, { status: 202 });
}
