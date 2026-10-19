import { NextRequest, NextResponse } from "next/server";
import { adminApiGuard } from "@/lib/require-platform-admin";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const denied = await adminApiGuard();
  if (denied) return denied;
  try {
    const [topics, pendingTopics, pendingComments, reports] = await Promise.all([
      prisma.topics.findMany({
        orderBy: { date_posted: "desc" },
        take: 200,
      }),
      prisma.topics.findMany({
        where: { status: "pending" },
        orderBy: { date_posted: "asc" },
        take: 100,
      }),
      prisma.topic_comments.findMany({
        where: { status: "pending" },
        orderBy: { date_posted: "asc" },
        take: 100,
      }),
      prisma.topic_reports.findMany({
        where: { status: "open" },
        orderBy: { created_at: "asc" },
        take: 100,
      }),
    ]);

    return NextResponse.json({
      topics,
      pendingTopics,
      pendingComments,
      reports,
    });
  } catch (error) {
    console.error("Error fetching forum topics:", error);
    return NextResponse.json(
      { error: "Failed to fetch topics" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const denied = await adminApiGuard();
  if (denied) return denied;
  try {
    const body = await req.json();
    const id = parseInt(String(body.id || "0"), 10);
    const type = body.type as "topic" | "comment" | "report";
    const action = body.action as "approve" | "hide" | "resolve";

    if (!id || !type || !action) {
      return NextResponse.json(
        { error: "id, type, and action are required" },
        { status: 400 }
      );
    }

    if (type === "topic" && action === "approve") {
      await prisma.topics.update({
        where: { id },
        data: { status: "open" },
      });
    } else if (type === "topic" && action === "hide") {
      await prisma.topics.update({
        where: { id },
        data: { status: "hidden" },
      });
    } else if (type === "comment" && action === "approve") {
      const comment = await prisma.topic_comments.update({
        where: { id },
        data: { status: "open" },
      });
      if (comment.topic_id) {
        await prisma.topics.update({
          where: { id: comment.topic_id },
          data: { last_activity_at: new Date() },
        });
      }
    } else if (type === "comment" && action === "hide") {
      await prisma.topic_comments.update({
        where: { id },
        data: { status: "hidden" },
      });
    } else if (type === "report" && action === "resolve") {
      await prisma.topic_reports.update({
        where: { id },
        data: { status: "closed" },
      });
    } else {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error moderating forum item:", error);
    return NextResponse.json(
      { error: "Failed to update" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const denied = await adminApiGuard();
  if (denied) return denied;
  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id") || "0", 10);

    if (!id)
      return NextResponse.json({ error: "ID required" }, { status: 400 });

    // Delete comments first
    await prisma.topic_comments.deleteMany({ where: { topic_id: id } });
    await prisma.topics.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting topic:", error);
    return NextResponse.json(
      { error: "Failed to delete topic" },
      { status: 500 }
    );
  }
}
