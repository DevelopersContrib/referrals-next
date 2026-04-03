import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const memberId = parseInt(session.user.id, 10);

  const [brands, campaigns] = await Promise.all([
    prisma.member_urls.count({ where: { member_id: memberId } }),
    prisma.member_campaigns.count({ where: { member_id: memberId } }),
  ]);

  const memberCampaigns = await prisma.member_campaigns.findMany({
    where: { member_id: memberId },
    select: { id: true },
  });
  const campaignIds = memberCampaigns.map((c) => c.id);

  let participants = 0;
  let totalClicks = 0;
  let totalShares = 0;
  let impressions = 0;

  if (campaignIds.length > 0) {
    const [participantCount, clicksAgg, shareCount] = await Promise.all([
      prisma.campaign_participants.count({
        where: { campaign_id: { in: campaignIds } },
      }),
      prisma.participants_share.aggregate({
        where: { campaign_id: { in: campaignIds } },
        _sum: { clicks: true },
      }),
      prisma.participants_share.count({
        where: { campaign_id: { in: campaignIds } },
      }),
    ]);

    participants = participantCount;
    totalClicks = clicksAgg._sum.clicks || 0;
    totalShares = shareCount;
  }

  return NextResponse.json({
    brands,
    campaigns,
    participants,
    totalClicks,
    totalShares,
    impressions,
  });
}
