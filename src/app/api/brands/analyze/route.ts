import { NextRequest, NextResponse, after } from "next/server";
import { auth } from "@/lib/auth";
import {
  countMemberBrands,
  isMemberOnPaidPlan,
  subscriptionRequiredResponse,
} from "@/lib/member-subscription";
import { createAnalysisJob, kickoffJob } from "@/lib/analysis/orchestrator";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// POST /api/brands/analyze — create a draft brand + start the AI analysis pipeline.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const memberId = parseInt(session.user.id, 10);

  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const raw = String(body.url || "").trim();
  if (!raw) {
    return NextResponse.json({ error: "Website URL is required" }, { status: 400 });
  }

  // Validate it parses as a hostname.
  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  let hostname = "";
  try {
    hostname = new URL(candidate).hostname;
  } catch {
    return NextResponse.json({ error: "Enter a valid website URL" }, { status: 400 });
  }
  if (!hostname.includes(".")) {
    return NextResponse.json({ error: "Enter a valid website URL" }, { status: 400 });
  }

  // Every new domain gets analyzed. The first brand is free; additional
  // domains require an active subscription.
  const existing = await countMemberBrands(memberId);
  if (existing >= 1 && !(await isMemberOnPaidPlan(memberId))) {
    return subscriptionRequiredResponse();
  }

  const { analysis, brandId } = await createAnalysisJob(memberId, raw);

  // Fan out the pipeline after the response is sent.
  after(async () => {
    await kickoffJob(analysis.id);
  });

  return NextResponse.json({ jobId: analysis.id, brandId }, { status: 201 });
}
