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
import { claimBrandSlug, extractDomainFromUrl } from "@/lib/brand-access";
import { RUNNERS } from "./registry";
import {
  MODULE_DEPS,
  ONBOARDING_MODULES,
  isModuleName,
  type ModuleName,
} from "./types";

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
export async function createAnalysisJob(
  memberId: number,
  rawUrl: string,
  requestedSlug?: string,
) {
  const input_url = normalizeInputUrl(rawUrl);
  const domain = extractDomainFromUrl(input_url);

  // Draft brand so the analysis can seed logo/vnoc onto it immediately.
  const brand = await prisma.member_urls.create({
    data: { url: input_url, member_id: memberId, domain },
  });

  // Reserve the public address up front — the member was shown it before they
  // hit Analyze, and launch must not silently hand them a different one.
  const slug = await claimBrandSlug(brand.id, requestedSlug, domain);

  const analysis = await prisma.brand_analysis.create({
    data: {
      member_id: memberId,
      url_id: brand.id,
      input_url,
      domain,
      status: "pending",
    },
  });

  await createModuleRows(analysis.id, [...ONBOARDING_MODULES]);

  return { analysis, brandId: brand.id, slug };
}

async function createModuleRows(
  analysisId: number,
  modules: readonly ModuleName[],
) {
  await prisma.brand_analysis_module.createMany({
    data: modules.map((m) => ({
      analysis_id: analysisId,
      module: m,
      status: "pending",
      depends_on: MODULE_DEPS[m].join(",") || null,
    })),
  });
}

/** Prior analysis with crawl + intelligence already complete — reuse for Design with AI. */
async function findReusableAnalysis(urlId: number) {
  const priorJobs = await prisma.brand_analysis.findMany({
    where: { url_id: urlId, status: "done" },
    orderBy: { completed_at: "desc" },
    take: 5,
  });

  for (const job of priorJobs) {
    const modules = await prisma.brand_analysis_module.findMany({
      where: { analysis_id: job.id },
    });
    const crawlDone = modules.some(
      (m) => m.module === "crawl" && m.status === "done",
    );
    const intelDone = modules.some(
      (m) => m.module === "intelligence" && m.status === "done",
    );
    if (crawlDone && intelDone) return job;
  }
  return null;
}

async function copyAnalysisArtifacts(
  fromAnalysisId: number,
  toAnalysisId: number,
) {
  const [vnoc, crawl, socials, intel] = await Promise.all([
    prisma.brand_vnoc.findFirst({
      where: { analysis_id: fromAnalysisId },
      orderBy: { id: "desc" },
    }),
    prisma.brand_crawl.findFirst({
      where: { analysis_id: fromAnalysisId },
      orderBy: { id: "desc" },
    }),
    prisma.brand_social.findMany({ where: { analysis_id: fromAnalysisId } }),
    prisma.brand_intelligence.findFirst({
      where: { analysis_id: fromAnalysisId },
      orderBy: { id: "desc" },
    }),
  ]);

  if (vnoc) {
    await prisma.brand_vnoc.create({
      data: {
        analysis_id: toAnalysisId,
        matched: vnoc.matched,
        vnoc_domain_id: vnoc.vnoc_domain_id ?? undefined,
        name: vnoc.name ?? undefined,
        logo_url: vnoc.logo_url ?? undefined,
        description: vnoc.description ?? undefined,
        tagline: vnoc.tagline ?? undefined,
        socials: vnoc.socials as object,
        raw: vnoc.raw as object | undefined,
      },
    });
  }

  if (crawl) {
    await prisma.brand_crawl.create({
      data: {
        analysis_id: toAnalysisId,
        name: crawl.name ?? undefined,
        logo_url: crawl.logo_url ?? undefined,
        favicon_url: crawl.favicon_url ?? undefined,
        title: crawl.title ?? undefined,
        meta_description: crawl.meta_description ?? undefined,
        primary_cta: crawl.primary_cta ?? undefined,
        colors: crawl.colors as object,
        fonts: crawl.fonts as object,
        products: crawl.products as object,
        services: crawl.services as object,
        pricing: crawl.pricing as object,
        emails: crawl.emails as object,
        phones: crawl.phones as object,
        addresses: crawl.addresses as object,
        languages: crawl.languages as object,
        currencies: crawl.currencies as object,
        pages_crawled: crawl.pages_crawled,
        raw: crawl.raw as object,
      },
    });
  }

  if (socials.length) {
    await prisma.brand_social.createMany({
      data: socials.map((s) => ({
        analysis_id: toAnalysisId,
        platform: s.platform,
        url: s.url,
        source: s.source,
        verified: s.verified,
      })),
    });
  }

  if (intel) {
    await prisma.brand_intelligence.create({
      data: {
        analysis_id: toAnalysisId,
        summary: intel.summary,
        industry: intel.industry,
        icp: intel.icp,
        target_audience: intel.target_audience,
        products: intel.products,
        usp: intel.usp,
        brand_voice: intel.brand_voice,
        advantages: intel.advantages as object,
        weaknesses: intel.weaknesses as object,
        opportunities: intel.opportunities as object,
        readiness_score: intel.readiness_score,
      },
    });
  }
}

/** Analyze an existing brand — does not create another member_urls row. */
export async function createAnalysisJobForBrand(
  memberId: number,
  brand: { id: number; url: string; domain: string },
) {
  const input_url = normalizeInputUrl(brand.url || brand.domain);
  const domain = extractDomainFromUrl(input_url) || brand.domain;
  const prior = await findReusableAnalysis(brand.id);

  const analysis = await prisma.brand_analysis.create({
    data: {
      member_id: memberId,
      url_id: brand.id,
      input_url,
      domain,
      status: prior ? "running" : "pending",
      ...(prior
        ? {
            in_vnoc: prior.in_vnoc,
            vnoc_id: prior.vnoc_id ?? undefined,
            started_at: new Date(),
          }
        : {}),
    },
  });

  if (prior) {
    await createModuleRows(analysis.id, [...ONBOARDING_MODULES]);
    await prisma.brand_analysis_module.updateMany({
      where: { analysis_id: analysis.id },
      data: { status: "done", completed_at: new Date() },
    });
    await copyAnalysisArtifacts(prior.id, analysis.id);
    const scores = await computeScores(analysis.id);
    await prisma.brand_analysis.update({
      where: { id: analysis.id },
      data: {
        status: "done",
        completed_at: new Date(),
        website_score: scores.website,
        social_score: scores.social,
        referral_score: scores.referral,
        overall_health: scores.overall,
      },
    });
    console.info(
      `[analysis] job ${analysis.id} reused prior job ${prior.id} for brand ${brand.id}`,
    );
  } else {
    await createModuleRows(analysis.id, [...ONBOARDING_MODULES]);
  }

  return { analysis, brandId: brand.id, reused: Boolean(prior) };
}

/** Fire a fire-and-forget request to the per-module runner endpoint. */
async function triggerModule(jobId: number, module: ModuleName) {
  // No secret configured — skip the HTTP hop and run inline (local dev).
  if (!process.env.ANALYSIS_INTERNAL_SECRET) {
    void runModuleAndAdvance(jobId, module);
    return;
  }

  const url = `${appBaseUrl()}/api/brands/analyze/${jobId}/run/${module}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "x-internal-secret": process.env.ANALYSIS_INTERNAL_SECRET || "",
      },
      cache: "no-store",
    });
    if (!res.ok) {
      console.error(
        `triggerModule ${module} for job ${jobId} returned ${res.status}`,
      );
      void runModuleAndAdvance(jobId, module);
    }
  } catch (e) {
    console.error(
      `triggerModule ${module} for job ${jobId} failed`,
      (e as Error).message,
    );
    void runModuleAndAdvance(jobId, module);
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
    const deps = (m.depends_on || "")
      .split(",")
      .map((d) => d.trim())
      .filter(Boolean);
    const ready = deps.every((d) =>
      TERMINAL.includes(statusByName.get(d) || ""),
    );
    if (!ready) continue;
    if (!isModuleName(m.module)) continue;

    const claimed = await prisma.brand_analysis_module.updateMany({
      where: { id: m.id, status: "pending" },
      data: { status: "queued", started_at: new Date() },
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
  const analysis = await prisma.brand_analysis.findUnique({
    where: { id: jobId },
  });
  if (!analysis) return;

  const row = await prisma.brand_analysis_module.findFirst({
    where: { analysis_id: jobId, module },
  });
  if (!row) return;
  if (row.status === "done") return;

  // Claim: queued/pending/failed -> running.
  const claimed = await prisma.brand_analysis_module.updateMany({
    where: { id: row.id, status: { in: ["queued", "pending", "failed"] } },
    data: {
      status: "running",
      started_at: new Date(),
      attempts: { increment: 1 },
    },
  });
  if (claimed.count !== 1) return; // someone else is running it

  const startedAt = Date.now();
  try {
    await RUNNERS[module](analysis as brand_analysis);
    const durationMs = Date.now() - startedAt;
    await prisma.brand_analysis_module.update({
      where: { id: row.id },
      data: { status: "done", completed_at: new Date(), error: null },
    });
    console.info(
      `[analysis] job ${jobId} module ${module} done in ${durationMs}ms`,
    );
  } catch (e) {
    const durationMs = Date.now() - startedAt;
    const msg = (e as Error).message?.slice(0, 500) || "unknown error";
    console.error(
      `[analysis] job ${jobId} module ${module} failed after ${durationMs}ms:`,
      msg,
    );
    await prisma.brand_analysis_module.update({
      where: { id: row.id },
      data: { status: "failed", completed_at: new Date(), error: msg },
    });
  }

  await scheduleReady(jobId);
  await finalizePartialScores(jobId);
  await finalizeIfDone(jobId);
}

/** Write health scores once intelligence is ready (UI can show results before job completes). */
async function finalizePartialScores(jobId: number) {
  const intel = await prisma.brand_analysis_module.findFirst({
    where: { analysis_id: jobId, module: "intelligence", status: "done" },
  });
  if (!intel) return;

  const job = await prisma.brand_analysis.findUnique({
    where: { id: jobId },
    select: { overall_health: true },
  });
  if (job?.overall_health != null) return;

  const scores = await computeScores(jobId);
  await prisma.brand_analysis.update({
    where: { id: jobId },
    data: {
      website_score: scores.website,
      social_score: scores.social,
      referral_score: scores.referral,
      overall_health: scores.overall,
    },
  });
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

  const job = await prisma.brand_analysis.findUnique({
    where: { id: jobId },
    select: { started_at: true },
  });
  const elapsedMs = job?.started_at
    ? Date.now() - job.started_at.getTime()
    : null;

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

  if (elapsedMs != null) {
    const timing = modules
      .filter((m) => m.completed_at)
      .map((m) => `${m.module}:${m.completed_at!.toISOString()}`)
      .join(", ");
    console.info(`[analysis] job ${jobId} done in ${elapsedMs}ms (${timing})`);
  }
}

async function computeScores(jobId: number) {
  const [crawl, socials, intel] = await Promise.all([
    prisma.brand_crawl.findFirst({
      where: { analysis_id: jobId },
      orderBy: { id: "desc" },
    }),
    prisma.brand_social.findMany({ where: { analysis_id: jobId } }),
    prisma.brand_intelligence.findFirst({
      where: { analysis_id: jobId },
      orderBy: { id: "desc" },
    }),
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
  const overall = present.length
    ? Math.round(present.reduce((a, b) => a + b, 0) / present.length)
    : 0;

  return { website, social, referral, overall };
}

function arrLen(v: unknown): number {
  return Array.isArray(v) ? v.length : 0;
}

/** Cron sweeper: re-trigger modules that stalled or failed (under the attempt cap). */
export async function sweepStuckModules() {
  const runningCutoff = new Date(Date.now() - 2 * 60 * 1000);
  const queuedCutoff = new Date(Date.now() - 20 * 1000);

  const stuck = await prisma.brand_analysis_module.findMany({
    where: {
      attempts: { lt: MAX_ATTEMPTS },
      OR: [
        { status: "queued", started_at: { lt: queuedCutoff } },
        { status: "queued", started_at: null },
        { status: "running", started_at: { lt: runningCutoff } },
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
