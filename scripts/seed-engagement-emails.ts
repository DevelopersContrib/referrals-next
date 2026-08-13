/**
 * Seed default segments + ensure every segment campaign has 10 beautiful emails.
 * Run: npx tsx scripts/seed-engagement-emails.ts
 */
import { prisma } from "../src/lib/prisma";
import { aiCreateSegments } from "../src/lib/engagement-segments";
import { ensureCampaignsForAllSegments, listCampaigns } from "../src/lib/engagement-crud";

(async () => {
  console.log("Seeding segments (fallback / AI)…");
  const segs = await aiCreateSegments();
  console.log(
    `  segments: created=${segs.created} updated=${segs.updated} total=${segs.segments.length} ai=${segs.ai}`
  );

  console.log("Ensuring campaigns with 10 emails each…");
  const ensured = await ensureCampaignsForAllSegments();
  console.log(
    `  created=${ensured.created} skipped=${ensured.skipped} backfilled=${ensured.backfilled}`
  );
  for (const r of ensured.results) {
    console.log(
      `  · ${r.segmentKey} → ${r.campaignKey} emails=${r.emailsCreated}` +
        (r.backfilled ? ` (+${r.backfilled} filled)` : "")
    );
  }

  const campaigns = await listCampaigns();
  console.log("\nCampaign email counts:");
  for (const c of campaigns) {
    console.log(`  ${c.key}: ${c.emailCount} emails — ${c.name}`);
  }

  const under = campaigns.filter((c) => c.emailCount < 10);
  if (under.length) {
    console.error("\n✗ Some campaigns still have < 10 emails:", under.map((c) => c.key));
    process.exitCode = 1;
  } else {
    console.log("\n✓ Every campaign has at least 10 editable emails.");
  }

  await prisma.$disconnect();
})().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
