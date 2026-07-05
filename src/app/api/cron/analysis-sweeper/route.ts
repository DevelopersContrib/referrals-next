import { NextRequest, NextResponse } from "next/server";
import { authenticateCron } from "@/lib/api/helpers";
import { sweepStuckModules } from "@/lib/analysis/orchestrator";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// GET /api/cron/analysis-sweeper — retries stalled/failed brand-analysis modules.
export async function GET(req: NextRequest) {
  if (!authenticateCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await sweepStuckModules();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("analysis-sweeper failed", e);
    return NextResponse.json({ ok: false, error: "sweeper failed" }, { status: 500 });
  }
}
