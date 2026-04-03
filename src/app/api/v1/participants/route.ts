import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  authenticateApiKey,
  apiSuccess,
  apiError,
  handleCors,
  getPagination,
} from "@/lib/api/helpers";

export async function OPTIONS() {
  return handleCors();
}

export async function GET(req: NextRequest) {
  try {
    const memberId = await authenticateApiKey(req);
    if (!memberId) {
      return apiError("Invalid or missing API key", 401);
    }

    const { page, limit, skip } = getPagination(req);
    const url = new URL(req.url);
    const campaignId = url.searchParams.get("campaign_id");

    // Get all campaign IDs belonging to this member
    const memberCampaigns = await prisma.member_campaigns.findMany({
      where: { member_id: memberId },
      select: { id: true },
    });
    const campaignIds = memberCampaigns.map((c) => c.id);

    if (campaignIds.length === 0) {
      return apiSuccess({
        participants: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      });
    }

    const where: Record<string, unknown> = {
      campaign_id: campaignId
        ? parseInt(campaignId, 10)
        : { in: campaignIds },
    };

    // If filtering by campaign_id, verify it belongs to the member
    if (campaignId && !campaignIds.includes(parseInt(campaignId, 10))) {
      return apiError("Campaign not found or access denied", 404);
    }

    const [participants, total] = await Promise.all([
      prisma.campaign_participants.findMany({
        where,
        orderBy: { date_signedup: "desc" },
        skip,
        take: limit,
      }),
      prisma.campaign_participants.count({ where }),
    ]);

    return apiSuccess({
      participants,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("List participants error:", error);
    return apiError("Internal server error", 500);
  }
}
