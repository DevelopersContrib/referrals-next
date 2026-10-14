import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uniqueBrandSlug } from "@/lib/brand-access";
import { getRewardKind } from "@/lib/reward-types";
import {
  isBrandGrowthEntitled,
  isVnocBrand,
} from "@/lib/member-subscription";
import { DEFAULT_PAID_PLAN_ID } from "@/lib/billing-constants";
import {
  readSuggestionPayload,
  stripFancy,
  widgetSeedFromSuggestion,
} from "@/lib/analysis/apply-campaign-suggestion";

export const dynamic = "force-dynamic";

interface LaunchBody {
  suggestionId?: number;
  publish?: "public" | "private";
}

// POST /api/brands/analyze/[jobId]/launch
// Turns a chosen AI campaign suggestion into a real campaign and finalizes the brand.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const memberId = parseInt(session.user.id, 10);

  const { jobId } = await params;
  const id = parseInt(jobId, 10);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: LaunchBody;
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  try {
    return await launchCampaign(id, memberId, body);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(
      `[campaign-launch] brandAnalysis=${id} member=${memberId} suggestion=${body.suggestionId ?? "auto"}`,
      msg,
      err instanceof Error ? err.stack : "",
    );
    return NextResponse.json(
      { error: "Could not save this campaign. Please try again." },
      { status: 500 },
    );
  }
}

/** Sanitize AI-generated text for MySQL latin1 columns. */
function safe(text: string | null | undefined, maxLen: number): string {
  if (!text) return "";
  return stripFancy(text).slice(0, maxLen);
}

async function launchCampaign(id: number, memberId: number, body: LaunchBody) {
  const job = await prisma.brand_analysis.findUnique({ where: { id } });
  if (!job || job.member_id !== memberId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!job.url_id) {
    return NextResponse.json({ error: "This analysis has no brand attached." }, { status: 400 });
  }

  const brand = await prisma.member_urls.findFirst({
    where: { id: job.url_id, member_id: memberId },
  });
  if (!brand) {
    return NextResponse.json({ error: "Brand not found" }, { status: 403 });
  }

  const suggestion = body.suggestionId
    ? await prisma.brand_campaign_suggestion.findFirst({
        where: { id: body.suggestionId, analysis_id: id },
      })
    : await prisma.brand_campaign_suggestion.findFirst({
        where: { analysis_id: id },
        orderBy: { sort_order: "asc" },
      });
  if (!suggestion) {
    return NextResponse.json({ error: "No campaign suggestion found" }, { status: 404 });
  }

  const vnoc = isVnocBrand(brand);
  const paid = vnoc || (await isBrandGrowthEntitled(brand.id));
  const resolvedPublish: "public" | "private" =
    body.publish === "public" || body.publish === "private"
      ? body.publish
      : paid
        ? "public"
        : "private";

  if (resolvedPublish === "public" && !paid) {
    const checkoutUrl = `/billing/plan/${DEFAULT_PAID_PLAN_ID}?brandId=${brand.id}`;
    return NextResponse.json(
      {
        error: "Pay $9/mo for this brand to go live.",
        code: "REQUIRES_SUBSCRIPTION",
        checkoutUrl,
      },
      { status: 402 },
    );
  }

  // Resolve campaign type + reward type from reference tables.
  const [types, rewardTypes, crawl, intel, vnocRow] = await Promise.all([
    prisma.campaign_types.findMany({ orderBy: { id: "asc" } }),
    prisma.reward_types.findMany({ orderBy: { id: "asc" } }),
    prisma.brand_crawl.findFirst({ where: { analysis_id: id }, orderBy: { id: "desc" } }),
    prisma.brand_intelligence.findFirst({ where: { analysis_id: id }, orderBy: { id: "desc" } }),
    prisma.brand_vnoc.findFirst({ where: { analysis_id: id }, orderBy: { id: "desc" } }),
  ]);

  if (types.length === 0 || rewardTypes.length === 0) {
    console.error("[campaign-launch] reference data missing: campaign_types or reward_types empty");
    return NextResponse.json(
      { error: "Campaign or reward types are not configured." },
      { status: 500 }
    );
  }

  const type =
    types.find((t) => /refer|standard|signup/i.test(t.name || "")) || types[0];

  const wantedKind = (suggestion.reward_type || "coupon").toLowerCase();
  const reward =
    rewardTypes.find((r) => (r.name || "").toLowerCase().includes(wantedKind)) ||
    rewardTypes.find((r) => /custom/i.test(r.name || "")) ||
    rewardTypes[0];

  const payload = readSuggestionPayload(suggestion.payload);
  const name = safe(suggestion.name, 200) || `${brand.domain} referral program`.slice(0, 200);
  const emailBody = Array.isArray(payload.emailSequence) ? payload.emailSequence[0] : undefined;
  const seed = widgetSeedFromSuggestion({
    kind: suggestion.kind,
    headline: suggestion.headline,
    name,
    description: suggestion.description,
    payload,
    crawlColors: crawl?.colors,
    brandColors: brand.brand_colors,
  });

  console.log(
    `[campaign-launch] creating campaign: brand=${brand.id} analysis=${id} suggestion=${suggestion.id} publish=${resolvedPublish} paid=${paid}`,
  );

  // 1. Campaign
  const campaign = await prisma.member_campaigns.create({
    data: {
      name,
      type_id: type.id,
      url_id: brand.id,
      member_id: memberId,
      reward_type: reward.id,
      goal_type: payload.goalType === "visit" ? "visit" : "signup",
      num_visits: payload.goalType === "visit" ? 5 : null,
      num_signups: payload.goalType === "visit" ? null : 3,
      reward_notify_subject: safe(`You earned a reward from ${brand.domain}`, 200),
      reward_notify_message: safe(payload.successPage || suggestion.description, 2000) || null,
      campaign_entry_subject: safe(suggestion.headline || name, 200),
      campaign_entry_message: safe(emailBody || payload.landingCopy || suggestion.description, 2000) || null,
      publish: resolvedPublish,
      date_added: new Date(),
    },
  });

  // 2. Widget — AI copy + kind accent (crawl black is text, not the CTA).
  const hadBrandColors = Object.keys(paletteFromBrandColors(brand.brand_colors)).length > 0;
  const palette = hadBrandColors
    ? paletteFromBrandColors(brand.brand_colors)
    : paletteFromCrawl(crawl);
  await prisma.campaign_widget.create({
    data: {
      campaign_id: campaign.id,
      header_title: safe(seed.header_title, 100),
      description: safe(seed.description, 65000),
      body_text: safe(seed.body_text, 65000) || null,
      success_message: safe(seed.success_message, 65000) || null,
      button_text: safe(seed.button_text, 100),
      join_button_text: safe(seed.join_button_text, 200),
      color: seed.color,
      button_color: seed.button_color,
      text_color: seed.text_color,
      header_font_color: seed.header_font_color,
      header_description_color: seed.header_description_color,
      background_type: seed.background_type,
      background_color: seed.background_color,
      template_id: seed.template_id,
      ...(seed.banner_image_url ? { banner_image_url: seed.banner_image_url } : {}),
    },
  });

  if (seed.shareText) {
    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") || "https://referrals.com"}/widget/${campaign.id}`.slice(0, 200);
    await prisma.campaign_social_content.create({
      data: {
        campaign_id: campaign.id,
        url: shareUrl,
        description: safe(seed.shareText, 65000),
        ...(seed.banner_image_url && seed.banner_image_url.length <= 500
          ? { image_url: seed.banner_image_url }
          : {}),
      },
    });
  }

  // 3. Reward (seed cash amount / custom copy from the AI card).
  const kind = getRewardKind(reward.name);
  await prisma.campaign_reward.create({
    data: {
      campaign_id: campaign.id,
      custom_message:
        kind === "custom"
          ? safe(suggestion.description || payload.successPage, 2000) || null
          : null,
      ...(kind === "cash" && seed.cashHint ? { cash_value: seed.cashHint } : {}),
    },
  });

  // 4. Finalize the brand: authoritative logo, slug, description.
  const logo = vnocRow?.logo_url || crawl?.logo_url || null;
  const description = intel?.summary || vnocRow?.description || crawl?.meta_description || null;
  let nextSlug = brand.slug?.trim() || "";
  if (nextSlug) {
    const slugTaken = await prisma.member_urls.findFirst({
      where: { slug: nextSlug, NOT: { id: brand.id } },
      select: { id: true },
    });
    if (slugTaken) nextSlug = "";
  }
  if (!nextSlug) {
    nextSlug = await uniqueBrandSlug(brand.domain || "brand", brand.id);
  }
  await prisma.member_urls.update({
    where: { id: brand.id },
    data: {
      ...(logo ? { logo_url: logo.slice(0, 200) } : {}),
      ...(description ? { description: safe(description, 2000) } : {}),
      slug: nextSlug,
      ...(!hadBrandColors && Object.keys(palette).length > 0
        ? { brand_colors: { ...palette, accent: `#${seed.color}` } }
        : !hadBrandColors
          ? { brand_colors: { primary: `#${seed.text_color}`, accent: `#${seed.color}` } }
          : {}),
    },
  });

  console.log(
    `[campaign-launch] success: campaign=${campaign.id} brand=${brand.id} publish=${resolvedPublish} paid=${paid}`,
  );

  return NextResponse.json(
    { campaignId: campaign.id, brandId: brand.id, publish: resolvedPublish },
    { status: 201 },
  );
}

const PALETTE_ROLES = ["primary", "secondary", "accent", "background", "text"] as const;
type Palette = Partial<Record<(typeof PALETTE_ROLES)[number], string>>;

function crawlColors(crawl: { colors?: unknown } | null): string[] {
  return crawl && Array.isArray(crawl.colors) ? (crawl.colors as string[]) : [];
}

/** Normalize any hex-ish value to '#rrggbb', or undefined if invalid. */
function normalizeHex(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const s = v.trim().replace(/^#/, "");
  return /^[0-9a-fA-F]{6}$/.test(s) ? `#${s.toLowerCase()}` : undefined;
}

function paletteFromBrandColors(bc: unknown): Palette {
  const out: Palette = {};
  if (bc && typeof bc === "object") {
    for (const role of PALETTE_ROLES) {
      const hex = normalizeHex((bc as Record<string, unknown>)[role]);
      if (hex) out[role] = hex;
    }
  }
  return out;
}

function paletteFromCrawl(crawl: { colors?: unknown } | null): Palette {
  const cols = crawlColors(crawl)
    .map(normalizeHex)
    .filter((c): c is string => Boolean(c));
  const out: Palette = {};
  if (cols[0]) out.primary = cols[0];
  if (cols[1]) out.secondary = cols[1];
  if (cols[2]) out.accent = cols[2];
  return out;
}
