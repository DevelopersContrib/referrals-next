import { prisma } from "@/lib/prisma";

export type PublicCampaignBrand = {
  id: number;
  domain: string;
  slug: string | null;
};

export type PublicCampaignRecord = {
  id: number;
  name: string;
  url_id: number;
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
};

export async function fetchPublicCampaignViewData(
  slug: string,
  campaignIdStr: string
): Promise<PublicCampaignViewPayload | null> {
  const brand = await prisma.member_urls.findFirst({
    where: { slug },
    select: { id: true, domain: true, slug: true },
  });
  if (!brand) return null;

  const campaignId = parseInt(campaignIdStr, 10);
  if (Number.isNaN(campaignId)) return null;

  const campaign = await prisma.member_campaigns.findUnique({
    where: { id: campaignId },
    select: { id: true, name: true, url_id: true },
  });
  if (!campaign || campaign.url_id !== brand.id) return null;

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
  const participants =
    topSharerIds.length > 0
      ? await prisma.campaign_participants.findMany({
          where: { campaign_id: campaign.id, participant_id: { in: topSharerIds } },
          select: { participant_id: true, name: true },
        })
      : [];

  const participantMap = new Map<number, PublicCampaignParticipant>();
  for (const p of participants) {
    if (p.participant_id != null) {
      participantMap.set(p.participant_id, {
        participant_id: p.participant_id,
        name: p.name,
      });
    }
  }

  const totalClicks = topSharers.reduce((sum, s) => sum + (s.clicks || 0), 0);

  return {
    brand,
    campaign,
    participantCount,
    topSharers,
    participantMap,
    totalClicks,
  };
}
