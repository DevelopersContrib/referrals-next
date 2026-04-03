import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateApiKey, apiSuccess, apiError, handleCors } from "@/lib/api/helpers";

export async function OPTIONS() {
  return handleCors();
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ brandId: string }> }
) {
  try {
    const memberId = await authenticateApiKey(req);
    if (!memberId) {
      return apiError("Invalid or missing API key", 401);
    }

    const { brandId } = await params;
    const id = parseInt(brandId, 10);

    const brand = await prisma.member_urls.findFirst({
      where: { id, member_id: memberId },
    });

    if (!brand) {
      return apiError("Brand not found", 404);
    }

    // Get campaigns under this brand
    const campaigns = await prisma.member_campaigns.findMany({
      where: { url_id: id, member_id: memberId },
      select: { id: true },
    });

    const campaignIds = campaigns.map((c) => c.id);

    // Get total participants across campaigns
    const totalParticipants = campaignIds.length > 0
      ? await prisma.campaign_participants.count({
          where: { campaign_id: { in: campaignIds } },
        })
      : 0;

    // Get total shares across campaigns
    const totalShares = campaignIds.length > 0
      ? await prisma.participants_share.count({
          where: { campaign_id: { in: campaignIds } },
        })
      : 0;

    // Get total clicks
    const shareClicks = campaignIds.length > 0
      ? await prisma.participants_share.aggregate({
          where: { campaign_id: { in: campaignIds } },
          _sum: { clicks: true },
        })
      : { _sum: { clicks: 0 } };

    // Get impressions count
    const impressions = campaignIds.length > 0
      ? await prisma.campaign_widget_impressions_count.findMany({
          where: { campaign_id: { in: campaignIds } },
        })
      : [];

    const totalImpressions = impressions.reduce(
      (sum, imp) => sum + Number(imp.views || 0),
      0
    );

    return apiSuccess({
      brand_id: id,
      total_campaigns: campaigns.length,
      total_participants: totalParticipants,
      total_shares: totalShares,
      total_clicks: Number(shareClicks._sum?.clicks || 0),
      total_impressions: totalImpressions,
    });
  } catch (error) {
    console.error("Brand stats error:", error);
    return apiError("Internal server error", 500);
  }
}
