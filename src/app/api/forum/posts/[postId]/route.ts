import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    const id = parseInt(postId, 10);

    const topic = await prisma.topics.findUnique({ where: { id } });
    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    return NextResponse.json({ topic });
  } catch (error) {
    console.error("Forum post GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId } = await params;
    const id = parseInt(postId, 10);
    const memberId = parseInt(session.user.id, 10);

    const existing = await prisma.topics.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    if (existing.member_id !== memberId) {
      return NextResponse.json(
        { error: "You can only edit your own topics." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, content, category_id } = body;

    const updateData: Record<string, unknown> = {};
    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (category_id !== undefined) updateData.category_id = category_id;

    // Update slug if title changed
    if (title && title !== existing.title) {
      const baseSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .substring(0, 150);
      updateData.slug = `${baseSlug}-${Date.now()}`;
    }

    const topic = await prisma.topics.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ topic });
  } catch (error) {
    console.error("Forum post PUT error:", error);
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

    const { postId } = await params;
    const id = parseInt(postId, 10);
    const memberId = parseInt(session.user.id, 10);

    const existing = await prisma.topics.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    if (existing.member_id !== memberId) {
      return NextResponse.json(
        { error: "You can only delete your own topics." },
        { status: 403 }
      );
    }

    // Delete related data
    await Promise.all([
      prisma.topic_comments.deleteMany({ where: { topic_id: id } }),
      prisma.topic_votes.deleteMany({ where: { topic_id: id } }),
      prisma.topic_views.deleteMany({ where: { topic_id: id } }),
    ]);

    await prisma.topics.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Forum post DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
