import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const memberId = parseInt(session.user.id, 10);
    const body = await request.json();
    const topicId = body.topic_id ? parseInt(String(body.topic_id), 10) : null;
    const commentId = body.comment_id
      ? parseInt(String(body.comment_id), 10)
      : null;
    const reason =
      typeof body.reason === "string" ? body.reason.trim().slice(0, 255) : "";

    if (!topicId && !commentId) {
      return NextResponse.json(
        { error: "A topic or reply is required." },
        { status: 400 }
      );
    }

    if (topicId) {
      const topic = await prisma.topics.findUnique({ where: { id: topicId } });
      if (!topic) {
        return NextResponse.json({ error: "Topic not found" }, { status: 404 });
      }
    }
    if (commentId) {
      const comment = await prisma.topic_comments.findUnique({
        where: { id: commentId },
      });
      if (!comment) {
        return NextResponse.json({ error: "Reply not found" }, { status: 404 });
      }
    }

    const report = await prisma.topic_reports.create({
      data: {
        topic_id: topicId,
        comment_id: commentId,
        reported_by: memberId,
        reason: reason || "Reported",
        status: "open",
      },
    });

    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    console.error("Forum report POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
