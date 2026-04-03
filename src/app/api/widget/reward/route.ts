import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

/**
 * POST /api/widget/reward
 *
 * Claim a reward for a participant.
 * Body: { campaignId, participantId }
 * Checks if goal is met, assigns reward, returns reward info.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { campaignId, participantId } = body;

    if (!campaignId || !participantId) {
      return NextResponse.json(
        { error: "campaignId and participantId are required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Get campaign and reward config
    const [campaign, rewardConfig, participant] = await Promise.all([
      prisma.member_campaigns.findUnique({ where: { id: campaignId } }),
      prisma.campaign_reward.findFirst({ where: { campaign_id: campaignId } }),
      prisma.campaign_participants.findFirst({
        where: { id: participantId, campaign_id: campaignId },
      }),
    ]);

    if (!campaign || !participant) {
      return NextResponse.json(
        { error: "Campaign or participant not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    if (!rewardConfig) {
      return NextResponse.json(
        { error: "No reward configured for this campaign" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Check if already claimed
    const existingReward = await prisma.participants_rewards.findFirst({
      where: {
        campaign_id: campaignId,
        participant_id: participantId,
      },
    });

    if (existingReward) {
      // Return existing reward info
      return NextResponse.json(
        {
          success: true,
          alreadyClaimed: true,
          reward: {
            rewardType: existingReward.reward_type,
            couponCode: existingReward.coupon || undefined,
            redirectUrl: existingReward.redirect_url || undefined,
            customMessage: existingReward.custom_message || undefined,
            cashValue: existingReward.cash_value || undefined,
            tokenSymbol: existingReward.token_symbol || undefined,
            tokenAmount: existingReward.token_amount || undefined,
          },
        },
        { headers: corsHeaders }
      );
    }

    // Check if goal is met
    const referralCount = await prisma.campaign_participants.count({
      where: {
        campaign_id: campaignId,
        invited_by: participantId,
      },
    });

    const shares = await prisma.participants_share.findMany({
      where: {
        campaign_id: campaignId,
        participant_id: participantId,
      },
    });
    const clickCount = shares.reduce((sum, s) => sum + (s.clicks || 0), 0);

    const goalMet = checkGoal(campaign, referralCount, clickCount);

    if (!goalMet) {
      return NextResponse.json(
        {
          success: false,
          error: "Goal not yet met",
          goalType: campaign.goal_type,
          goalNum:
            campaign.goal_type === "visit"
              ? campaign.num_visits
              : campaign.num_signups,
          current:
            campaign.goal_type === "visit" ? clickCount : referralCount,
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // Assign coupon if reward type uses coupons
    let couponCode: string | undefined;
    if (campaign.reward_type === 1 || rewardConfig.coupon_filename) {
      // Get an unused coupon for this campaign
      const coupon = await prisma.campaign_coupons.findFirst({
        where: {
          campaign_id: campaignId,
          is_used: false,
        },
      });

      if (coupon) {
        couponCode = coupon.code || undefined;
        // Mark coupon as used
        await prisma.campaign_coupons.update({
          where: { id: coupon.id },
          data: { is_used: true },
        });
      }
    }

    // Create the reward record
    const rewardRecord = await prisma.participants_rewards.create({
      data: {
        participant_id: participantId,
        campaign_id: campaignId,
        reward_type: campaign.reward_type,
        redirect_url: rewardConfig.redirect_url,
        coupon: couponCode,
        custom_message: rewardConfig.custom_message,
        token_address: rewardConfig.token_address,
        token_symbol: rewardConfig.token_symbol,
        token_amount: rewardConfig.token_amount
          ? parseFloat(rewardConfig.token_amount)
          : null,
        social_type: participant.invited_social || 1,
        cash_value: rewardConfig.cash_value,
      },
    });

    return NextResponse.json(
      {
        success: true,
        alreadyClaimed: false,
        reward: {
          rewardType: rewardRecord.reward_type,
          couponCode: rewardRecord.coupon || undefined,
          redirectUrl: rewardRecord.redirect_url || undefined,
          customMessage: rewardRecord.custom_message || undefined,
          cashValue: rewardRecord.cash_value || undefined,
          tokenSymbol: rewardRecord.token_symbol || undefined,
          tokenAmount: rewardRecord.token_amount || undefined,
        },
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("[widget/reward] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}

function checkGoal(
  campaign: {
    goal_type: string | null;
    num_visits: number | null;
    num_signups: number | null;
  },
  referralCount: number,
  clickCount: number
): boolean {
  if (!campaign.goal_type) return false;

  if (campaign.goal_type === "visit" && campaign.num_visits) {
    return clickCount >= campaign.num_visits;
  }
  if (campaign.goal_type === "signup" && campaign.num_signups) {
    return referralCount >= campaign.num_signups;
  }
  return false;
}
