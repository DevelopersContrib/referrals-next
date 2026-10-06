import { prisma } from "@/lib/prisma";
import { isBrandGrowthEntitled } from "@/lib/member-subscription";

/** Shown on public /p/ pages when the campaign is draft or billing has lapsed. */
export const CAMPAIGN_NOT_LIVE_PUBLIC_MESSAGE =
  "This campaign isn't live yet.";

export type CampaignSurfaceState = "draft" | "live" | "paused";

export function campaignSurfaceState(
  publish: string | null | undefined,
  brandPaid: boolean,
): CampaignSurfaceState {
  if (publish !== "public") return "draft";
  if (!brandPaid) return "paused";
  return "live";
}

export function campaignSurfaceLabel(state: CampaignSurfaceState): string {
  switch (state) {
    case "live":
      return "Live";
    case "paused":
      return "Paused";
    default:
      return "Draft";
  }
}

export async function isCampaignPubliclyLive(campaign: {
  publish?: string | null;
  url_id: number;
}): Promise<boolean> {
  if (campaign.publish !== "public") return false;
  return isBrandGrowthEntitled(campaign.url_id);
}

export async function getCampaignSurfaceState(campaign: {
  publish?: string | null;
  url_id: number;
}): Promise<CampaignSurfaceState> {
  const paid = await isBrandGrowthEntitled(campaign.url_id);
  return campaignSurfaceState(campaign.publish, paid);
}

/** After payment (or when already entitled), mark the campaign public. */
export async function publishCampaignGoLive(opts: {
  memberId: number;
  campaignId: number;
  brandId: number;
}): Promise<{ ok: true } | { ok: false; reason: "not_found" | "payment_required" }> {
  const campaign = await prisma.member_campaigns.findFirst({
    where: {
      id: opts.campaignId,
      member_id: opts.memberId,
      url_id: opts.brandId,
    },
    select: { id: true, publish: true },
  });
  if (!campaign) return { ok: false, reason: "not_found" };
  if (!(await isBrandGrowthEntitled(opts.brandId))) {
    return { ok: false, reason: "payment_required" };
  }
  if (campaign.publish !== "public") {
    await prisma.member_campaigns.update({
      where: { id: campaign.id },
      data: { publish: "public" },
    });
  }
  return { ok: true };
}

/** Unpublish public campaigns when brand billing lapses (participants/data kept). */
export async function pauseBrandCampaignsWhenUnpaid(brandId: number) {
  if (await isBrandGrowthEntitled(brandId)) return;
  await prisma.member_campaigns.updateMany({
    where: { url_id: brandId, publish: "public" },
    data: { publish: "private" },
  });
}
