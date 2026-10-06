import { prisma } from "@/lib/prisma";

/** Remove all rows tied to one analysis job (does not delete member_urls). */
export async function deleteAnalysisJobRecords(analysisId: number) {
  await prisma.brand_campaign_suggestion.deleteMany({
    where: { analysis_id: analysisId },
  });
  await prisma.brand_intelligence.deleteMany({
    where: { analysis_id: analysisId },
  });
  await prisma.brand_social.deleteMany({ where: { analysis_id: analysisId } });
  await prisma.brand_crawl.deleteMany({ where: { analysis_id: analysisId } });
  await prisma.brand_vnoc.deleteMany({ where: { analysis_id: analysisId } });
  await prisma.brand_analysis_module.deleteMany({
    where: { analysis_id: analysisId },
  });
  await prisma.brand_analysis.delete({ where: { id: analysisId } });
}

/**
 * Draft brand from a failed onboarding run with zero successful modules.
 * Frees the member's brand slot and removes clutter (e.g. job #122 / brand #40473).
 */
export async function cleanupOrphanDraftFromFailedJob(
  analysisId: number,
): Promise<{ removed: boolean; brandId: number | null }> {
  const job = await prisma.brand_analysis.findUnique({
    where: { id: analysisId },
    select: { id: true, status: true, url_id: true },
  });
  if (!job?.url_id || job.status !== "failed") {
    return { removed: false, brandId: job?.url_id ?? null };
  }

  const modules = await prisma.brand_analysis_module.findMany({
    where: { analysis_id: analysisId },
    select: { status: true },
  });
  if (modules.some((m) => m.status === "done")) {
    return { removed: false, brandId: job.url_id };
  }

  const brandId = job.url_id;
  const [campaigns, otherJobs] = await Promise.all([
    prisma.member_campaigns.count({ where: { url_id: brandId } }),
    prisma.brand_analysis.count({
      where: { url_id: brandId, NOT: { id: analysisId } },
    }),
  ]);
  if (campaigns > 0 || otherJobs > 0) {
    return { removed: false, brandId };
  }

  await deleteAnalysisJobRecords(analysisId);
  await prisma.$transaction([
    prisma.url_socials.deleteMany({ where: { url_id: brandId } }),
    prisma.member_urls.delete({ where: { id: brandId } }),
  ]);

  return { removed: true, brandId };
}
