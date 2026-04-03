import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { commentId } = await params;
    const cmtId = parseInt(commentId, 10);
    const memberId = parseInt(session.user.id, 10);

    // Verify comment exists
    const comment = await prisma.topic_comments.findUnique({
      where: { id: cmtId },
    });
    if (!comment) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    // Check if already voted
    const existingVote = await prisma.topic_comments_votes.findFirst({
      where: { comment_id: cmtId, voted_by: memberId },
    });

    if (existingVote) {
      return NextResponse.json(
        { error: "You have already voted on this comment." },
        { status: 400 }
      );
    }

    await prisma.topic_comments_votes.create({
      data: {
        comment_id: cmtId,
        voted_by: memberId,
        date_voted: new Date(),
      },
    });

    const voteCount = await prisma.topic_comments_votes.count({
      where: { comment_id: cmtId },
    });

    return NextResponse.json({ success: true, voteCount });
  } catch (error) {
    console.error("Comment vote POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
