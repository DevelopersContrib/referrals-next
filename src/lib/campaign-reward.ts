import { prisma } from "@/lib/prisma";
import { sendCampaignRewardEmail } from "@/lib/campaign-email";
import { ZapierIntegration } from "@/lib/integrations/zapier";

export type CampaignRewardConfig = {
  custom_message: string | null;
  cash_value: number | null;
  token_address: string | null;
  token_symbol: string | null;
  token_amount: string | null;
  redirect_url?: string | null;
};

export type ProcessRewardResult =
  | { type: "coupon"; code: string | null; remaining?: number; message?: string }
  | { type: "custom"; message: string | null }
  | { type: "token"; symbol: string | null; amount: number | null }
  | { type: "cash"; value: number | null }
  | { type: "unknown"; rewardType: number };

export function isEqualRewardType(rewardType: number) {
  return rewardType === 1 || rewardType === 3;
}

export async function countReferrerSignups(
  campaignId: number,
  referrerParticipantId: number,
) {
  return prisma.campaign_participants.count({
    where: {
      campaign_id: campaignId,
      invited_by: referrerParticipantId,
    },
  });
}

export async function referrerShouldReceiveReward(
  campaign: { num_signups: number | null; reward_type: number },
  campaignId: number,
  referrerParticipantId: number,
) {
  const existingReward = await prisma.participants_rewards.findFirst({
    where: {
      participant_id: referrerParticipantId,
      campaign_id: campaignId,
    },
  });
  if (existingReward) return false;

  const rewardType = campaign.reward_type;
  const numSignups = campaign.num_signups || 1;
  const referralCount = await countReferrerSignups(
    campaignId,
    referrerParticipantId,
  );
  return isEqualRewardType(rewardType) || referralCount >= numSignups;
}

export async function processReward(
  campaignId: number,
  participantId: number,
  rewardType: number,
  socialType: number,
  rewardConfig: CampaignRewardConfig,
): Promise<ProcessRewardResult> {
  switch (rewardType) {
    case 1: {
      const coupon = await prisma.campaign_coupons.findFirst({
        where: { campaign_id: campaignId, is_used: false },
      });

      if (coupon) {
        await prisma.campaign_coupons.update({
          where: { id: coupon.id },
          data: { is_used: true },
        });

        await prisma.participants_rewards.create({
          data: {
            participant_id: participantId,
            campaign_id: campaignId,
            reward_type: rewardType,
            social_type: socialType,
            coupon: coupon.code,
          },
        });

        const remaining = await prisma.campaign_coupons.count({
          where: { campaign_id: campaignId, is_used: false },
        });

        return { type: "coupon", code: coupon.code, remaining };
      }

      return {
        type: "coupon",
        code: null,
        message: "No more coupons available",
      };
    }

    case 3: {
      await prisma.participants_rewards.create({
        data: {
          participant_id: participantId,
          campaign_id: campaignId,
          reward_type: rewardType,
          social_type: socialType,
          custom_message: rewardConfig.custom_message,
        },
      });

      return { type: "custom", message: rewardConfig.custom_message };
    }

    case 4: {
      const amount = rewardConfig.token_amount
        ? parseFloat(rewardConfig.token_amount)
        : null;
      await prisma.participants_rewards.create({
        data: {
          participant_id: participantId,
          campaign_id: campaignId,
          reward_type: rewardType,
          social_type: socialType,
          token_address: rewardConfig.token_address,
          token_symbol: rewardConfig.token_symbol,
          token_amount: amount,
        },
      });

      return { type: "token", symbol: rewardConfig.token_symbol, amount };
    }

    case 5: {
      await prisma.participants_rewards.create({
        data: {
          participant_id: participantId,
          campaign_id: campaignId,
          reward_type: rewardType,
          social_type: socialType,
          cash_value: rewardConfig.cash_value,
        },
      });

      return { type: "cash", value: rewardConfig.cash_value };
    }

    default:
      return { type: "unknown", rewardType };
  }
}

export async function notifyParticipantReward(
  campaign: {
    id: number;
    name: string;
    member_id: number;
    url_id: number | null;
    reward_notify_subject: string | null;
    reward_notify_message: string | null;
  },
  participantId: number,
) {
  const [participant, rewardRecord, brand] = await Promise.all([
    prisma.campaign_participants.findFirst({
      where: { id: participantId, campaign_id: campaign.id },
    }),
    prisma.participants_rewards.findFirst({
      where: { participant_id: participantId, campaign_id: campaign.id },
      orderBy: { id: "desc" },
    }),
    campaign.url_id
      ? prisma.member_urls.findUnique({
          where: { id: campaign.url_id },
          select: { domain: true },
        })
      : Promise.resolve(null),
  ]);

  if (!participant || !rewardRecord) return;

  try {
    await sendCampaignRewardEmail({
      to: participant.email,
      campaignName: campaign.name,
      participantName: participant.name,
      rewardSubject: campaign.reward_notify_subject,
      rewardMessage: campaign.reward_notify_message,
      fromName: brand?.domain || campaign.name,
      reward: rewardRecord,
    });
  } catch (emailError) {
    console.error("[campaign-reward] Failed to send reward email:", emailError);
  }

  void ZapierIntegration.fireRewardEvent(campaign.member_id, {
    participant_id: participantId,
    campaign_id: campaign.id,
    reward_type: rewardRecord.reward_type,
    coupon: rewardRecord.coupon || undefined,
    cash_value: rewardRecord.cash_value || undefined,
  }).catch((err) =>
    console.error("[campaign-reward] Zapier webhook error:", err),
  );
}

/**
 * After a new signup with invited_by, reward the referrer when the goal is met.
 * Shared by widget signup and v1 signups/referral.
 */
export async function tryRewardReferrerAfterSignup(opts: {
  campaign: {
    id: number;
    name: string;
    member_id: number;
    url_id: number | null;
    goal_type: string | null;
    num_signups: number | null;
    reward_type: number;
    reward_invited: boolean | null;
    reward_notify_subject: string | null;
    reward_notify_message: string | null;
  };
  referrerParticipantId: number;
  socialType: number;
  inviteeParticipantId?: number;
  notify?: boolean;
}) {
  if (opts.campaign.goal_type !== "signup") {
    return null;
  }

  const rewardConfig = await prisma.campaign_reward.findFirst({
    where: { campaign_id: opts.campaign.id },
  });
  if (!rewardConfig) return null;

  const shouldReward = await referrerShouldReceiveReward(
    opts.campaign,
    opts.campaign.id,
    opts.referrerParticipantId,
  );
  if (!shouldReward) return null;

  const referrerReward = await processReward(
    opts.campaign.id,
    opts.referrerParticipantId,
    opts.campaign.reward_type,
    opts.socialType,
    rewardConfig,
  );

  if (opts.notify) {
    await notifyParticipantReward(opts.campaign, opts.referrerParticipantId);
  }

  let inviteeReward: ProcessRewardResult | undefined;
  if (opts.campaign.reward_invited && opts.inviteeParticipantId) {
    inviteeReward = await processReward(
      opts.campaign.id,
      opts.inviteeParticipantId,
      opts.campaign.reward_type,
      opts.socialType,
      rewardConfig,
    );
    if (opts.notify) {
      await notifyParticipantReward(opts.campaign, opts.inviteeParticipantId);
    }
  }

  return { referrer: referrerReward, invitee: inviteeReward };
}
