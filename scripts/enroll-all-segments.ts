/**
 * Enable all engagement segments/campaigns, ensure 10-email drips, enroll audiences.
 *
 *   npx tsx scripts/enroll-all-segments.ts
 *   npx tsx scripts/enroll-all-segments.ts --dry-run
 *   npx tsx scripts/enroll-all-segments.ts --limit=200 --spread=7
 */
import { prisma } from "../src/lib/prisma";
import { RF_DOMAIN_KEY, enrollSegmentIntoCampaign } from "../src/lib/engagement";
import { ensureCampaignsForAllSegments } from "../src/lib/engagement-crud";

function arg(name: string, fallback?: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
}

async function main() {
  const dry = process.argv.includes("--dry-run");
  const limit = Math.min(200, Math.max(1, Number(arg("limit", "100")) || 100));
  const spread = Math.min(30, Math.max(1, Number(arg("spread", "7")) || 7));

  console.log("\n=== Engagement: enable + ensure + enroll all segments ===\n");
  console.log(`domain_key=${RF_DOMAIN_KEY} dry=${dry} limit=${limit} spread=${spread}d\n`);

  const beforeSeg = await prisma.engagement_segments.count({
    where: { domain_key: RF_DOMAIN_KEY },
  });
  const beforeCamp = await prisma.engagement_campaigns.count({
    where: { domain_key: RF_DOMAIN_KEY },
  });
  console.log(`Before: segments=${beforeSeg} campaigns=${beforeCamp}`);

  if (dry) {
    const segs = await prisma.engagement_segments.findMany({
      where: { domain_key: RF_DOMAIN_KEY },
      select: { segment_key: true, name: true, enabled: true },
    });
    const camps = await prisma.engagement_campaigns.findMany({
      where: { domain_key: RF_DOMAIN_KEY },
      select: { campaign_key: true, segment_key: true, enabled: true },
    });
    console.log("\nSegments:");
    for (const s of segs) console.log(`  ${s.enabled ? "ON " : "off"} ${s.segment_key} — ${s.name}`);
    console.log("\nCampaigns:");
    for (const c of camps) {
      console.log(
        `  ${c.enabled ? "ON " : "off"} ${c.campaign_key} → ${c.segment_key || "(no segment)"}`
      );
    }
    console.log("\n(dry-run — no writes)\n");
    return;
  }

  const segOn = await prisma.engagement_segments.updateMany({
    where: { domain_key: RF_DOMAIN_KEY },
    data: { enabled: true },
  });
  console.log(`Enabled segments: ${segOn.count}`);

  console.log("Ensuring campaigns (10 emails each)…");
  const ensured = await ensureCampaignsForAllSegments();
  console.log(
    `Ensure: created=${ensured.created} skipped=${ensured.skipped} backfilled=${ensured.backfilled}`
  );
  for (const r of ensured.results) {
    console.log(
      `  ${r.segmentKey} → ${r.campaignKey} emails=${r.emailsCreated}` +
        (r.backfilled ? ` (+${r.backfilled} backfill)` : "") +
        (r.skipped ? " (existed)" : " (new)")
    );
  }

  const campOn = await prisma.engagement_campaigns.updateMany({
    where: { domain_key: RF_DOMAIN_KEY },
    data: { enabled: true },
  });
  console.log(`Enabled campaigns: ${campOn.count}`);

  const camps = await prisma.engagement_campaigns.findMany({
    where: {
      domain_key: RF_DOMAIN_KEY,
      enabled: true,
      segment_key: { not: null },
    },
    orderBy: { id: "asc" },
  });

  console.log(`\nEnrolling ${camps.length} segment campaigns (limit ${limit} each)…`);
  let enrolledTotal = 0;
  for (const camp of camps) {
    const segmentKey = (camp.segment_key || "").trim();
    if (!segmentKey) continue;
    process.stdout.write(`  ${camp.campaign_key}… `);
    const started = Date.now();
    try {
      const r = await enrollSegmentIntoCampaign({
        campaignKey: camp.campaign_key,
        segmentKey,
        limit,
        spreadDays: spread,
      });
      enrolledTotal += r.enrolled;
      console.log(
        `+${r.enrolled} remaining≈${r.remainingEstimate} (${Math.round((Date.now() - started) / 1000)}s)`
      );
    } catch (e) {
      console.log(`ERROR ${(e as Error).message}`);
    }
  }

  const active = await prisma.engagement_enrollments.count({
    where: { domain_key: RF_DOMAIN_KEY, status: "active" },
  });
  console.log(`\nEnrolled this run: ${enrolledTotal}`);
  console.log(`Active enrollments now: ${active}\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
