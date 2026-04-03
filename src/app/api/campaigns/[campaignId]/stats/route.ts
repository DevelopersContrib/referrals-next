import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { campaignId } = await params;
  const memberId = parseInt(session.user.id, 10);
  const id = parseInt(campaignId, 10);

  const campaign = await prisma.member_campaigns.findFirst({
    where: { id, member_id: memberId },
  });
  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  try {
    const [participantCount, sharesData, impressionsData] = await Promise.all([
      prisma.campaign_participants.count({ where: { campaign_id: id } }),
      prisma.participants_share.aggregate({
        where: { campaign_id: id },
        _count: { id: true },
        _sum: { clicks: true },
      }),
      prisma.campaign_widget_impressions_count.findFirst({
        where: { campaign_id: id },
      }),
    ]);

    // Get top participants by referrals
    const topReferrers = await prisma.campaign_participants.groupBy({
      by: ["invited_by"],
      where: {
        campaign_id: id,
        invited_by: { not: null },
      },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    });

    // Fetch details for top referrers
    const referrerIds = topReferrers
      .map((r) => r.invited_by)
      .filter((id): id is number => id !== null);

    const referrerDetails = referrerIds.length
      ? await prisma.campaign_participants.findMany({
          where: { id: { in: referrerIds } },
          select: { id: true, name: true, email: true },
        })
      : [];

    const referrerMap = new Map(referrerDetails.map((r) => [r.id, r]));

    const topSharers = topReferrers.map((r) => ({
      participant: referrerMap.get(r.invited_by!) || {
        id: r.invited_by,
        name: "Unknown",
        email: "",
      },
      referrals: r._count.id,
    }));

    // Get share leaders by clicks
    const shareLeaders = await prisma.participants_share.groupBy({
      by: ["participant_id"],
      where: { campaign_id: id },
      _sum: { clicks: true },
      _count: { id: true },
      orderBy: { _sum: { clicks: "desc" } },
      take: 10,
    });

    const leaderIds = shareLeaders.map((s) => s.participant_id);
    const leaderDetails = leaderIds.length
      ? await prisma.campaign_participants.findMany({
          where: { id: { in: leaderIds } },
          select: { id: true, name: true, email: true },
        })
      : [];
    const leaderMap = new Map(leaderDetails.map((l) => [l.id, l]));

    const shareLeadersEnriched = shareLeaders.map((s) => ({
      participant: leaderMap.get(s.participant_id) || {
        id: s.participant_id,
        name: "Unknown",
        email: "",
      },
      clicks: s._sum.clicks || 0,
      shares: s._count.id,
    }));

    return NextResponse.json({
      participants: participantCount,
      shares: sharesData._count.id,
      clicks: sharesData._sum.clicks || 0,
      impressions: Number(impressionsData?.views || 0),
      topReferrers: topSharers,
      shareLeaders: shareLeadersEnriched,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
