import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MODULES, MODULE_LABELS, type ModuleName } from "@/lib/analysis/types";

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

  const job = await prisma.brand_analysis.findUnique({ where: { id } });
  if (!job || (job.member_id !== memberId && !isAdmin)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [moduleRows, vnoc, crawl, socials, intel, campaigns] = await Promise.all([
    prisma.brand_analysis_module.findMany({ where: { analysis_id: id } }),
    prisma.brand_vnoc.findFirst({ where: { analysis_id: id }, orderBy: { id: "desc" } }),
    prisma.brand_crawl.findFirst({ where: { analysis_id: id }, orderBy: { id: "desc" } }),
    prisma.brand_social.findMany({ where: { analysis_id: id }, orderBy: { id: "asc" } }),
    prisma.brand_intelligence.findFirst({ where: { analysis_id: id }, orderBy: { id: "desc" } }),
    prisma.brand_campaign_suggestion.findMany({
      where: { analysis_id: id },
      orderBy: { sort_order: "asc" },
    }),
  ]);

  const statusByName = new Map(moduleRows.map((m) => [m.module, m]));
  const modules = MODULES.map((m: ModuleName) => {
    const row = statusByName.get(m);
    return {
      module: m,
      status: row?.status || "pending",
      error: row?.error || null,
      labels: MODULE_LABELS[m],
    };
  });

  const arr = (v: unknown): string[] => (Array.isArray(v) ? (v as string[]) : []);

  return NextResponse.json({
    jobId: job.id,
    status: job.status,
    domain: job.domain,
    inputUrl: job.input_url,
    brandId: job.url_id,
    inVnoc: job.in_vnoc,
    scores: {
      website: job.website_score,
      social: job.social_score,
      referral: job.referral_score,
      overall: job.overall_health,
    },
    modules,
    vnoc: vnoc
      ? {
          matched: vnoc.matched,
          name: vnoc.name,
          logoUrl: vnoc.logo_url,
          description: vnoc.description,
          tagline: vnoc.tagline,
        }
      : null,
    crawl: crawl
      ? {
          name: crawl.name,
          logoUrl: crawl.logo_url,
          faviconUrl: crawl.favicon_url,
          title: crawl.title,
          metaDescription: crawl.meta_description,
          primaryCta: crawl.primary_cta,
          colors: arr(crawl.colors),
          fonts: arr(crawl.fonts),
          products: arr(crawl.products),
          services: arr(crawl.services),
          pricing: arr(crawl.pricing),
          emails: arr(crawl.emails),
          phones: arr(crawl.phones),
          languages: arr(crawl.languages),
          currencies: arr(crawl.currencies),
          pagesCrawled: crawl.pages_crawled,
        }
      : null,
    socials: socials.map((s) => ({ platform: s.platform, url: s.url, source: s.source })),
    intelligence: intel
      ? {
          summary: intel.summary,
          industry: intel.industry,
          icp: intel.icp,
          targetAudience: intel.target_audience,
          products: intel.products,
          usp: intel.usp,
          brandVoice: intel.brand_voice,
          advantages: arr(intel.advantages),
          weaknesses: arr(intel.weaknesses),
          opportunities: arr(intel.opportunities),
          readinessScore: intel.readiness_score,
        }
      : null,
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
