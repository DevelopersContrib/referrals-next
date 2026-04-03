import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { campaignId } = await params;
  const memberId = parseInt(session.user.id, 10);
  const id = parseInt(campaignId, 10);

  // Verify ownership
  const campaign = await prisma.member_campaigns.findFirst({
    where: { id, member_id: memberId },
  });
  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const search = searchParams.get("search") || "";
  const sortBy = searchParams.get("sortBy") || "date_signedup";
  const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";

  const skip = (page - 1) * limit;

  try {
    const where: Record<string, unknown> = { campaign_id: id };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const [participants, total] = await Promise.all([
      prisma.campaign_participants.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.campaign_participants.count({ where }),
    ]);

    // Get share data for each participant
    const participantIds = participants.map((p) => p.id);
    const shares = await prisma.participants_share.groupBy({
      by: ["participant_id"],
      where: {
        campaign_id: id,
        participant_id: { in: participantIds },
      },
      _count: { id: true },
      _sum: { clicks: true },
    });

    const shareMap = new Map(
      shares.map((s) => [
        s.participant_id,
        { shares: s._count.id, clicks: s._sum.clicks || 0 },
      ])
    );

    // Get referral counts (how many people each participant invited)
    const referralCounts = await prisma.campaign_participants.groupBy({
      by: ["invited_by"],
      where: {
        campaign_id: id,
        invited_by: { in: participantIds },
      },
      _count: { id: true },
    });

    const referralMap = new Map(
      referralCounts.map((r) => [r.invited_by, r._count.id])
    );

    const enriched = participants.map((p) => ({
      ...p,
      shares: shareMap.get(p.id)?.shares || 0,
      clicks: shareMap.get(p.id)?.clicks || 0,
      referredCount: referralMap.get(p.id) || 0,
    }));

    return NextResponse.json({
      participants: enriched,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching participants:", error);
    return NextResponse.json(
      { error: "Failed to fetch participants" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
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
    const body = await request.json();
    const { email, name } = body;

    if (!email || !name) {
      return NextResponse.json(
        { error: "Email and name are required" },
        { status: 400 }
      );
    }

    // Check if participant already exists
    const existing = await prisma.campaign_participants.findFirst({
      where: { campaign_id: id, email },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Participant already exists" },
        { status: 409 }
      );
    }

    const participant = await prisma.campaign_participants.create({
      data: {
        campaign_id: id,
        email,
        name,
        date_signedup: new Date(),
      },
    });

    return NextResponse.json(participant, { status: 201 });
  } catch (error) {
    console.error("Error adding participant:", error);
    return NextResponse.json(
      { error: "Failed to add participant" },
      { status: 500 }
    );
  }
}
