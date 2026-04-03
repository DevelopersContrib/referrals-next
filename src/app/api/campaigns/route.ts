import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const memberId = parseInt(session.user.id, 10);
  const { searchParams } = new URL(request.url);
  const brandId = searchParams.get("brandId");

  const where: Record<string, unknown> = { member_id: memberId };
  if (brandId) {
    where.url_id = parseInt(brandId, 10);
  }

  try {
    const campaigns = await prisma.member_campaigns.findMany({
      where,
      orderBy: { date_added: "desc" },
    });

    // Get participant counts for each campaign
    const campaignIds = campaigns.map((c) => c.id);
    const participantCounts = await prisma.campaign_participants.groupBy({
      by: ["campaign_id"],
      where: { campaign_id: { in: campaignIds } },
      _count: { id: true },
    });

    const countMap = new Map(
      participantCounts.map((p) => [p.campaign_id, p._count.id])
    );

    // Get campaign types
    const typeIds = [...new Set(campaigns.map((c) => c.type_id))];
    const types = await prisma.campaign_types.findMany({
      where: { id: { in: typeIds } },
    });
    const typeMap = new Map(types.map((t) => [t.id, t.name]));

    const result = campaigns.map((c) => ({
      ...c,
      participantCount: countMap.get(c.id) || 0,
      typeName: typeMap.get(c.type_id) || "Unknown",
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaigns" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const memberId = parseInt(session.user.id, 10);

  try {
    const body = await request.json();
    const {
      name,
      type_id,
      url_id,
      goal_type,
      num_visits,
      num_signups,
      reward_type,
      reward_notify_subject,
      reward_notify_message,
      campaign_entry_subject,
      campaign_entry_message,
      publish,
    } = body;

    if (!name || !type_id || !url_id) {
      return NextResponse.json(
        { error: "Name, type, and brand are required" },
        { status: 400 }
      );
    }

    // Verify brand ownership
    const brand = await prisma.member_urls.findFirst({
      where: { id: parseInt(url_id, 10), member_id: memberId },
    });
    if (!brand) {
      return NextResponse.json(
        { error: "Brand not found or not owned by you" },
        { status: 403 }
      );
    }

    const campaign = await prisma.member_campaigns.create({
      data: {
        name,
        type_id: parseInt(type_id, 10),
        url_id: parseInt(url_id, 10),
        member_id: memberId,
        reward_type: parseInt(reward_type, 10) || 1,
        goal_type: goal_type || "signup",
        num_visits: num_visits ? parseInt(num_visits, 10) : null,
        num_signups: num_signups ? parseInt(num_signups, 10) : null,
        reward_notify_subject: reward_notify_subject || null,
        reward_notify_message: reward_notify_message || null,
        campaign_entry_subject: campaign_entry_subject || null,
        campaign_entry_message: campaign_entry_message || null,
        publish: publish || "public",
        date_added: new Date(),
      },
    });

    // Create default widget
    await prisma.campaign_widget.create({
      data: {
        campaign_id: campaign.id,
        header_title: name,
        description: `Join ${name} and earn rewards!`,
        button_text: "Join Now",
        color: "6366f1",
        button_color: "6366f1",
      },
    });

    // Create default reward entry
    await prisma.campaign_reward.create({
      data: {
        campaign_id: campaign.id,
      },
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    console.error("Error creating campaign:", error);
    return NextResponse.json(
      { error: "Failed to create campaign" },
      { status: 500 }
    );
  }
}
