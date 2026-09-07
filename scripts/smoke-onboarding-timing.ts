/**
 * Onboarding timing smoke (R1).
 *
 * Offline — crawl budget + onboarding module graph (no DB):
 *   npx tsx scripts/smoke-onboarding-timing.ts
 *   npx tsx scripts/smoke-onboarding-timing.ts --url blacksesameph.com
 *
 * Live — run the onboarding pipeline until intelligence (DB + OpenAI):
 *   npx tsx scripts/smoke-onboarding-timing.ts --live --member-id 123
 *   npx tsx scripts/smoke-onboarding-timing.ts --live --member-id 123 --max-ms 45000
 */
import { config as loadEnv } from "dotenv";
import { crawlSite } from "../src/lib/analysis/crawler";
import {
  MODULES,
  ONBOARDING_MODULES,
} from "../src/lib/analysis/types";

loadEnv({ path: ".env.local", quiet: true });
loadEnv({ quiet: true });

const DEFAULT_URL = "blacksesameph.com";
const DEFAULT_MAX_MS = 30_000;
const CRAWL_BUDGET_MS = 10_000;

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

function arg(name: string, fallback = ""): string {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

function fail(msg: string): never {
  console.error(`FAIL: ${msg}`);
  process.exit(1);
}

function pass(msg: string) {
  console.log(`OK: ${msg}`);
}

function normalizeUrl(raw: string): string {
  const t = raw.trim();
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

async function offline(urlArg: string) {
  console.log("\n=== Onboarding timing smoke (offline) ===\n");

  console.log("1. Onboarding module graph");
  const onboardingModules = ONBOARDING_MODULES as readonly string[];
  if (onboardingModules.includes("campaigns")) {
    fail("ONBOARDING_MODULES must not include campaigns on first analyze");
  }
  pass(`ONBOARDING_MODULES = [${ONBOARDING_MODULES.join(", ")}]`);
  pass("campaigns excluded from first-run onboarding");

  const missing = ONBOARDING_MODULES.filter(
    (m) => !(MODULES as readonly string[]).includes(m),
  );
  if (missing.length) {
    fail(`unknown onboarding modules: ${missing.join(", ")}`);
  }
  pass("all onboarding modules registered in MODULES");

  console.log("\n2. Crawl budget");
  const url = normalizeUrl(urlArg);
  const t0 = Date.now();
  const crawl = await crawlSite(url);
  const ms = Date.now() - t0;

  if (ms > CRAWL_BUDGET_MS) {
    fail(`crawl took ${ms}ms (budget ${CRAWL_BUDGET_MS}ms) for ${url}`);
  }
  pass(`crawl ${url} in ${ms}ms`);

  if ((crawl.pagesCrawled || 0) > 2) {
    fail(`crawled ${crawl.pagesCrawled} pages (max 2: homepage + one extra)`);
  }
  pass(`pages crawled: ${crawl.pagesCrawled ?? 0}`);

  if (!crawl.name && !crawl.title) {
    fail("crawl returned no site name or title");
  }
  pass(`site name: ${crawl.name || crawl.title}`);

  if (!crawl.logoUrl && !crawl.faviconUrl) {
    console.log("WARN: no logo or favicon extracted (non-fatal)");
  } else {
    pass(`logo: ${crawl.logoUrl ? "yes" : "favicon only"}`);
  }
}

async function cleanupSmokeJob(analysisId: number, brandId: number) {
  const { prisma } = await import("../src/lib/prisma");

  await prisma.brand_campaign_suggestion.deleteMany({
    where: { analysis_id: analysisId },
  });
  await prisma.brand_intelligence.deleteMany({ where: { analysis_id: analysisId } });
  await prisma.brand_social.deleteMany({ where: { analysis_id: analysisId } });
  await prisma.brand_crawl.deleteMany({ where: { analysis_id: analysisId } });
  await prisma.brand_vnoc.deleteMany({ where: { analysis_id: analysisId } });
  await prisma.brand_analysis_module.deleteMany({ where: { analysis_id: analysisId } });
  await prisma.brand_analysis.delete({ where: { id: analysisId } });
  await prisma.member_urls.deleteMany({ where: { id: brandId } });
}

async function live(memberId: number, urlArg: string, maxMs: number) {
  const { hasOpenAI } = await import("../src/lib/openai");
  const { prisma } = await import("../src/lib/prisma");
  const { createAnalysisJob } = await import("../src/lib/analysis/orchestrator");
  const { runModuleAndAdvance } = await import("../src/lib/analysis/orchestrator");

  console.log("\n=== Onboarding timing smoke (live) ===\n");

  if (!process.env.DATABASE_URL?.trim()) {
    fail("DATABASE_URL not set — copy .env.local.example → .env.local");
  }
  pass("DATABASE_URL present");

  if (!hasOpenAI()) {
    fail("OPENAI_API_KEY not set — intelligence module will not run");
  }
  pass("OPENAI_API_KEY present");

  if (!Number.isFinite(memberId) || memberId <= 0) {
    fail("--live requires --member-id <id>");
  }

  const member = await prisma.members.findUnique({
    where: { id: memberId },
    select: { id: true },
  });
  if (!member) {
    fail(`member ${memberId} not found`);
  }
  pass(`member ${memberId}`);

  const url = normalizeUrl(urlArg);
  const slug = `smoke-onboard-${Date.now()}`;
  const t0 = Date.now();

  const { analysis, brandId } = await createAnalysisJob(memberId, url, slug);
  console.log(`job ${analysis.id} · brand ${brandId} · ${url}`);

  try {
    await prisma.brand_analysis.update({
      where: { id: analysis.id },
      data: { status: "running", started_at: new Date() },
    });

    await Promise.all([
      runModuleAndAdvance(analysis.id, "vnoc"),
      runModuleAndAdvance(analysis.id, "crawl"),
    ]);
    const afterBase = Date.now() - t0;
    pass(`vnoc + crawl done in ${afterBase}ms`);

    await Promise.all([
      runModuleAndAdvance(analysis.id, "social"),
      runModuleAndAdvance(analysis.id, "intelligence"),
    ]);
    const afterIntel = Date.now() - t0;

    const [intelMod, intel, job] = await Promise.all([
      prisma.brand_analysis_module.findFirst({
        where: { analysis_id: analysis.id, module: "intelligence" },
      }),
      prisma.brand_intelligence.findFirst({
        where: { analysis_id: analysis.id },
        orderBy: { id: "desc" },
      }),
      prisma.brand_analysis.findUnique({ where: { id: analysis.id } }),
    ]);

    if (intelMod?.status !== "done") {
      fail(
        `intelligence module ${intelMod?.status ?? "missing"}: ${intelMod?.error ?? "no row"}`,
      );
    }
    if (!intel?.summary?.trim()) {
      fail("intelligence result missing summary");
    }

    const campaignRows = await prisma.brand_analysis_module.count({
      where: { analysis_id: analysis.id, module: "campaigns" },
    });
    if (campaignRows > 0) {
      fail("onboarding job should not create a campaigns module row");
    }
    pass("no campaigns module on onboarding job");

    if (afterIntel > maxMs) {
      fail(`intelligence ready in ${afterIntel}ms (max ${maxMs}ms)`);
    }

    pass(`intelligence ready in ${afterIntel}ms (≤ ${maxMs}ms)`);
    pass(`industry: ${intel.industry || "—"}`);
    pass(`readiness score: ${intel.readiness_score ?? job?.referral_score ?? "—"}`);

    const modules = await prisma.brand_analysis_module.findMany({
      where: { analysis_id: analysis.id },
      orderBy: { id: "asc" },
    });
    const timing = modules
      .filter((m) => m.completed_at)
      .map((m) => `${m.module}:${m.completed_at!.toISOString()}`)
      .join(", ");
    if (timing) console.log(`  module timestamps: ${timing}`);
  } finally {
    if (!hasFlag("keep")) {
      await cleanupSmokeJob(analysis.id, brandId);
      console.log(`  cleaned up job ${analysis.id}`);
    } else {
      console.log(`  kept job ${analysis.id} (--keep)`);
    }
    await prisma.$disconnect();
  }
}

async function main() {
  const url = arg("url", DEFAULT_URL);
  const maxMs = Math.max(5_000, parseInt(arg("max-ms", String(DEFAULT_MAX_MS)), 10));

  await offline(url);

  if (hasFlag("live")) {
    const memberId = parseInt(arg("member-id", "0"), 10);
    await live(memberId, url, maxMs);
  } else {
    console.log("\nRun with --live --member-id <id> for full pipeline timing (DB + OpenAI).");
  }

  console.log("\nAll checks passed.");
}

main().catch((e) => {
  console.error("FAIL:", (e as Error).message || e);
  process.exit(1);
});
