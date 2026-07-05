/**
 * Job lifecycle + serverless fan-out for the brand-analysis pipeline.
 *
 * MySQL is the queue. Each module is its own HTTP invocation (/run/[module]) so
 * modules run in parallel with independent timeout budgets. When a module
 * finishes it schedules any dependents whose deps are all terminal. A Vercel
 * cron sweeper retries anything stuck/failed.
 */
import type { brand_analysis } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { extractDomainFromUrl } from "@/lib/brand-access";
import { RUNNERS } from "./registry";
import { MODULES, MODULE_DEPS, isModuleName, type ModuleName } from "./types";

const MAX_ATTEMPTS = 3;
const TERMINAL = ["done", "failed"];

function appBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "");
  if (explicit) return explicit;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

function normalizeInputUrl(raw: string): string {
  const t = raw.trim();
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

/** Create the draft brand + analysis job + one module row per analyzer. */
export async function createAnalysisJob(memberId: number, rawUrl: string) {
  const input_url = normalizeInputUrl(rawUrl);
  const domain = extractDomainFromUrl(input_url);

  // Draft brand so the analysis can seed logo/vnoc onto it immediately.
  const brand = await prisma.member_urls.create({
    data: { url: input_url, member_id: memberId, domain },
  });

  const analysis = await prisma.brand_analysis.create({
    data: {
      member_id: memberId,
      url_id: brand.id,
      input_url,
      domain,
      status: "pending",
    },
  });

  await prisma.brand_analysis_module.createMany({
    data: MODULES.map((m) => ({
      analysis_id: analysis.id,
      module: m,
      status: "pending",
      depends_on: MODULE_DEPS[m].join(",") || null,
    })),
  });

  return { analysis, brandId: brand.id };
}

/** Fire a fire-and-forget request to the per-module runner endpoint. */
async function triggerModule(jobId: number, module: ModuleName) {
  const url = `${appBaseUrl()}/api/brands/analyze/${jobId}/run/${module}`;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "x-internal-secret": process.env.ANALYSIS_INTERNAL_SECRET || "" },
      // Keep the trigger cheap; the endpoint returns 202 and works in after().
      cache: "no-store",
    });
  } catch (e) {
    // Not fatal: the cron sweeper will retry queued/pending modules.
    console.error(`triggerModule ${module} for job ${jobId} failed`, (e as Error).message);
  }
}

/** Claim a pending module (pending -> queued) atomically, then trigger it. */
export async function scheduleReady(jobId: number) {
  const modules = await prisma.brand_analysis_module.findMany({
    where: { analysis_id: jobId },
  });
  const statusByName = new Map(modules.map((m) => [m.module, m.status]));

  for (const m of modules) {
    if (m.status !== "pending") continue;
    const deps = (m.depends_on || "").split(",").map((d) => d.trim()).filter(Boolean);
    const ready = deps.every((d) => TERMINAL.includes(statusByName.get(d) || ""));
    if (!ready) continue;
    if (!isModuleName(m.module)) continue;

    const claimed = await prisma.brand_analysis_module.updateMany({
      where: { id: m.id, status: "pending" },
      data: { status: "queued" },
    });
    if (claimed.count === 1) {
      void triggerModule(jobId, m.module);
    }
  }
}

/** Kick off a freshly-created job (triggers modules with no deps). */
export async function kickoffJob(jobId: number) {
  await prisma.brand_analysis.update({
    where: { id: jobId },
    data: { status: "running", started_at: new Date() },
  });
  await scheduleReady(jobId);
}

/**
 * Execute one module and advance the graph. Safe to call from after() or the
 * cron sweeper. Idempotent-ish via the queued->running claim.
 */
export async function runModuleAndAdvance(jobId: number, module: ModuleName) {
  const analysis = await prisma.brand_analysis.findUnique({ where: { id: jobId } });
  if (!analysis) return;

  const row = await prisma.brand_analysis_module.findFirst({
    where: { analysis_id: jobId, module },
  });
  if (!row) return;
  if (row.status === "done") return;

  // Claim: queued/pending/failed -> running.
  const claimed = await prisma.brand_analysis_module.updateMany({
    where: { id: row.id, status: { in: ["queued", "pending", "failed"] } },
    data: { status: "running", started_at: new Date(), attempts: { increment: 1 } },
  });
  if (claimed.count !== 1) return; // someone else is running it

  try {
    await RUNNERS[module](analysis as brand_analysis);
    await prisma.brand_analysis_module.update({
      where: { id: row.id },
      data: { status: "done", completed_at: new Date(), error: null },
    });
  } catch (e) {
    const msg = (e as Error).message?.slice(0, 500) || "unknown error";
    console.error(`module ${module} failed for job ${jobId}:`, msg);
    await prisma.brand_analysis_module.update({
      where: { id: row.id },
      data: { status: "failed", completed_at: new Date(), error: msg },
    });
  }

  await scheduleReady(jobId);
  await finalizeIfDone(jobId);
}

/** Recompute health scores + mark the job done/failed once all modules are terminal. */
async function finalizeIfDone(jobId: number) {
  const modules = await prisma.brand_analysis_module.findMany({
    where: { analysis_id: jobId },
  });
  const allTerminal = modules.every((m) => TERMINAL.includes(m.status));
  if (!allTerminal) return;

  const scores = await computeScores(jobId);
  const anyDone = modules.some((m) => m.status === "done");

  await prisma.brand_analysis.update({
    where: { id: jobId },
    data: {
      status: anyDone ? "done" : "failed",
      completed_at: new Date(),
      website_score: scores.website,
      social_score: scores.social,
      referral_score: scores.referral,
      overall_health: scores.overall,
    },
  });
}

async function computeScores(jobId: number) {
  const [crawl, socials, intel] = await Promise.all([
    prisma.brand_crawl.findFirst({ where: { analysis_id: jobId }, orderBy: { id: "desc" } }),
    prisma.brand_social.findMany({ where: { analysis_id: jobId } }),
    prisma.brand_intelligence.findFirst({ where: { analysis_id: jobId }, orderBy: { id: "desc" } }),
  ]);

  // Website score: completeness of extracted signals.
  let website = 0;
  if (crawl) {
    const checks = [
      !!crawl.title,
      !!crawl.meta_description,
      !!crawl.logo_url,
      !!crawl.primary_cta,
      arrLen(crawl.products) + arrLen(crawl.services) > 0,
      arrLen(crawl.pricing) > 0,
      arrLen(crawl.colors) > 0,
      (crawl.pages_crawled || 0) > 1,
    ];
    website = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }

  const social = Math.min(100, socials.length * 22);
  const referral = intel?.readiness_score ?? 0;

  const present = [website, social, referral].filter((n) => n > 0);
  const overall = present.length ? Math.round(present.reduce((a, b) => a + b, 0) / present.length) : 0;

  return { website, social, referral, overall };
}

function arrLen(v: unknown): number {
  return Array.isArray(v) ? v.length : 0;
}

/** Cron sweeper: re-trigger modules that stalled or failed (under the attempt cap). */
export async function sweepStuckModules() {
  const cutoff = new Date(Date.now() - 2 * 60 * 1000); // 2 minutes

  const stuck = await prisma.brand_analysis_module.findMany({
    where: {
      attempts: { lt: MAX_ATTEMPTS },
      OR: [
        { status: "queued" },
        { status: "running", started_at: { lt: cutoff } },
        { status: "failed" },
      ],
    },
    take: 50,
  });

  let retried = 0;
  const touchedJobs = new Set<number>();
  for (const m of stuck) {
    if (!isModuleName(m.module)) continue;
    // Reset to pending so scheduleReady/trigger will re-run it.
    await prisma.brand_analysis_module.updateMany({
      where: { id: m.id },
      data: { status: "pending" },
    });
    touchedJobs.add(m.analysis_id);
    retried++;
  }

  for (const jobId of touchedJobs) {
    await scheduleReady(jobId);
    await finalizeIfDone(jobId);
  }

  // Also finalize jobs whose modules are all terminal but header still running.
  const runningJobs = await prisma.brand_analysis.findMany({
    where: { status: { in: ["pending", "running"] } },
    select: { id: true },
    take: 100,
  });
  for (const j of runningJobs) await finalizeIfDone(j.id);

  return { retried, jobsTouched: touchedJobs.size };
}
