import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/brand-access";
import { getRewardKind } from "@/lib/reward-types";
import {
  isMemberOnPaidPlan,
  subscriptionRequiredResponse,
} from "@/lib/member-subscription";

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

  const paid = await isMemberOnPaidPlan(memberId);
  const resolvedPublish =
    body.publish === "public" || body.publish === "private"
      ? body.publish
      : paid
        ? "public"
        : "private";
  if (resolvedPublish === "public" && !paid) {
    return subscriptionRequiredResponse();
  }

  // Resolve campaign type + reward type from reference tables.
  const [types, rewardTypes, crawl, intel, vnoc] = await Promise.all([
    prisma.campaign_types.findMany({ orderBy: { id: "asc" } }),
    prisma.reward_types.findMany({ orderBy: { id: "asc" } }),
    prisma.brand_crawl.findFirst({ where: { analysis_id: id }, orderBy: { id: "desc" } }),
    prisma.brand_intelligence.findFirst({ where: { analysis_id: id }, orderBy: { id: "desc" } }),
    prisma.brand_vnoc.findFirst({ where: { analysis_id: id }, orderBy: { id: "desc" } }),
  ]);

  if (types.length === 0 || rewardTypes.length === 0) {
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

  const payload = (suggestion.payload || {}) as {
    widgetCopy?: string;
    successPage?: string;
    emailSequence?: string[];
    landingCopy?: string;
  };

  const name = (suggestion.name || `${brand.domain} referral program`).slice(0, 200);
  const emailBody = Array.isArray(payload.emailSequence) ? payload.emailSequence[0] : undefined;

  // 1. Campaign
  const campaign = await prisma.member_campaigns.create({
    data: {
      name,
      type_id: type.id,
      url_id: brand.id,
      member_id: memberId,
      reward_type: reward.id,
      goal_type: "signup",
      num_signups: 3,
      reward_notify_subject: `You earned a reward from ${brand.domain}`.slice(0, 200),
      reward_notify_message: (payload.successPage || suggestion.description || "").slice(0, 2000) || null,
      campaign_entry_subject: (suggestion.headline || name).slice(0, 200),
      campaign_entry_message: (emailBody || payload.landingCopy || suggestion.description || "").slice(0, 2000) || null,
      publish: resolvedPublish,
      date_added: new Date(),
    },
  });

  // 2. Widget — colors come from the brand's saved palette when available,
  //    otherwise we derive one from the crawl so the widget is on-brand.
  const hadBrandColors = Object.keys(paletteFromBrandColors(brand.brand_colors)).length > 0;
  const palette = hadBrandColors
    ? paletteFromBrandColors(brand.brand_colors)
    : paletteFromCrawl(crawl);
  const primaryColor = stripHash(palette.primary, "6366f1");
  const buttonColor = stripHash(palette.accent || palette.secondary || palette.primary, primaryColor);
  const widgetDesc =
    (payload.widgetCopy || suggestion.description || `Join ${name} and earn rewards!`).slice(0, 65000);
  await prisma.campaign_widget.create({
    data: {
      campaign_id: campaign.id,
      header_title: (suggestion.headline || name).slice(0, 200),
      description: widgetDesc,
      button_text: "Join Now",
      color: primaryColor,
      button_color: buttonColor,
      ...(palette.text ? { text_color: stripHash(palette.text) } : {}),
    },
  });

  // 3. Reward (light seed; user can refine specifics in the editor)
  const kind = getRewardKind(reward.name);
  await prisma.campaign_reward.create({
    data: {
      campaign_id: campaign.id,
      custom_message:
        kind === "custom"
          ? (suggestion.description || payload.successPage || "").slice(0, 2000) || null
          : null,
    },
  });

  // 4. Finalize the brand: authoritative logo, slug, description.
  const logo = vnoc?.logo_url || crawl?.logo_url || null;
  const description = intel?.summary || vnoc?.description || crawl?.meta_description || null;
  const slugBase = intel?.industry ? brand.domain.split(".")[0] : brand.domain.split(".")[0];
  await prisma.member_urls.update({
    where: { id: brand.id },
    data: {
      ...(logo ? { logo_url: logo.slice(0, 200) } : {}),
      ...(description ? { description: description.slice(0, 2000) } : {}),
      ...(brand.slug ? {} : { slug: slugify(slugBase).slice(0, 100) }),
      // Persist the derived palette so the brand "owns" its colors going forward.
      ...(!hadBrandColors && Object.keys(palette).length > 0
        ? { brand_colors: palette }
        : {}),
    },
  });

  return NextResponse.json(
    { campaignId: campaign.id, brandId: brand.id, publish: resolvedPublish },
    { status: 201 }
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

/** Strip the leading '#' for storage in the widget color columns. */
function stripHash(hex: string | undefined, fallback = "6366f1"): string {
  return hex ? hex.replace(/^#/, "").toLowerCase() : fallback;
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
