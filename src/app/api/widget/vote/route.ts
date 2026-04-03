import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

/**
 * POST /api/widget/vote
 *
 * Cast a vote in a contest/poll campaign.
 * Body: { campaignId, optionId, voterEmail }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { campaignId, optionId, voterEmail } = body;

    if (!campaignId || !optionId || !voterEmail) {
      return NextResponse.json(
        { error: "campaignId, optionId, and voterEmail are required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Verify the vote option exists for this campaign
    const option = await prisma.campaign_widget_vote_options.findFirst({
      where: {
        id: optionId,
        campaign_id: campaignId,
      },
    });

    if (!option) {
      return NextResponse.json(
        { error: "Vote option not found for this campaign" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Find the participant by email
    const participant = await prisma.campaign_participants.findFirst({
      where: {
        campaign_id: campaignId,
        email: voterEmail.toLowerCase().trim(),
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "You must sign up before voting" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Check if participant already voted in this campaign
    const existingVote = await prisma.campaign_widget_votes.findFirst({
      where: {
        participant_id: participant.id,
        option_id: {
          in: (
            await prisma.campaign_widget_vote_options.findMany({
              where: { campaign_id: campaignId },
              select: { id: true },
            })
          ).map((o) => o.id),
        },
      },
    });

    if (existingVote) {
      return NextResponse.json(
        { error: "You have already voted in this campaign" },
        { status: 409, headers: corsHeaders }
      );
    }

    // Cast the vote
    const vote = await prisma.campaign_widget_votes.create({
      data: {
        participant_id: participant.id,
        option_id: optionId,
      },
    });

    // Get updated vote tallies for all options
    const options = await prisma.campaign_widget_vote_options.findMany({
      where: { campaign_id: campaignId },
      orderBy: { arrangement: "asc" },
    });

    const tallies = await Promise.all(
      options.map(async (opt) => {
        const count = await prisma.campaign_widget_votes.count({
          where: { option_id: opt.id },
        });
        return {
          optionId: opt.id,
          optionName: opt.option_name,
          votes: count,
        };
      })
    );

    return NextResponse.json(
      {
        success: true,
        voteId: vote.id,
        votedFor: option.option_name,
        results: tallies,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("[widget/vote] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}
