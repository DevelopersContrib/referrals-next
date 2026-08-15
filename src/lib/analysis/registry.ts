/** Maps each module name to a runner that reads inputs from the DB and writes its result table. */
import type { brand_analysis } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hasOpenAI } from "@/lib/openai";
import type { DiscoveredSocial, ModuleName, ModuleRunner } from "./types";
import { lookupVnocDomain } from "./vnoc";
import { crawlSite } from "./crawler";
import { discoverSocialsFromHtml, mergeSocials } from "./social";
import {
  generateBrandProfile,
  generateCampaigns,
  type BrandContext,
  type CampaignBrief,
  type CampaignSuggestion,
} from "./intelligence";
import { generateCampaignHeroImage } from "./campaign-hero-image";

// ── vnoc ──────────────────────────────────────────────────────────────────
const vnocRunner: ModuleRunner = async (analysis) => {
  const match = await lookupVnocDomain(analysis.domain);

  await prisma.brand_vnoc.deleteMany({ where: { analysis_id: analysis.id } });
  await prisma.brand_vnoc.create({
    data: {
      analysis_id: analysis.id,
      matched: match.matched,
      vnoc_domain_id: match.vnocDomainId ?? undefined,
      name: match.name ?? undefined,
      logo_url: match.logoUrl ?? undefined,
      description: match.description ?? undefined,
      tagline: match.tagline ?? undefined,
      socials: match.socials as unknown as object,
      raw: (match.raw ?? undefined) as object | undefined,
    },
  });

  if (match.matched) {
    await prisma.brand_analysis.update({
      where: { id: analysis.id },
      data: { in_vnoc: true, vnoc_id: match.vnocDomainId ?? undefined },
    });
    // Seed the draft brand with authoritative logo + vnoc linkage.
    if (analysis.url_id) {
      await prisma.member_urls.update({
        where: { id: analysis.url_id },
        data: {
          in_vnoc: true,
          vnoc_id: match.vnocDomainId ?? undefined,
          ...(match.logoUrl ? { logo_url: match.logoUrl.slice(0, 200) } : {}),
        },
      });
    }
  }
};

// ── crawl ─────────────────────────────────────────────────────────────────
const crawlRunner: ModuleRunner = async (analysis) => {
  const c = await crawlSite(analysis.input_url);

  await prisma.brand_crawl.deleteMany({ where: { analysis_id: analysis.id } });
  await prisma.brand_crawl.create({
    data: {
      analysis_id: analysis.id,
      name: c.name ?? undefined,
      logo_url: c.logoUrl?.slice(0, 500) ?? undefined,
      favicon_url: c.faviconUrl?.slice(0, 500) ?? undefined,
      title: c.title?.slice(0, 250) ?? undefined,
      meta_description: c.metaDescription ?? undefined,
      primary_cta: c.primaryCta?.slice(0, 250) ?? undefined,
      colors: c.colors as unknown as object,
      fonts: c.fonts as unknown as object,
      products: c.products as unknown as object,
      services: c.services as unknown as object,
      pricing: c.pricing as unknown as object,
      emails: c.emails as unknown as object,
      phones: c.phones as unknown as object,
      addresses: c.addresses as unknown as object,
      languages: c.languages as unknown as object,
      currencies: c.currencies as unknown as object,
      pages_crawled: c.pagesCrawled,
      // Keep homepage/contact HTML so the social module doesn't re-fetch.
      raw: { homepageHtml: c.homepageHtml, contactHtml: c.contactHtml } as object,
    },
  });
};

// ── social ──────────────────────────────────────────────────────────────────
const socialRunner: ModuleRunner = async (analysis) => {
  const crawl = await prisma.brand_crawl.findFirst({
    where: { analysis_id: analysis.id },
    orderBy: { id: "desc" },
  });
  const vnoc = await prisma.brand_vnoc.findFirst({
    where: { analysis_id: analysis.id },
    orderBy: { id: "desc" },
  });

  const raw = (crawl?.raw ?? {}) as { homepageHtml?: string; contactHtml?: string };
  const html = `${raw.homepageHtml || ""}\n${raw.contactHtml || ""}`;
  const crawled = html.trim() ? discoverSocialsFromHtml(html) : [];
  const vnocSocials = ((vnoc?.socials as unknown as DiscoveredSocial[]) || []).map((s) => ({
    ...s,
    source: "vnoc" as const,
  }));

  const merged = mergeSocials(vnocSocials, crawled);

  await prisma.brand_social.deleteMany({ where: { analysis_id: analysis.id } });
  if (merged.length) {
    await prisma.brand_social.createMany({
      data: merged.map((s) => ({
        analysis_id: analysis.id,
        platform: s.platform.slice(0, 40),
        url: s.url.slice(0, 500),
        source: s.source,
        verified: false,
      })),
    });
  }
};

// ── shared context builder for the AI modules ──────────────────────────────
export async function buildContext(analysis: brand_analysis): Promise<BrandContext> {
  const [crawl, vnoc, socials] = await Promise.all([
    prisma.brand_crawl.findFirst({ where: { analysis_id: analysis.id }, orderBy: { id: "desc" } }),
    prisma.brand_vnoc.findFirst({ where: { analysis_id: analysis.id }, orderBy: { id: "desc" } }),
    prisma.brand_social.findMany({ where: { analysis_id: analysis.id } }),
  ]);

  const asArr = (v: unknown): string[] => (Array.isArray(v) ? (v as string[]) : []);

  return {
    domain: analysis.domain,
    url: analysis.input_url,
    // VNOC name/description are authoritative; fall back to crawl.
    name: vnoc?.name || crawl?.name || null,
    description: vnoc?.description || crawl?.meta_description || null,
    tagline: vnoc?.tagline || null,
    title: crawl?.title || null,
    metaDescription: crawl?.meta_description || null,
    products: asArr(crawl?.products),
    services: asArr(crawl?.services),
    pricing: asArr(crawl?.pricing),
    primaryCta: crawl?.primary_cta || null,
    languages: asArr(crawl?.languages),
    currencies: asArr(crawl?.currencies),
    socials: socials.map((s) => ({ platform: s.platform, url: s.url })),
    inVnoc: analysis.in_vnoc,
  };
}

// ── intelligence ────────────────────────────────────────────────────────────
const intelligenceRunner: ModuleRunner = async (analysis) => {
  if (!hasOpenAI()) throw new Error("OPENAI_API_KEY not configured");
  const ctx = await buildContext(analysis);
  const profile = await generateBrandProfile(ctx);

  await prisma.brand_intelligence.deleteMany({ where: { analysis_id: analysis.id } });
  await prisma.brand_intelligence.create({
    data: {
      analysis_id: analysis.id,
      summary: profile.summary,
      industry: profile.industry,
      icp: profile.icp,
      target_audience: profile.targetAudience,
      products: profile.products,
      usp: profile.usp,
      brand_voice: profile.brandVoice,
      advantages: profile.advantages as unknown as object,
      weaknesses: profile.weaknesses as unknown as object,
      opportunities: profile.opportunities as unknown as object,
      readiness_score: profile.readinessScore,
    },
  });
};

// ── campaigns ────────────────────────────────────────────────────────────────
const campaignsRunner: ModuleRunner = async (analysis) => {
  if (!hasOpenAI()) throw new Error("OPENAI_API_KEY not configured");
  const ctx = await buildContext(analysis);
  const intel = await prisma.brand_intelligence.findFirst({
    where: { analysis_id: analysis.id },
    orderBy: { id: "desc" },
  });
  if (!intel) throw new Error("intelligence result missing");

  const profile = {
    summary: intel.summary || "",
    industry: intel.industry || "",
    icp: intel.icp || "",
    targetAudience: intel.target_audience || "",
    products: intel.products || "",
    usp: intel.usp || "",
    brandVoice: intel.brand_voice || "",
    advantages: (intel.advantages as unknown as string[]) || [],
    weaknesses: (intel.weaknesses as unknown as string[]) || [],
    opportunities: (intel.opportunities as unknown as string[]) || [],
    readinessScore: intel.readiness_score || 60,
  };

  const campaigns = await generateCampaigns(ctx, profile);
  await replaceCampaignSuggestions(analysis.id, campaigns);
};

export async function regenerateCampaignsForJob(
  analysisId: number,
  brief: CampaignBrief
) {
  if (!hasOpenAI()) throw new Error("OPENAI_API_KEY not configured");
  const analysis = await prisma.brand_analysis.findUnique({ where: { id: analysisId } });
  if (!analysis) throw new Error("Analysis not found");

  const ctx = await buildContext(analysis);
  const intel = await prisma.brand_intelligence.findFirst({
    where: { analysis_id: analysis.id },
    orderBy: { id: "desc" },
  });
  if (!intel) throw new Error("Brand analysis is still running. Try again in a moment.");

  const profile = {
    summary: intel.summary || "",
    industry: intel.industry || "",
    icp: intel.icp || "",
    targetAudience: intel.target_audience || "",
    products: intel.products || "",
    usp: intel.usp || "",
    brandVoice: intel.brand_voice || "",
    advantages: (intel.advantages as unknown as string[]) || [],
    weaknesses: (intel.weaknesses as unknown as string[]) || [],
    opportunities: (intel.opportunities as unknown as string[]) || [],
    readinessScore: intel.readiness_score || 60,
  };

  const imagePromise =
    brief.wantImage === false
      ? Promise.resolve(null)
      : generateCampaignHeroImage({
          memberId: analysis.member_id,
          domain: analysis.domain,
          industry: intel.industry,
          brandVoice: intel.brand_voice,
          summary: intel.summary,
          color: brief.color,
          copyTone: brief.copyTone,
          goalKind: brief.goalKind,
          designStyle: brief.designStyle,
        });

  const [campaigns, bannerImageUrl] = await Promise.all([
    generateCampaigns(ctx, profile, brief),
    imagePromise,
  ]);
  await replaceCampaignSuggestions(analysis.id, campaigns, brief, bannerImageUrl);
}

async function replaceCampaignSuggestions(
  analysisId: number,
  campaigns: CampaignSuggestion[],
  brief?: CampaignBrief,
  bannerImageUrl?: string | null
) {
  await prisma.brand_campaign_suggestion.deleteMany({ where: { analysis_id: analysisId } });
  await prisma.brand_campaign_suggestion.createMany({
    data: campaigns.map((c: CampaignSuggestion, i) => ({
      analysis_id: analysisId,
      kind: c.kind,
      name: c.name,
      reward_type: c.rewardType,
      headline: c.headline,
      description: c.description,
      payload: {
        landingCopy: c.landingCopy,
        emailSequence: c.emailSequence,
        socialPosts: c.socialPosts,
        sms: c.sms,
        widgetCopy: c.widgetCopy,
        successPage: c.successPage,
        fraudTips: c.fraudTips,
        launchChannels: c.launchChannels,
        ...(brief
          ? {
              accentColor: brief.color,
              goalType: brief.goalType,
              copyTone: brief.copyTone,
              designStyle: brief.designStyle,
            }
          : {}),
        ...(bannerImageUrl ? { bannerImageUrl } : {}),
      } as object,
      predicted_conversion: c.predictedConversion,
      predicted_referrals: c.predictedReferrals,
      estimated_roi: c.estimatedRoi,
      sort_order: i,
    })),
  });
}

export const RUNNERS: Record<ModuleName, ModuleRunner> = {
  vnoc: vnocRunner,
  crawl: crawlRunner,
  social: socialRunner,
  intelligence: intelligenceRunner,
  campaigns: campaignsRunner,
};
