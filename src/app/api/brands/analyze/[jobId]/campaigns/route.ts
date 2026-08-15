import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { regenerateCampaignsForJob } from "@/lib/analysis/registry";
import type { CampaignBrief, CampaignKind } from "@/lib/analysis/intelligence";
import { isCampaignDesign } from "@/lib/analysis/campaign-design";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const KINDS: CampaignKind[] = ["fast_growth", "revenue", "loyalty"];

function isKind(v: unknown): v is CampaignKind {
  return typeof v === "string" && (KINDS as string[]).includes(v);
}

function hexColor(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim().replace(/^#/, "");
  return /^[0-9a-fA-F]{6}$/.test(s) ? `#${s.toLowerCase()}` : null;
}

// POST /api/brands/analyze/[jobId]/campaigns
// Regenerates the 3 AI suggestions from an existing brand analysis + member brief.
export async function POST(
  req: NextRequest,
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

  let body: {
    goalKind?: unknown;
    goalType?: unknown;
    color?: unknown;
    copyTone?: unknown;
    wantImage?: unknown;
    designStyle?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const color = hexColor(body.color);
  const goalType = body.goalType === "visit" || body.goalType === "signup" ? body.goalType : null;
  const copyTone = typeof body.copyTone === "string" ? body.copyTone.trim().slice(0, 160) : "";

  if (!isKind(body.goalKind) || !goalType || !color || !copyTone || !isCampaignDesign(body.designStyle)) {
    return NextResponse.json(
      { error: "Choose a goal, unlock type, color, design, and copy tone." },
      { status: 400 }
    );
  }

  const job = await prisma.brand_analysis.findUnique({ where: { id } });
  if (!job || (job.member_id !== memberId && !isAdmin)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const brief: CampaignBrief = {
    goalKind: body.goalKind,
    goalType,
    color,
    copyTone,
    designStyle: body.designStyle,
    wantImage: body.wantImage !== false,
  };

  try {
    await regenerateCampaignsForJob(id, brief);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not generate campaigns.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const campaigns = await prisma.brand_campaign_suggestion.findMany({
    where: { analysis_id: id },
    orderBy: { sort_order: "asc" },
  });

  return NextResponse.json({
    campaigns: campaigns.map((c) => ({
      id: c.id,
      kind: c.kind,
      name: c.name,
      rewardType: c.reward_type,
      headline: c.headline,
      description: c.description,
      payload: c.payload,
      predictedConversion: c.predicted_conversion,
      predictedReferrals: c.predicted_referrals,
      estimatedRoi: c.estimated_roi,
    })),
  });
}
