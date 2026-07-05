/** OpenAI-backed brand profile + referral campaign generation. */
import { chatJSON } from "@/lib/openai";

export interface BrandContext {
  domain: string;
  url: string;
  name: string | null;
  description: string | null;
  tagline: string | null;
  title: string | null;
  metaDescription: string | null;
  products: string[];
  services: string[];
  pricing: string[];
  primaryCta: string | null;
  languages: string[];
  currencies: string[];
  socials: { platform: string; url: string }[];
  inVnoc: boolean;
}

export interface BrandProfile {
  summary: string;
  industry: string;
  icp: string;
  targetAudience: string;
  products: string;
  usp: string;
  brandVoice: string;
  advantages: string[];
  weaknesses: string[];
  opportunities: string[];
  readinessScore: number;
}

function contextBlock(ctx: BrandContext): string {
  return [
    `Website: ${ctx.url}`,
    `Domain: ${ctx.domain}`,
    ctx.name && `Business name: ${ctx.name}`,
    ctx.tagline && `Tagline: ${ctx.tagline}`,
    (ctx.description || ctx.metaDescription) &&
      `Description: ${ctx.description || ctx.metaDescription}`,
    ctx.products.length && `Products/features seen: ${ctx.products.join("; ")}`,
    ctx.services.length && `Services seen: ${ctx.services.join("; ")}`,
    ctx.pricing.length && `Pricing signals: ${ctx.pricing.join(", ")}`,
    ctx.primaryCta && `Primary call to action: ${ctx.primaryCta}`,
    ctx.currencies.length && `Currencies: ${ctx.currencies.join(", ")}`,
    ctx.languages.length && `Languages: ${ctx.languages.join(", ")}`,
    ctx.socials.length && `Social profiles: ${ctx.socials.map((s) => s.platform).join(", ")}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export async function generateBrandProfile(ctx: BrandContext): Promise<BrandProfile> {
  const prompt = `You are a brand strategist. Analyze the business below and return ONLY valid JSON with these exact keys:
{
  "summary": "2-3 sentence business summary",
  "industry": "primary industry (short)",
  "icp": "ideal customer profile (1-2 sentences)",
  "targetAudience": "who they market to (1-2 sentences)",
  "products": "concise list of core products/services",
  "usp": "unique selling proposition (1 sentence)",
  "brandVoice": "3-5 words describing tone (e.g. 'friendly, confident, expert')",
  "advantages": ["3-5 competitive advantages"],
  "weaknesses": ["2-4 likely weaknesses or gaps"],
  "opportunities": ["3-5 growth opportunities, referral-relevant"],
  "readinessScore": 0-100 integer estimating how ready this brand is to run a referral program (higher = strong existing customers/advocacy potential)
}

Business data:
${contextBlock(ctx)}

Be specific and realistic. Do not invent facts not implied by the data; infer sensibly from the industry.`;

  const raw = await chatJSON<Partial<BrandProfile>>({
    system: "You only output valid JSON. No markdown, no commentary.",
    prompt,
    temperature: 0.6,
    maxTokens: 1200,
  });

  const arr = (v: unknown): string[] =>
    Array.isArray(v) ? v.map((x) => String(x)).filter(Boolean).slice(0, 6) : [];
  const score = Number(raw.readinessScore);

  return {
    summary: String(raw.summary || "").slice(0, 1000),
    industry: String(raw.industry || "").slice(0, 120),
    icp: String(raw.icp || "").slice(0, 600),
    targetAudience: String(raw.targetAudience || "").slice(0, 600),
    products: String(raw.products || "").slice(0, 600),
    usp: String(raw.usp || "").slice(0, 400),
    brandVoice: String(raw.brandVoice || "").slice(0, 120),
    advantages: arr(raw.advantages),
    weaknesses: arr(raw.weaknesses),
    opportunities: arr(raw.opportunities),
    readinessScore: Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : 60,
  };
}

export type CampaignKind = "fast_growth" | "revenue" | "loyalty";

export interface CampaignSuggestion {
  kind: CampaignKind;
  name: string;
  rewardType: string;
  headline: string;
  description: string;
  landingCopy: string;
  emailSequence: string[];
  socialPosts: string[];
  sms: string;
  widgetCopy: string;
  successPage: string;
  fraudTips: string[];
  launchChannels: string[];
  predictedConversion: string;
  predictedReferrals: string;
  estimatedRoi: string;
}

const KIND_META: Record<CampaignKind, string> = {
  fast_growth: "Fast Growth — maximize number of new referred signups quickly",
  revenue: "Revenue Growth — maximize revenue from referred purchases",
  loyalty: "Customer Loyalty — reward and retain existing customers who refer",
};

export async function generateCampaigns(
  ctx: BrandContext,
  profile: BrandProfile
): Promise<CampaignSuggestion[]> {
  const prompt = `You are a referral marketing expert. Design THREE referral campaigns for this business.
Return ONLY valid JSON: { "campaigns": [ ... ] } with exactly 3 items in this order:
1. fast_growth (${KIND_META.fast_growth})
2. revenue (${KIND_META.revenue})
3. loyalty (${KIND_META.loyalty})

Each campaign object must have these exact keys:
{
  "kind": "fast_growth|revenue|loyalty",
  "name": "campaign name",
  "rewardType": "one of: coupon, cash, custom, redirect (choose best fit)",
  "headline": "hero headline",
  "description": "1-2 sentence description",
  "landingCopy": "landing page paragraph",
  "emailSequence": ["2-3 short email bodies"],
  "socialPosts": ["2-3 social post captions"],
  "sms": "one SMS message",
  "widgetCopy": "short widget headline + subtext",
  "successPage": "post-referral thank-you message",
  "fraudTips": ["2-3 fraud-prevention recommendations"],
  "launchChannels": ["3-4 recommended launch channels"],
  "predictedConversion": "e.g. '8-12%'",
  "predictedReferrals": "e.g. '120-200/mo'",
  "estimatedRoi": "e.g. '4.5x' or '$12k/mo'"
}

Business:
${contextBlock(ctx)}

Brand profile:
- Industry: ${profile.industry}
- ICP: ${profile.icp}
- USP: ${profile.usp}
- Brand voice: ${profile.brandVoice}
- Referral readiness: ${profile.readinessScore}/100

Match the brand voice. Be concrete and realistic with predictions.`;

  const raw = await chatJSON<{ campaigns?: Partial<CampaignSuggestion>[] }>({
    system: "You only output valid JSON. No markdown.",
    prompt,
    temperature: 0.7,
    maxTokens: 3500,
  });

  const kinds: CampaignKind[] = ["fast_growth", "revenue", "loyalty"];
  const list = Array.isArray(raw.campaigns) ? raw.campaigns : [];
  const arr = (v: unknown, max: number): string[] =>
    Array.isArray(v) ? v.map((x) => String(x)).filter(Boolean).slice(0, max) : [];

  return kinds.map((kind, i) => {
    const c = list[i] || list.find((x) => x.kind === kind) || {};
    return {
      kind,
      name: String(c.name || KIND_META[kind].split(" — ")[0]).slice(0, 200),
      rewardType: normalizeReward(String(c.rewardType || "coupon")),
      headline: String(c.headline || "").slice(0, 300),
      description: String(c.description || "").slice(0, 600),
      landingCopy: String(c.landingCopy || "").slice(0, 1500),
      emailSequence: arr(c.emailSequence, 4),
      socialPosts: arr(c.socialPosts, 4),
      sms: String(c.sms || "").slice(0, 320),
      widgetCopy: String(c.widgetCopy || "").slice(0, 500),
      successPage: String(c.successPage || "").slice(0, 500),
      fraudTips: arr(c.fraudTips, 4),
      launchChannels: arr(c.launchChannels, 5),
      predictedConversion: String(c.predictedConversion || "").slice(0, 30),
      predictedReferrals: String(c.predictedReferrals || "").slice(0, 30),
      estimatedRoi: String(c.estimatedRoi || "").slice(0, 60),
    };
  });
}

function normalizeReward(v: string): string {
  const n = v.toLowerCase();
  if (n.includes("cash")) return "cash";
  if (n.includes("custom")) return "custom";
  if (n.includes("redirect")) return "redirect";
  return "coupon";
}
