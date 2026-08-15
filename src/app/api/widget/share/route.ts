import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ZapierIntegration } from "@/lib/integrations/zapier";
import {
  ensureParticipantShare,
  resolveSocialTypeId,
} from "@/lib/widget-share-tracking";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

/**
 * POST /api/widget/share
 * Body: { campaignId, participantId, socialType }
 * Creates/updates participants_share and returns the tracked /t/ URL.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { campaignId, participantId, socialType } = body;

    if (!campaignId || !participantId || !socialType) {
      return NextResponse.json(
        { error: "campaignId, participantId, and socialType are required" },
        { status: 400, headers: corsHeaders }
      );
    }

    const socialTypeId = await resolveSocialTypeId(socialType);
    if (socialTypeId === null) {
      return NextResponse.json(
        { error: "Invalid social type" },
        { status: 400, headers: corsHeaders }
      );
    }

    const ensured = await ensureParticipantShare({
      campaignId: Number(campaignId),
      participantId: Number(participantId),
      socialTypeId,
    });

    const campaign = await prisma.member_campaigns.findUnique({
      where: { id: Number(campaignId) },
      select: { member_id: true },
    });

    if (campaign) {
      void ZapierIntegration.fireShareEvent(campaign.member_id, {
        participant_id: Number(participantId),
        campaign_id: Number(campaignId),
        social_type: socialTypeId,
        url: ensured.url,
      }).catch((err) =>
        console.error("[widget/share] Zapier webhook error:", err)
      );
    }

    return NextResponse.json(
      {
        success: true,
        shareUrl: ensured.url,
        socialType: socialTypeId,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("[widget/share] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}
