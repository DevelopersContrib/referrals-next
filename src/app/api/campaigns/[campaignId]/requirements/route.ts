import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { campaignId } = await params;
    const memberId = parseInt(session.user.id, 10);
    const campaignIdNum = parseInt(campaignId, 10);

    // Verify campaign belongs to this member
    const campaign = await prisma.member_campaigns.findFirst({
      where: { id: campaignIdNum, member_id: memberId },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found or access denied" },
        { status: 404 }
      );
    }

    // Campaign requirements are stored as challenge associations
    // campaign_challenges links campaigns to contrib_challenge_id
    const challenges = await prisma.campaign_challenges.findMany({
      where: { campaign_id: campaignIdNum },
    });

    // Map challenges to requirement-like objects
    const requirements = challenges.map((c) => ({
      id: c.id,
      type: `Challenge #${c.contrib_challenge_id}`,
      description: `Contribution challenge requirement #${c.contrib_challenge_id}`,
      required: true,
      createdAt: new Date().toISOString(),
    }));

    return NextResponse.json({ requirements });
  } catch (error) {
    console.error("Requirements GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { campaignId } = await params;
    const memberId = parseInt(session.user.id, 10);
    const campaignIdNum = parseInt(campaignId, 10);

    // Verify campaign belongs to this member
    const campaign = await prisma.member_campaigns.findFirst({
      where: { id: campaignIdNum, member_id: memberId },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found or access denied" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { type, description, required: isRequired } = body;

    if (!type || !description) {
      return NextResponse.json(
        { error: "type and description are required" },
        { status: 400 }
      );
    }

    // Store as a campaign challenge
    // We use the contrib_challenge_id field as a hash of the requirement type
    // In a full implementation, this would have its own table
    const challengeId = Math.abs(
      type.split("").reduce((acc: number, char: string) => {
        return ((acc << 5) - acc + char.charCodeAt(0)) | 0;
      }, 0)
    ) % 10000;

    const challenge = await prisma.campaign_challenges.create({
      data: {
        campaign_id: campaignIdNum,
        contrib_challenge_id: challengeId,
      },
    });

    return NextResponse.json(
      {
        requirement: {
          id: challenge.id,
          type,
          description,
          required: isRequired !== false,
          createdAt: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Requirements POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
