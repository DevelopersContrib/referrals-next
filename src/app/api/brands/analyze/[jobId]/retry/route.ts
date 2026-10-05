import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { retryFailedModules } from "@/lib/analysis/orchestrator";
import { logServerError } from "@/lib/api/public-error";

export const dynamic = "force-dynamic";

// POST /api/brands/analyze/[jobId]/retry — re-run only failed modules.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
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
    const job = await prisma.brand_analysis.findUnique({
      where: { id },
      select: { member_id: true },
    });
    if (!job || (job.member_id !== memberId && !isAdmin)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const result = await retryFailedModules(id);
    return NextResponse.json(result);
  } catch (err) {
    logServerError("analyze retry", err);
    return NextResponse.json(
      { error: "This step couldn't finish" },
      { status: 500 },
    );
  }
}
