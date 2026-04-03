import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encryptShareCode } from "@/lib/encryption";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

/**
 * POST /api/widget/signup
 *
 * Register a participant in a campaign.
 * Body: { campaignId, email, name, referrerId? }
 * Returns participant ID and share links.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { campaignId, email, name, referrerId } = body;

    if (!campaignId || !email) {
      return NextResponse.json(
        { error: "campaignId and email are required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Check campaign exists
    const campaign = await prisma.member_campaigns.findUnique({
      where: { id: campaignId },
    });
    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Check if participant already exists for this campaign
    let participant = await prisma.campaign_participants.findFirst({
      where: {
        campaign_id: campaignId,
        email: email.toLowerCase().trim(),
      },
    });

    if (!participant) {
      // Find or create the global participant record
      let globalParticipant = await prisma.participants.findFirst({
        where: { email: email.toLowerCase().trim() },
      });

      if (!globalParticipant) {
        globalParticipant = await prisma.participants.create({
          data: {
            email: email.toLowerCase().trim(),
            name: name || email.split("@")[0],
          },
        });
      }

      // Determine invited_by and invited_social
      let invitedBy: number | undefined;
      let invitedSocial: number | undefined;

      if (referrerId) {
        const referrer = await prisma.campaign_participants.findFirst({
          where: {
            campaign_id: campaignId,
            id: referrerId,
          },
        });
        if (referrer) {
          invitedBy = referrer.id;
          // Default social type for direct referral
          invitedSocial = 1;
        }
      }

      // Get IP and signup URL from request
      const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip") ||
        undefined;
      const refererUrl = request.headers.get("referer") || undefined;

      // Create campaign participant
      participant = await prisma.campaign_participants.create({
        data: {
          campaign_id: campaignId,
          email: email.toLowerCase().trim(),
          name: name || email.split("@")[0],
          participant_id: globalParticipant.id,
          invited_by: invitedBy,
          invited_social: invitedSocial,
          ip_address: ip,
          signup_url: refererUrl,
        },
      });
    }

    // Generate share URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://referrals.com";
    const shareCode = encryptShareCode(
      `${campaignId}:1:${participant.id}`
    );
    const shareUrl = `${appUrl}/t/${shareCode}`;

    // Get referral stats
    const referralCount = await prisma.campaign_participants.count({
      where: {
        campaign_id: campaignId,
        invited_by: participant.id,
      },
    });

    // Get click stats
    const shares = await prisma.participants_share.findMany({
      where: {
        campaign_id: campaignId,
        participant_id: participant.id,
      },
    });
    const clickCount = shares.reduce((sum, s) => sum + (s.clicks || 0), 0);

    // Check goal
    const goalMet = checkGoal(campaign, referralCount, clickCount);

    return NextResponse.json(
      {
        success: true,
        participantId: participant.id,
        shareUrl,
        referralCount,
        clickCount,
        goalMet,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("[widget/signup] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}

function checkGoal(
  campaign: { goal_type: string | null | undefined; num_visits: number | null | undefined; num_signups: number | null | undefined },
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
