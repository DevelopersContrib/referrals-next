import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ brandId: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const memberId = parseInt(session.user.id, 10);
    const { brandId } = await params;
    const id = parseInt(brandId, 10);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid brand ID" }, { status: 400 });
    }

    // Verify ownership
    const brand = await prisma.member_urls.findFirst({
      where: { id, member_id: memberId },
    });

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    // Get campaigns for this brand
    const campaigns = await prisma.member_campaigns.findMany({
      where: { url_id: id, member_id: memberId },
      select: { id: true },
    });

    const campaignIds = campaigns.map((c) => c.id);
    const campaignsCount = campaignIds.length;

    let participantsCount = 0;
    let totalClicks = 0;
    let totalShares = 0;

    if (campaignIds.length > 0) {
      const [participantResult, clicksResult, sharesResult] =
        await Promise.all([
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

      participantsCount = participantResult;
      totalClicks = clicksResult._sum.clicks || 0;
      totalShares = sharesResult;
    }

    return NextResponse.json({
      campaignsCount,
      participantsCount,
      totalClicks,
      totalShares,
    });
  } catch (error) {
    console.error("Error fetching brand stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch brand stats" },
      { status: 500 }
    );
  }
}
