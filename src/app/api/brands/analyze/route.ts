import { NextRequest, NextResponse, after } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  canMemberAddBrand,
  subscriptionRequiredResponse,
} from "@/lib/member-subscription";
import {
  createAnalysisJob,
  createAnalysisJobForBrand,
  kickoffJob,
} from "@/lib/analysis/orchestrator";
import { guardBrandSlug } from "@/lib/brand-slug-guard";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// POST /api/brands/analyze — start the AI analysis pipeline.
// { url } creates a draft brand (onboarding). { brandId } reuses an existing brand.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const memberId = parseInt(session.user.id, 10);
  const isAdmin = Boolean((session.user as { isAdmin?: boolean }).isAdmin);

  let body: { url?: string; brandId?: number; slug?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const existingBrandId = Number(body.brandId);
  if (Number.isFinite(existingBrandId) && existingBrandId > 0) {
    const brand = await prisma.member_urls.findFirst({
      where: isAdmin
        ? { id: existingBrandId }
        : { id: existingBrandId, member_id: memberId },
    });
    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    const { analysis, brandId, reused } = await createAnalysisJobForBrand(
      memberId,
      brand,
    );
    if (!reused) {
      after(async () => {
        await kickoffJob(analysis.id);
      });
    }
    return NextResponse.json(
      { jobId: analysis.id, brandId, reused },
      { status: 201 },
    );
  }

  const raw = String(body.url || "").trim();
  if (!raw) {
    return NextResponse.json(
      { error: "Website URL is required" },
      { status: 400 },
    );
  }

  // Validate it parses as a hostname.
  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  let hostname = "";
  try {
    hostname = new URL(candidate).hostname;
  } catch {
    return NextResponse.json(
      { error: "Enter a valid website URL" },
      { status: 400 },
    );
  }
  if (!hostname.includes(".")) {
    return NextResponse.json(
      { error: "Enter a valid website URL" },
      { status: 400 },
    );
  }

  const canAdd = await canMemberAddBrand(memberId);
  if (!canAdd.ok) {
    return subscriptionRequiredResponse(
      "Free accounts include 1 domain. Upgrade to Growth ($9/mo per brand) to analyze another.",
    );
  }

  // The member picked a public address before starting; refuse a collision here
  // rather than quietly renaming it at launch.
  const slugGuard = await guardBrandSlug({ slug: body.slug, website: raw });
  if (!slugGuard.ok) return slugGuard.response;

  const { analysis, brandId, slug } = await createAnalysisJob(
    memberId,
    raw,
    slugGuard.slug,
  );

  // Fan out the pipeline after the response is sent.
  after(async () => {
    await kickoffJob(analysis.id);
  });

  return NextResponse.json(
    { jobId: analysis.id, brandId, slug },
    { status: 201 },
  );
}
