import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  assertPostLimits,
  assertRateLimit,
  shouldHoldForReview,
} from "@/lib/forum-moderation";
import { notifyTopicReply } from "@/lib/forum-emails";

export async function GET(
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

    const comments = await prisma.topic_comments.findMany({
      where: {
        topic_id: topicId,
        OR: [
          { status: "open" },
          { member_id: Number.isFinite(parseInt(session.user.id, 10))
            ? parseInt(session.user.id, 10)
            : -1 },
        ],
      },
      orderBy: { date_posted: "asc" },
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("Comments GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
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

    const body = await request.json();
    const { answer } = body;

    if (!answer || typeof answer !== "string" || answer.trim().length === 0) {
      return NextResponse.json(
        { error: "Comment content is required." },
        { status: 400 }
      );
    }

    // Verify topic exists
    const topic = await prisma.topics.findUnique({ where: { id: topicId } });
    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    if (topic.status === "pending" || topic.status === "hidden") {
      return NextResponse.json(
        { error: "This topic is not open for replies yet." },
        { status: 403 }
      );
    }

    const limitError =
      assertPostLimits(answer) || (await assertRateLimit(memberId));
    if (limitError) {
      return NextResponse.json({ error: limitError }, { status: 400 });
    }

    const pending = await shouldHoldForReview(memberId);
    const now = new Date();
    const comment = await prisma.topic_comments.create({
      data: {
        topic_id: topicId,
        answer: answer.trim(),
        member_id: memberId,
        date_posted: now,
        status: pending ? "pending" : "open",
      },
    });

    if (!pending) {
      await prisma.topics.update({
        where: { id: topicId },
        data: { last_activity_at: now },
      });
      await notifyTopicReply({
        topicId,
        commentId: comment.id,
        replierId: memberId,
      }).catch((error) => {
        console.error("Forum reply email failed:", error);
      });
    }

    return NextResponse.json(
      {
        comment,
        pending,
        message: pending
          ? "Your first post is waiting for approval and will not appear publicly yet."
          : undefined,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Comments POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
