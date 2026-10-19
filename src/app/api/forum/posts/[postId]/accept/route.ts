import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseId } from "@/lib/api/helpers";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const memberId = parseInt(session.user.id, 10);
    const { postId } = await params;
    const topicId = parseId(postId);
    const body = await request.json();
    const commentId = parseId(String(body.comment_id || ""));

    if (topicId === null || commentId === null) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const [topic, comment, member] = await Promise.all([
      prisma.topics.findUnique({ where: { id: topicId } }),
      prisma.topic_comments.findUnique({ where: { id: commentId } }),
      prisma.members.findUnique({
        where: { id: memberId },
        select: { is_team: true, is_admin: true },
      }),
    ]);

    if (!topic || !comment || comment.topic_id !== topicId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const canAccept =
      topic.member_id === memberId || member?.is_team || member?.is_admin;
    if (!canAccept) {
      return NextResponse.json(
        { error: "Only the topic author or Team can accept an answer." },
        { status: 403 }
      );
    }

    const updated = await prisma.topics.update({
      where: { id: topicId },
      data: {
        accepted_comment_id: commentId,
        status: "answered",
      },
    });

    return NextResponse.json({ topic: updated });
  } catch (error) {
    console.error("Accept answer error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
