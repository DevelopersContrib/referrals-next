import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const memberId = parseInt(session.user.id, 10);

    // Get campaigns for this member
    const campaigns = await prisma.member_campaigns.findMany({
      where: { member_id: memberId },
      select: { id: true, name: true },
    });
    const campaignIds = campaigns.map((c) => c.id);
    const campaignMap = new Map(campaigns.map((c) => [c.id, c.name]));

    if (campaignIds.length === 0) {
      return NextResponse.json({ promotions: [] });
    }

    const promotions = await prisma.campaign_promote.findMany({
      where: { campaign_id: { in: campaignIds } },
      orderBy: { date_updated: "desc" },
    });

    const result = promotions.map((p) => ({
      id: p.id,
      campaignId: p.campaign_id,
      campaignName:
        campaignMap.get(p.campaign_id) || `Campaign #${p.campaign_id}`,
      approved: p.approved,
      sentEmail: p.sent_email,
      dateUpdated: p.date_updated,
    }));

    return NextResponse.json({ promotions: result });
  } catch (error) {
    console.error("Promotions GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const memberId = parseInt(session.user.id, 10);
    const body = await request.json();
    const { campaignId } = body;

    if (!campaignId) {
      return NextResponse.json(
        { error: "campaignId is required" },
        { status: 400 }
      );
    }

    // Verify the campaign belongs to this member
    const campaign = await prisma.member_campaigns.findFirst({
      where: { id: campaignId, member_id: memberId },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found or access denied" },
        { status: 404 }
      );
    }

    // Check if already promoted
    const existing = await prisma.campaign_promote.findFirst({
      where: { campaign_id: campaignId, member_id: memberId },
    });

    if (existing) {
      return NextResponse.json(
        { error: "This campaign has already been submitted for promotion" },
        { status: 409 }
      );
    }

    const promotion = await prisma.campaign_promote.create({
      data: {
        campaign_id: campaignId,
        member_id: memberId,
        approved: false,
        sent_email: false,
      },
    });

    return NextResponse.json(promotion, { status: 201 });
  } catch (error) {
    console.error("Promotions POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
