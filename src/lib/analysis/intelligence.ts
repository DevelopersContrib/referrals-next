/** OpenAI-backed brand profile + referral campaign generation. */
import { chatJSON } from "@/lib/openai";
import { DESIGN_META, type CampaignDesignStyle } from "./campaign-design";

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
    timeoutMs: 15_000,
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

export type CampaignBrief = {
  goalKind: CampaignKind;
  goalType: "visit" | "signup";
  color: string;
  copyTone: string;
  designStyle: CampaignDesignStyle;
  wantImage?: boolean;
};

export async function generateCampaigns(
  ctx: BrandContext,
  profile: BrandProfile,
  brief?: CampaignBrief
): Promise<CampaignSuggestion[]> {
  const briefBlock = brief
    ? `

The member already chose:
- Goal focus: ${KIND_META[brief.goalKind]} — make this campaign FIRST and the strongest
- Reward unlocks after: ${brief.goalType === "visit" ? "tracked referral visits" : "friend signups"}
- Primary brand color: ${brief.color}
- Page design: ${DESIGN_META[brief.designStyle].label} — ${DESIGN_META[brief.designStyle].copyHint}
- Copy tone: ${brief.copyTone}

Write all copy in that tone and design. Still return exactly 3 campaigns.`
    : "";

  const order = brief
    ? [brief.goalKind, ...(["fast_growth", "revenue", "loyalty"] as CampaignKind[]).filter((k) => k !== brief.goalKind)]
    : (["fast_growth", "revenue", "loyalty"] as CampaignKind[]);

  const prompt = `You are a referral marketing expert. Design THREE referral campaigns for this business.
Return ONLY valid JSON: { "campaigns": [ ... ] } with exactly 3 items in this order:
${order.map((k, i) => `${i + 1}. ${k} (${KIND_META[k]})`).join("\n")}${briefBlock}

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
    timeoutMs: 25_000,
  });

  const kinds: CampaignKind[] = brief
    ? [brief.goalKind, ...(["fast_growth", "revenue", "loyalty"] as CampaignKind[]).filter((k) => k !== brief.goalKind)]
    : ["fast_growth", "revenue", "loyalty"];
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

export function profileFromContext(ctx: BrandContext): BrandProfile {
  const name = ctx.name || ctx.domain;
  const services = [...ctx.services, ...ctx.products].filter(Boolean);
  return {
    summary:
      ctx.description ||
      ctx.metaDescription ||
      ctx.tagline ||
      `${name} can grow through customer referrals.`,
    industry: "General",
    icp: services[0] ? `People who need ${services[0]}` : "Existing customers",
    targetAudience: services.length
      ? services.slice(0, 3).join(", ")
      : "Customers who already know the brand",
    products: services.join(", ") || name,
    usp: ctx.tagline || ctx.primaryCta || `${name} worth sharing`,
    brandVoice: "clear, friendly, specific",
    advantages: services.slice(0, 3),
    weaknesses: [],
    opportunities: ["Turn happy customers into a referral channel"],
    readinessScore: 55,
  };
}

const FALLBACK_COPY: Record<
  CampaignKind,
  { name: string; headline: string; rewardType: string }
> = {
  fast_growth: {
    name: "Invite friends",
    headline: "Share it with a friend",
    rewardType: "coupon",
  },
  revenue: {
    name: "Referral rewards",
    headline: "Earn when a friend gets started",
    rewardType: "cash",
  },
  loyalty: {
    name: "Thank your customers",
    headline: "A thank-you for spreading the word",
    rewardType: "coupon",
  },
};

/** Usable campaigns when OpenAI is down or the brand profile never finished. */
export function fallbackCampaigns(
  ctx: BrandContext,
  brief?: CampaignBrief,
): CampaignSuggestion[] {
  const name = ctx.name || ctx.domain;
  const tone = brief?.copyTone || "friendly and clear";
  const kinds: CampaignKind[] = brief
    ? [
        brief.goalKind,
        ...(["fast_growth", "revenue", "loyalty"] as CampaignKind[]).filter(
          (k) => k !== brief.goalKind,
        ),
      ]
    : ["fast_growth", "revenue", "loyalty"];

  return kinds.map((kind) => {
    const meta = FALLBACK_COPY[kind];
    const headline = `${meta.headline} — ${name}`;
    return {
      kind,
      name: `${name} ${meta.name}`,
      rewardType: meta.rewardType,
      headline,
      description: `A ${tone} referral program for ${name}. Friends join, and you reward the person who sent them.`,
      landingCopy: `${name} grows when customers tell people they trust. Share your link and earn a reward when a friend takes the next step.`,
      emailSequence: [
        `Know someone who would like ${name}? Send them your link.`,
        `Your referral link is ready. One share is enough to get started.`,
      ],
      socialPosts: [`I use ${name}. Here's my link if you want to try it.`],
      sms: `Try ${name} with my link.`,
      widgetCopy: headline,
      successPage: `You're in. We'll let the person who invited you know.`,
      fraudTips: ["One reward per new customer", "Ignore duplicate emails"],
      launchChannels: ["Website widget", "Email", "Social"],
      predictedConversion: "5-10%",
      predictedReferrals: "Varies",
      estimatedRoi: "—",
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
