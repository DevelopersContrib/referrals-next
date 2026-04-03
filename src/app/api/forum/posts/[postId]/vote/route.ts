import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId } = await params;
    const topicId = parseInt(postId, 10);
    const memberId = parseInt(session.user.id, 10);

    // Verify topic exists
    const topic = await prisma.topics.findUnique({ where: { id: topicId } });
    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    // Check if already voted
    const existingVote = await prisma.topic_votes.findFirst({
      where: { topic_id: topicId, voted_by: memberId },
    });

    if (existingVote) {
      return NextResponse.json(
        { error: "You have already voted on this topic." },
        { status: 400 }
      );
    }

    await prisma.topic_votes.create({
      data: {
        topic_id: topicId,
        voted_by: memberId,
        date_voted: new Date(),
      },
    });

    const voteCount = await prisma.topic_votes.count({
      where: { topic_id: topicId },
    });

    return NextResponse.json({ success: true, voteCount });
  } catch (error) {
    console.error("Topic vote POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
