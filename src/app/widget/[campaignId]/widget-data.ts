import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { brandMustShowBranding } from "@/lib/member-subscription";
import { isCampaignPubliclyLive } from "@/lib/campaign-live";

export async function getWidgetData(campaignId: number) {
  const [campaign, widget, reward, socialContent, allowedSocials, leaderboard] =
    await Promise.all([
      prisma.member_campaigns.findUnique({ where: { id: campaignId } }),
      prisma.campaign_widget.findFirst({ where: { campaign_id: campaignId } }),
      prisma.campaign_reward.findFirst({ where: { campaign_id: campaignId } }),
      prisma.campaign_social_content.findFirst({
        where: { campaign_id: campaignId },
      }),
      prisma.campaign_socials_allowed.findMany({
        where: { campaign_id: campaignId },
      }),
      // Top referrers: group invitees by their inviter in a single query,
      // then resolve the inviter names. Avoids an N+1 count-per-participant
      // pattern that exhausts the DB connection pool on large campaigns.
      prisma.campaign_participants
        .groupBy({
          by: ["invited_by"],
          where: { campaign_id: campaignId, invited_by: { not: null } },
          _count: { _all: true },
          orderBy: { _count: { invited_by: "desc" } },
          take: 10,
        })
        .then(async (groups) => {
          if (groups.length === 0) return [];
          const inviterIds = groups
            .map((g) => g.invited_by)
            .filter((id): id is number => id !== null);
          const inviters = await prisma.campaign_participants.findMany({
            where: { id: { in: inviterIds } },
            select: { id: true, name: true },
          });
          const nameById = new Map(inviters.map((i) => [i.id, i.name]));
          return groups
            .map((g) => ({
              name: nameById.get(g.invited_by as number) ?? "Unknown",
              referrals: g._count._all,
            }))
            .filter((e) => e.referrals > 0);
        }),
    ]);

  if (!campaign) return null;

  // Only a published campaign on a paid brand is shown to the public. The
  // signed-in owner can still preview a draft, same rule as widget sign-ups.
  const isLive = await isCampaignPubliclyLive(campaign);
  let canView = isLive;
  if (!isLive) {
    const session = await auth().catch(() => null);
    const viewerId = session?.user?.id ? parseInt(session.user.id, 10) : 0;
    canView = viewerId > 0 && campaign.member_id === viewerId;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://referrals.com";
  const [showBranding, brand] = await Promise.all([
    brandMustShowBranding(campaign.url_id),
    prisma.member_urls.findUnique({
      where: { id: campaign.url_id },
      select: { domain: true, logo_url: true },
    }),
  ]);

  return {
    isLive,
    canView,
    config: {
      campaignId,
      color: widget?.color || undefined,
      headerTitle: widget?.header_title || campaign.name,
      description: widget?.description || undefined,
      buttonText: widget?.button_text || "Join Now",
      buttonColor: widget?.button_color || undefined,
      bannerImageUrl: widget?.banner_image_url || undefined,
      fieldLabel1: widget?.field_label_1 || undefined,
      fieldLabel2: widget?.field_label_2 || undefined,
      textColor: widget?.text_color || undefined,
      backgroundColor: widget?.background_color || undefined,
      backgroundType: widget?.background_type || undefined,
      backgroundImage: widget?.background_image || undefined,
      headerFontColor: widget?.header_font_color || undefined,
      headerDescriptionColor: widget?.header_description_color || undefined,
      successMessage: widget?.success_message || undefined,
      bodyText: widget?.body_text || undefined,
      allowedSocials:
        allowedSocials.length > 0
          ? allowedSocials.map((s) => s.social_id)
          : undefined,
      goalType: campaign.goal_type || undefined,
      goalNum:
        campaign.goal_type === "visit"
          ? campaign.num_visits ?? undefined
          : campaign.num_signups ?? undefined,
      shareText: socialContent?.description || undefined,
      shareTitle: campaign.name,
      showBranding,
      // Same logo the dashboard and public page show for this brand.
      brandDomain: brand?.domain || undefined,
      brandLogoUrl: brand?.logo_url || undefined,
    },
    reward: reward
      ? {
          rewardType: campaign.reward_type,
          couponCode: undefined as string | undefined, // assigned at claim time
          redirectUrl: reward.redirect_url || undefined,
          customMessage: reward.custom_message || undefined,
          cashValue: reward.cash_value || undefined,
          worthValue: reward.worth_value || undefined,
          tokenSymbol: reward.token_symbol || undefined,
          tokenAmount: reward.token_amount
            ? parseFloat(reward.token_amount)
            : undefined,
        }
      : null,
    leaderboard,
    campaign,
    widget,
    appUrl,
  };
}
