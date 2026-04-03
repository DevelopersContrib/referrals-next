import { prisma } from "@/lib/prisma";

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
      prisma.campaign_participants
        .findMany({
          where: { campaign_id: campaignId },
          select: { name: true, id: true },
        })
        .then(async (participants) => {
          // Get referral counts for top participants
          const entries = await Promise.all(
            participants.map(async (p) => {
              const referralCount = await prisma.campaign_participants.count({
                where: {
                  campaign_id: campaignId,
                  invited_by: p.id,
                },
              });
              return { name: p.name, referrals: referralCount };
            })
          );
          return entries
            .filter((e) => e.referrals > 0)
            .sort((a, b) => b.referrals - a.referrals)
            .slice(0, 10);
        }),
    ]);

  if (!campaign) return null;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://referrals.com";

  return {
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
