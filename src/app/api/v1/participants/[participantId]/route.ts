import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateApiKey, apiSuccess, apiError, handleCors } from "@/lib/api/helpers";

export async function OPTIONS() {
  return handleCors();
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ participantId: string }> }
) {
  try {
    const memberId = await authenticateApiKey(req);
    if (!memberId) {
      return apiError("Invalid or missing API key", 401);
    }

    const { participantId } = await params;
    const id = parseInt(participantId, 10);

    const participant = await prisma.campaign_participants.findUnique({
      where: { id },
    });

    if (!participant) {
      return apiError("Participant not found", 404);
    }

    // Verify the participant's campaign belongs to the member
    const campaign = await prisma.member_campaigns.findFirst({
      where: { id: participant.campaign_id, member_id: memberId },
    });

    if (!campaign) {
      return apiError("Access denied", 403);
    }

    // Get shares and rewards
    const [shares, rewards, invitedEmails] = await Promise.all([
      prisma.participants_share.findMany({
        where: {
          participant_id: id,
          campaign_id: participant.campaign_id,
        },
      }),
      prisma.participants_rewards.findMany({
        where: {
          participant_id: id,
          campaign_id: participant.campaign_id,
        },
      }),
      prisma.participants_invited_emails.findMany({
        where: {
          participant_id: id,
          campaign_id: participant.campaign_id,
        },
      }),
    ]);

    const totalClicks = shares.reduce((sum, s) => sum + (s.clicks || 0), 0);

    return apiSuccess({
      ...participant,
      shares,
      rewards,
      invited_emails: invitedEmails,
      total_shares: shares.length,
      total_clicks: totalClicks,
      total_rewards: rewards.length,
    });
  } catch (error) {
    console.error("Get participant error:", error);
    return apiError("Internal server error", 500);
  }
}
