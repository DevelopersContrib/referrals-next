import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateApiKey, apiSuccess, apiError, handleCors, getPagination } from "@/lib/api/helpers";

export async function OPTIONS() {
  return handleCors();
}

/**
 * Zapier trigger endpoint: returns participants (contacts) for polling triggers.
 * Zapier polls this endpoint and deduplicates based on participant ID.
 */
export async function GET(req: NextRequest) {
  try {
    const memberId = await authenticateApiKey(req);
    if (!memberId) {
      return apiError("Invalid or missing API key", 401);
    }

    const { limit, skip } = getPagination(req);
    const url = new URL(req.url);
    const campaignId = url.searchParams.get("campaign_id");

    // Get member's campaigns
    const memberCampaigns = await prisma.member_campaigns.findMany({
      where: { member_id: memberId },
      select: { id: true },
    });
    const campaignIds = memberCampaigns.map((c) => c.id);

    if (campaignIds.length === 0) {
      return apiSuccess([]);
    }

    const where: Record<string, unknown> = {
      campaign_id: campaignId
        ? parseInt(campaignId, 10)
        : { in: campaignIds },
    };

    const participants = await prisma.campaign_participants.findMany({
      where,
      orderBy: { id: "desc" },
      skip,
      take: limit,
    });

    // Zapier expects an array of objects with an "id" field for deduplication
    return apiSuccess(
      participants.map((p) => ({
        id: p.id,
        email: p.email,
        name: p.name,
        campaign_id: p.campaign_id,
        date_signedup: p.date_signedup,
        referral_url: p.referral_url,
      }))
    );
  } catch (error) {
    console.error("Zapier contacts error:", error);
    return apiError("Internal server error", 500);
  }
}
