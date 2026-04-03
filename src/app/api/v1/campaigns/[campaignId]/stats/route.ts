import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateApiKey, apiSuccess, apiError, handleCors } from "@/lib/api/helpers";

export async function OPTIONS() {
  return handleCors();
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const memberId = await authenticateApiKey(req);
    if (!memberId) {
      return apiError("Invalid or missing API key", 401);
    }

    const { campaignId } = await params;
    const id = parseInt(campaignId, 10);

    const campaign = await prisma.member_campaigns.findFirst({
      where: { id, member_id: memberId },
    });

    if (!campaign) {
      return apiError("Campaign not found", 404);
    }

    const [
      totalParticipants,
      totalShares,
      shareClicks,
      impressions,
      rewardsGiven,
    ] = await Promise.all([
      prisma.campaign_participants.count({ where: { campaign_id: id } }),
      prisma.participants_share.count({ where: { campaign_id: id } }),
      prisma.participants_share.aggregate({
        where: { campaign_id: id },
        _sum: { clicks: true },
      }),
      prisma.campaign_widget_impressions_count.findFirst({
        where: { campaign_id: id },
      }),
      prisma.participants_rewards.count({ where: { campaign_id: id } }),
    ]);

    // Get participants over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentParticipants = await prisma.campaign_participants.findMany({
      where: {
        campaign_id: id,
        date_signedup: { gte: thirtyDaysAgo },
      },
      select: { date_signedup: true },
      orderBy: { date_signedup: "asc" },
    });

    // Group by date
    const dailySignups: Record<string, number> = {};
    for (const p of recentParticipants) {
      const date = p.date_signedup.toISOString().split("T")[0];
      dailySignups[date] = (dailySignups[date] || 0) + 1;
    }

    return apiSuccess({
      campaign_id: id,
      total_participants: totalParticipants,
      total_shares: totalShares,
      total_clicks: Number(shareClicks._sum?.clicks || 0),
      total_impressions: Number(impressions?.views || 0),
      total_rewards_given: rewardsGiven,
      daily_signups: dailySignups,
    });
  } catch (error) {
    console.error("Campaign stats error:", error);
    return apiError("Internal server error", 500);
  }
}
