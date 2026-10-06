import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { loadAnalysisStatus } from "@/lib/analysis/load-status";
import { expireJobIfNeeded } from "@/lib/analysis/orchestrator";
import { logServerError } from "@/lib/api/public-error";

export const dynamic = "force-dynamic";

// GET /api/brands/analyze/[jobId] — status + partial results for polling.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const memberId = parseInt(session.user.id, 10);
  const isAdmin = Boolean((session.user as { isAdmin?: boolean }).isAdmin);

  const { jobId } = await params;
  const id = parseInt(jobId, 10);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    let status = await loadAnalysisStatus(id);
    if (!status || (status.memberId !== memberId && !isAdmin)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (
      (status.status === "pending" || status.status === "running") &&
      (await expireJobIfNeeded(id))
    ) {
      status = await loadAnalysisStatus(id);
      if (!status) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
    }

    const { memberId: _memberId, startedAt: _startedAt, ...body } = status;
    return NextResponse.json(body);
  } catch (err) {
    logServerError("analyze status", err);
    return NextResponse.json(
      { error: "This step couldn't finish" },
      { status: 500 },
    );
  }
}
