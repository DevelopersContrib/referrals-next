import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  authenticateApiKey,
  apiSuccess,
  apiError,
  handleCors,
} from "@/lib/api/helpers";
import { logApiCall } from "@/lib/api/log-call";

export async function OPTIONS() {
  return handleCors();
}

export async function POST(req: NextRequest) {
  try {
    const memberId = await authenticateApiKey(req);
    if (!memberId) {
      return apiError("Invalid or missing API key", 401);
    }

    const apiKey = req.headers.get("x-api-key") || "";
    logApiCall(apiKey, "v1/signups/referral", req);

    const body = await req.json();
    const { code, email, name, ip } = body;

    if (!code) {
      return apiError("code parameter is required", 400);
    }
    if (!email) {
      return apiError("email is required", 400);
    }
    if (!name) {
      return apiError("name is required", 400);
    }

    // Decode the referral code: base64 of "campaign_id:social_type:participant_id[:invited_id]"
    let decoded: string;
    try {
      decoded = Buffer.from(decodeURIComponent(code), "base64").toString(
        "utf-8"
      );
    } catch {
      return apiError("Invalid code parameter", 400);
    }

    const parts = decoded.split(":");
    if (parts.length < 3) {
      return apiError("Invalid code parameter", 400);
    }

    const campaignId = parseInt(parts[0], 10);
    const socialType = parseInt(parts[1], 10);
    const participantId = parseInt(parts[2], 10);
    const invitedId = parts[3] ? parseInt(parts[3], 10) : null;

    const campaign = await prisma.member_campaigns.findFirst({
      where: { id: campaignId },
    });

    if (!campaign || campaign.goal_type !== "signup") {
      return apiError("Code is incompatible for this campaign", 400);
    }

    // Check if participant already exists and was already invited
    const existing = await prisma.campaign_participants.findFirst({
      where: { campaign_id: campaignId, email },
    });

    let newParticipantId: number;
    let isAlreadyInvited = false;

    if (!existing) {
      const created = await prisma.campaign_participants.create({
        data: {
          name,
          email,
          campaign_id: campaignId,
          invited_by: participantId,
          invited_social: socialType,
          ip_address: ip || null,
        },
      });
      newParticipantId = created.id;
    } else if (existing.invited_by === null) {
      await prisma.campaign_participants.update({
        where: { id: existing.id },
        data: {
          name,
          invited_by: participantId,
          invited_social: socialType,
          ip_address: ip || null,
        },
      });
      newParticipantId = existing.id;
    } else {
      isAlreadyInvited = true;
      newParticipantId = existing.id;
    }

    if (isAlreadyInvited) {
      return apiSuccess({
        message: "User already invited by another user",
        id: newParticipantId,
      });
    }

    // Check if reward should be given
    const rewardConfig = await prisma.campaign_reward.findFirst({
      where: { campaign_id: campaignId },
    });

    const existingReward = await prisma.participants_rewards.findFirst({
      where: {
        participant_id: participantId,
        campaign_id: campaignId,
      },
    });

    const numSignups = campaign.num_signups || 1;
    const rewardType = campaign.reward_type;
    const isEqualReward = rewardType === 1 || rewardType === 3;

    const referralCount = await prisma.campaign_participants.count({
      where: {
        campaign_id: campaignId,
        invited_by: participantId,
      },
    });

    const shouldReward =
      !existingReward &&
      (isEqualReward || referralCount >= numSignups);

    if (shouldReward && rewardConfig) {
      const rewardResult = await processReward(
        campaignId,
        participantId,
        rewardType,
        socialType,
        rewardConfig
      );

      // If two-way reward is enabled, also reward the new participant
      if (campaign.reward_invited && invitedId) {
        await processReward(
          campaignId,
          newParticipantId,
          rewardType,
          socialType,
          rewardConfig
        );
      }

      return apiSuccess({
        message: "User added",
        id: newParticipantId,
        reward: rewardResult,
      }, 201);
    }

    return apiSuccess({
      message: existingReward ? "User added, reward already received" : "User added",
      id: newParticipantId,
    }, 201);
  } catch (error) {
    console.error("Referral signup error:", error);
    return apiError("Internal server error", 500);
  }
}

async function processReward(
  campaignId: number,
  participantId: number,
  rewardType: number,
  socialType: number,
  rewardConfig: {
    custom_message: string | null;
    cash_value: number | null;
    token_address: string | null;
    token_symbol: string | null;
    token_amount: string | null;
  }
) {
  switch (rewardType) {
    case 1: {
      // Coupon reward
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

        // Check coupon shortage
        const remaining = await prisma.campaign_coupons.count({
          where: { campaign_id: campaignId, is_used: false },
        });

        return {
          type: "coupon",
          code: coupon.code,
          remaining,
        };
      }

      return { type: "coupon", code: null, message: "No more coupons available" };
    }

    case 3: {
      // Custom message reward
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

    case 5: {
      // Cash reward
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
