import { prisma } from "@/lib/prisma";
import { memberMustShowBranding } from "@/lib/member-subscription";
import {
  kindLook,
  readSuggestionPayload,
} from "@/lib/analysis/apply-campaign-suggestion";
import { isCampaignDesign, type CampaignDesignStyle } from "@/lib/analysis/campaign-design";

export type PublicCampaignBrand = {
  id: number;
  domain: string;
  slug: string | null;
  logo_url: string | null;
};

export type PublicCampaignRecord = {
  id: number;
  name: string;
  url_id: number;
  headline: string | null;
  pitch: string | null;
  landing: string | null;
};

export type PublicCampaignShareRow = {
  id: number;
  participant_id: number;
  clicks: number | null;
};

export type PublicCampaignParticipant = {
  participant_id: number;
  name: string | null;
};

export type PublicCampaignViewPayload = {
  brand: PublicCampaignBrand;
  campaign: PublicCampaignRecord;
  participantCount: number;
  topSharers: PublicCampaignShareRow[];
  participantMap: Map<number, PublicCampaignParticipant>;
  totalClicks: number;
  showBranding: boolean;
  accentFrom: string;
  accentTo: string;
  rewardLabel: string | null;
  buttonText: string;
  launchChannels: string[];
  snippets: { title: string; text: string }[];
  heroImageUrl: string | null;
  designStyle: CampaignDesignStyle | null;
};

/** Newest brand wins when slugs collide (same domain, multiple member_urls). */
export async function findPublicBrandBySlug(slug: string) {
  const numericId = parseInt(slug, 10);
  if (!Number.isNaN(numericId)) {
    const byId = await prisma.member_urls.findUnique({ where: { id: numericId } });
    if (byId) return byId;
  }
  return prisma.member_urls.findFirst({
    where: { slug },
    orderBy: { id: "desc" },
  });
}

function slugMatchesBrand(
  slug: string,
  brand: { id: number; slug: string | null; domain: string }
) {
  const numericId = parseInt(slug, 10);
  if (!Number.isNaN(numericId) && brand.id === numericId) return true;
  if (brand.slug && brand.slug === slug) return true;
  const domainBase = brand.domain.replace(/^www\./i, "").split(".")[0];
  return domainBase.toLowerCase() === slug.toLowerCase();
}

export async function fetchPublicCampaignViewData(
  slug: string,
  campaignIdStr: string
): Promise<PublicCampaignViewPayload | null> {
  const campaignId = parseInt(campaignIdStr, 10);
  if (Number.isNaN(campaignId)) return null;

  // Campaign first — duplicate slugs (e.g. two blacksesameph rows) must not 404
  // a live campaign that belongs to the newer brand.
  const campaign = await prisma.member_campaigns.findUnique({
    where: { id: campaignId },
    select: { id: true, name: true, url_id: true, member_id: true },
  });
  if (!campaign) return null;

  const brand = await prisma.member_urls.findUnique({
    where: { id: campaign.url_id },
    select: { id: true, domain: true, slug: true, logo_url: true },
  });
  if (!brand || !slugMatchesBrand(slug, brand)) return null;

  const [widget, reward, analysis] = await Promise.all([
    prisma.campaign_widget.findFirst({
      where: { campaign_id: campaign.id },
      select: {
        header_title: true,
        description: true,
        body_text: true,
        color: true,
        button_color: true,
        button_text: true,
        join_button_text: true,
        banner_image_url: true,
      },
    }),
    prisma.campaign_reward.findFirst({
      where: { campaign_id: campaign.id },
      select: { cash_value: true, custom_message: true },
    }),
    prisma.brand_analysis.findFirst({
      where: { url_id: brand.id },
      orderBy: { id: "desc" },
      select: { id: true },
    }),
  ]);

  const suggestion = analysis
    ? await prisma.brand_campaign_suggestion.findFirst({
        where: {
          analysis_id: analysis.id,
          OR: [
            { name: campaign.name },
            { headline: widget?.header_title || undefined },
          ],
        },
        orderBy: { id: "desc" },
        select: { kind: true, payload: true },
      })
    : null;

  const showBranding = await memberMustShowBranding(campaign.member_id);

  const participantCount = await prisma.campaign_participants.count({
    where: { campaign_id: campaign.id },
  });

  const topSharers = await prisma.participants_share.findMany({
    where: { campaign_id: campaign.id },
    orderBy: { clicks: "desc" },
    take: 10,
    select: { id: true, participant_id: true, clicks: true },
  });

  const topSharerIds = topSharers.map((s) => s.participant_id);
  // participants_share.participant_id stores campaign_participants.id (not global participants.id)
  const participants =
    topSharerIds.length > 0
      ? await prisma.campaign_participants.findMany({
          where: { campaign_id: campaign.id, id: { in: topSharerIds } },
          select: { id: true, name: true },
        })
      : [];

  const participantMap = new Map<number, PublicCampaignParticipant>();
  for (const p of participants) {
    participantMap.set(p.id, {
      participant_id: p.id,
      name: p.name,
    });
  }

  const totalClicks = topSharers.reduce((sum, s) => sum + (s.clicks || 0), 0);
  const look = kindLook(suggestion?.kind);
  const payload = readSuggestionPayload(suggestion?.payload);
  const accent = suggestion?.kind
    ? { from: look.from, to: look.to }
    : toAccent(widget?.button_color || widget?.color);
  const snippets = [
    payload.emailSequence?.[0] && { title: "Email", text: payload.emailSequence[0] },
    payload.socialPosts?.[0] && { title: "Social", text: payload.socialPosts[0] },
    payload.sms && { title: "SMS", text: payload.sms },
  ].filter(Boolean) as { title: string; text: string }[];

  return {
    brand,
    campaign: {
      id: campaign.id,
      name: campaign.name,
      url_id: campaign.url_id,
      headline: widget?.header_title || campaign.name,
      pitch: widget?.description || null,
      landing: widget?.body_text || payload.landingCopy || null,
    },
    participantCount,
    topSharers,
    participantMap,
    totalClicks,
    showBranding,
    accentFrom: accent.from,
    accentTo: accent.to,
    rewardLabel: reward?.cash_value
      ? `$${reward.cash_value} cash per referral`
      : reward?.custom_message
        ? reward.custom_message.slice(0, 80)
        : null,
    buttonText: widget?.join_button_text || widget?.button_text || look.cta,
    launchChannels: payload.launchChannels || [],
    snippets,
    heroImageUrl: widget?.banner_image_url || payload.bannerImageUrl || null,
    designStyle: isCampaignDesign(payload.designStyle) ? payload.designStyle : null,
  };
}

function toAccent(raw: string | null | undefined): { from: string; to: string } {
  const hex = raw?.trim().replace(/^#/, "") || "10b981";
  const from = /^[0-9a-fA-F]{6}$/.test(hex) ? `#${hex.toLowerCase()}` : "#10b981";
  return { from, to: from };
}
