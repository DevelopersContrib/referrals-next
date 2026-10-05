import { prisma } from "@/lib/prisma";
import { MODULE_LABELS, isModuleName, type ModuleName } from "@/lib/analysis/types";
import type { AnalysisStatus, ModuleView } from "@/components/onboarding/analysis-types";

type StatusRow = {
  id: number;
  member_id: number;
  status: string | null;
  domain: string;
  input_url: string;
  url_id: number | null;
  in_vnoc: boolean | number | null;
  website_score: number | null;
  social_score: number | null;
  referral_score: number | null;
  overall_health: number | null;
  started_at: Date | null;
  modules_json: unknown;
  vnoc_json: unknown;
  crawl_json: unknown;
  socials_json: unknown;
  intel_json: unknown;
  campaigns_json: unknown;
};

function parseJson<T>(value: unknown): T | null {
  if (value == null) return null;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }
  return value as T;
}

function asArr(value: unknown): string[] {
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return [];
    }
  }
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

const CLIENT_STEP_ERROR = "This step couldn't finish";

/** One SQL round trip for the polling payload. Module errors are never raw driver text. */
export async function loadAnalysisStatus(id: number): Promise<
  (AnalysisStatus & { memberId: number; startedAt: Date | null }) | null
> {
  const rows = await prisma.$queryRaw<StatusRow[]>`
    SELECT
      j.id,
      j.member_id,
      j.status,
      j.domain,
      j.input_url,
      j.url_id,
      j.in_vnoc,
      j.website_score,
      j.social_score,
      j.referral_score,
      j.overall_health,
      j.started_at,
      (
        SELECT JSON_ARRAYAGG(JSON_OBJECT(
          'module', m.module,
          'status', m.status,
          'failed', IF(m.status = 'failed', 1, 0)
        ))
        FROM brand_analysis_module m
        WHERE m.analysis_id = j.id
      ) AS modules_json,
      (
        SELECT JSON_OBJECT(
          'matched', v.matched,
          'name', v.name,
          'logoUrl', v.logo_url,
          'description', v.description,
          'tagline', v.tagline
        )
        FROM brand_vnoc v
        WHERE v.analysis_id = j.id
        ORDER BY v.id DESC
        LIMIT 1
      ) AS vnoc_json,
      (
        SELECT JSON_OBJECT(
          'name', c.name,
          'logoUrl', c.logo_url,
          'faviconUrl', c.favicon_url,
          'title', c.title,
          'metaDescription', c.meta_description,
          'primaryCta', c.primary_cta,
          'colors', c.colors,
          'fonts', c.fonts,
          'products', c.products,
          'services', c.services,
          'pricing', c.pricing,
          'emails', c.emails,
          'phones', c.phones,
          'languages', c.languages,
          'currencies', c.currencies,
          'pagesCrawled', c.pages_crawled
        )
        FROM brand_crawl c
        WHERE c.analysis_id = j.id
        ORDER BY c.id DESC
        LIMIT 1
      ) AS crawl_json,
      (
        SELECT JSON_ARRAYAGG(JSON_OBJECT(
          'platform', s.platform,
          'url', s.url,
          'source', s.source
        ))
        FROM brand_social s
        WHERE s.analysis_id = j.id
      ) AS socials_json,
      (
        SELECT JSON_OBJECT(
          'summary', i.summary,
          'industry', i.industry,
          'icp', i.icp,
          'targetAudience', i.target_audience,
          'products', i.products,
          'usp', i.usp,
          'brandVoice', i.brand_voice,
          'advantages', i.advantages,
          'weaknesses', i.weaknesses,
          'opportunities', i.opportunities,
          'readinessScore', i.readiness_score
        )
        FROM brand_intelligence i
        WHERE i.analysis_id = j.id
        ORDER BY i.id DESC
        LIMIT 1
      ) AS intel_json,
      (
        SELECT JSON_ARRAYAGG(JSON_OBJECT(
          'id', cs.id,
          'kind', cs.kind,
          'name', cs.name,
          'rewardType', cs.reward_type,
          'headline', cs.headline,
          'description', cs.description,
          'payload', cs.payload,
          'predictedConversion', cs.predicted_conversion,
          'predictedReferrals', cs.predicted_referrals,
          'estimatedRoi', cs.estimated_roi,
          'sortOrder', cs.sort_order
        ))
        FROM brand_campaign_suggestion cs
        WHERE cs.analysis_id = j.id
      ) AS campaigns_json
    FROM brand_analysis j
    WHERE j.id = ${id}
    LIMIT 1
  `;

  const row = rows[0];
  if (!row) return null;

  const moduleRows =
    parseJson<Array<{ module: string; status: string; failed: number }>>(row.modules_json) ??
    [];
  const modules: ModuleView[] = moduleRows
    .filter((m): m is { module: ModuleName; status: string; failed: number } =>
      isModuleName(m.module),
    )
    .map((m) => ({
      module: m.module,
      status: (m.status || "pending") as ModuleView["status"],
      error: m.failed ? CLIENT_STEP_ERROR : null,
      labels: MODULE_LABELS[m.module],
    }));

  const vnoc = parseJson<AnalysisStatus["vnoc"]>(row.vnoc_json);
  const crawlRaw = parseJson<AnalysisStatus["crawl"]>(row.crawl_json);
  const crawl = crawlRaw
    ? {
        ...crawlRaw,
        colors: asArr(crawlRaw.colors),
        fonts: asArr(crawlRaw.fonts),
        products: asArr(crawlRaw.products),
        services: asArr(crawlRaw.services),
        pricing: asArr(crawlRaw.pricing),
        emails: asArr(crawlRaw.emails),
        phones: asArr(crawlRaw.phones),
        languages: asArr(crawlRaw.languages),
        currencies: asArr(crawlRaw.currencies),
      }
    : null;
  const intelRaw = parseJson<AnalysisStatus["intelligence"]>(row.intel_json);
  const intelligence = intelRaw
    ? {
        ...intelRaw,
        advantages: asArr(intelRaw.advantages),
        weaknesses: asArr(intelRaw.weaknesses),
        opportunities: asArr(intelRaw.opportunities),
      }
    : null;

  const socials =
    parseJson<AnalysisStatus["socials"]>(row.socials_json)?.filter((s) => s?.platform) ?? [];
  const campaigns = (
    parseJson<Array<AnalysisStatus["campaigns"][number] & { sortOrder?: number }>>(
      row.campaigns_json,
    ) ?? []
  )
    .filter((c) => c?.id)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map(({ sortOrder: _sort, payload, ...c }) => ({
      ...c,
      payload:
        typeof payload === "string"
          ? parseJson<AnalysisStatus["campaigns"][number]["payload"]>(payload)
          : payload,
    }));

  const status = (row.status || "pending") as AnalysisStatus["status"];

  return {
    jobId: row.id,
    memberId: row.member_id,
    status,
    domain: row.domain,
    inputUrl: row.input_url,
    brandId: row.url_id,
    inVnoc: Boolean(row.in_vnoc),
    startedAt: row.started_at ? new Date(row.started_at) : null,
    scores: {
      website: row.website_score,
      social: row.social_score,
      referral: row.referral_score,
      overall: row.overall_health,
    },
    modules,
    vnoc,
    crawl,
    socials,
    intelligence,
    campaigns,
  };
}
