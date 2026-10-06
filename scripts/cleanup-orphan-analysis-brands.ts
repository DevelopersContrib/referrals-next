/**
 * Remove draft brands left behind by failed onboarding analysis (no campaigns,
 * no successful modules). Examples: job #122 / brand #40473.
 *
 *   npx tsx scripts/cleanup-orphan-analysis-brands.ts --dry-run
 *   npx tsx scripts/cleanup-orphan-analysis-brands.ts --brand-id 40473
 *   npx tsx scripts/cleanup-orphan-analysis-brands.ts --job-id 122
 */
import { config as loadEnv } from "dotenv";
import { prisma } from "../src/lib/prisma";
import {
  cleanupOrphanDraftFromFailedJob,
  deleteAnalysisJobRecords,
} from "../src/lib/analysis/cleanup";

loadEnv({ path: ".env.local", quiet: true });
loadEnv({ quiet: true });

function hasFlag(name: string) {
  return process.argv.includes(`--${name}`);
}

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : undefined;
}

async function removeBrand(brandId: number, dryRun: boolean) {
  const brand = await prisma.member_urls.findUnique({
    where: { id: brandId },
    select: { id: true, domain: true, member_id: true },
  });
  if (!brand) {
    console.log(`brand ${brandId}: not found`);
    return;
  }

  const campaigns = await prisma.member_campaigns.count({
    where: { url_id: brandId },
  });
  if (campaigns > 0) {
    console.log(`brand ${brandId} (${brand.domain}): skip — has campaigns`);
    return;
  }

  const jobs = await prisma.brand_analysis.findMany({
    where: { url_id: brandId },
    select: { id: true, status: true },
  });

  if (dryRun) {
    console.log(
      `DRY RUN: would delete brand ${brandId} (${brand.domain}) and ${jobs.length} analysis job(s)`,
    );
    return;
  }

  for (const job of jobs) {
    await deleteAnalysisJobRecords(job.id);
  }
  await prisma.$transaction([
    prisma.url_socials.deleteMany({ where: { url_id: brandId } }),
    prisma.member_urls.delete({ where: { id: brandId } }),
  ]);
  console.log(`removed brand ${brandId} (${brand.domain})`);
}

async function main() {
  const dryRun = hasFlag("dry-run");
  const brandId = arg("brand-id");
  const jobId = arg("job-id");

  if (jobId) {
    const id = parseInt(jobId, 10);
    if (!Number.isFinite(id)) throw new Error("invalid --job-id");
    if (dryRun) {
      console.log(`DRY RUN: would run cleanupOrphanDraftFromFailedJob(${id})`);
      return;
    }
    const result = await cleanupOrphanDraftFromFailedJob(id);
    console.log(result);
    await prisma.$disconnect();
    return;
  }

  if (brandId) {
    await removeBrand(parseInt(brandId, 10), dryRun);
    await prisma.$disconnect();
    return;
  }

  const candidates = await prisma.brand_analysis.findMany({
    where: { status: "failed" },
    select: { id: true, url_id: true },
    orderBy: { id: "desc" },
    take: 200,
  });

  let removed = 0;
  for (const job of candidates) {
    if (!job.url_id) continue;
    if (dryRun) {
      const modules = await prisma.brand_analysis_module.findMany({
        where: { analysis_id: job.id },
        select: { status: true },
      });
      if (modules.some((m) => m.status === "done")) continue;
      const campaigns = await prisma.member_campaigns.count({
        where: { url_id: job.url_id },
      });
      if (campaigns > 0) continue;
      console.log(`DRY RUN: would cleanup job ${job.id} brand ${job.url_id}`);
      removed++;
      continue;
    }
    const result = await cleanupOrphanDraftFromFailedJob(job.id);
    if (result.removed) {
      console.log(`cleaned job ${job.id} brand ${result.brandId}`);
      removed++;
    }
  }

  console.log(dryRun ? `would remove ${removed} orphan(s)` : `removed ${removed} orphan(s)`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
