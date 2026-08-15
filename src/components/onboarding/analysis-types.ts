import type { ModuleName } from "@/lib/analysis/types";

export interface ModuleView {
  module: ModuleName;
  status: "pending" | "queued" | "running" | "done" | "failed";
  error: string | null;
  labels: { title: string; active: string; done: string };
}

export interface CampaignView {
  id: number;
  kind: "fast_growth" | "revenue" | "loyalty";
  name: string;
  rewardType: string | null;
  headline: string | null;
  description: string | null;
  payload: {
    landingCopy?: string;
    emailSequence?: string[];
    socialPosts?: string[];
    sms?: string;
    widgetCopy?: string;
    successPage?: string;
    fraudTips?: string[];
    launchChannels?: string[];
    accentColor?: string;
    goalType?: "visit" | "signup";
    copyTone?: string;
    bannerImageUrl?: string;
    designStyle?: "editorial" | "hero" | "minimal" | "warm";
  } | null;
  predictedConversion: string | null;
  predictedReferrals: string | null;
  estimatedRoi: string | null;
}

export interface AnalysisStatus {
  jobId: number;
  status: "pending" | "running" | "done" | "failed";
  domain: string;
  inputUrl: string;
  brandId: number | null;
  inVnoc: boolean;
  scores: {
    website: number | null;
    social: number | null;
    referral: number | null;
    overall: number | null;
  };
  modules: ModuleView[];
  vnoc: {
    matched: boolean;
    name: string | null;
    logoUrl: string | null;
    description: string | null;
    tagline: string | null;
  } | null;
  crawl: {
    name: string | null;
    logoUrl: string | null;
    faviconUrl: string | null;
    title: string | null;
    metaDescription: string | null;
    primaryCta: string | null;
    colors: string[];
    fonts: string[];
    products: string[];
    services: string[];
    pricing: string[];
    emails: string[];
    phones: string[];
    languages: string[];
    currencies: string[];
    pagesCrawled: number | null;
  } | null;
  socials: { platform: string; url: string; source: string }[];
  intelligence: {
    summary: string | null;
    industry: string | null;
    icp: string | null;
    targetAudience: string | null;
    products: string | null;
    usp: string | null;
    brandVoice: string | null;
    advantages: string[];
    weaknesses: string[];
    opportunities: string[];
    readinessScore: number | null;
  } | null;
  campaigns: CampaignView[];
}
