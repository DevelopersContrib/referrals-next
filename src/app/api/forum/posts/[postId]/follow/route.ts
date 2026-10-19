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

    const memberId = parseInt(session.user.id, 10);
    const { postId } = await params;
    const topicId = parseInt(postId, 10);

    const topic = await prisma.topics.findUnique({ where: { id: topicId } });
    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    await prisma.topic_followers.upsert({
      where: {
        topic_id_member_id: { topic_id: topicId, member_id: memberId },
      },
      update: {},
      create: { topic_id: topicId, member_id: memberId },
    });

    return NextResponse.json({ following: true });
  } catch (error) {
    console.error("Follow topic error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const memberId = parseInt(session.user.id, 10);
    const { postId } = await params;
    const topicId = parseInt(postId, 10);

    await prisma.topic_followers.deleteMany({
      where: { topic_id: topicId, member_id: memberId },
    });

    return NextResponse.json({ following: false });
  } catch (error) {
    console.error("Unfollow topic error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
