import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  authenticateApiKey,
  apiSuccess,
  apiError,
  handleCors,
} from "@/lib/api/helpers";
import { logApiCall } from "@/lib/api/log-call";
import { tryRewardReferrerAfterSignup } from "@/lib/campaign-reward";

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

    const rewardResult = await tryRewardReferrerAfterSignup({
      campaign,
      referrerParticipantId: participantId,
      socialType,
      inviteeParticipantId:
        campaign.reward_invited && invitedId ? invitedId : undefined,
    });

    if (rewardResult) {
      return apiSuccess(
        {
          message: "User added",
          id: newParticipantId,
          reward: rewardResult.referrer,
        },
        201,
      );
    }

    const existingReward = await prisma.participants_rewards.findFirst({
      where: {
        participant_id: participantId,
        campaign_id: campaignId,
      },
    });

    return apiSuccess(
      {
        message: existingReward
          ? "User added, reward already received"
          : "User added",
        id: newParticipantId,
      },
      201,
    );
  } catch (error) {
    console.error("Referral signup error:", error);
    return apiError("Internal server error", 500);
  }
}
