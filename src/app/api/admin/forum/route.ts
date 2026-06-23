import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdminApi } from "@/lib/require-platform-admin";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const guard = await requirePlatformAdminApi();
    if (!guard.ok)
      return NextResponse.json(
        { error: guard.status === 401 ? "Unauthorized" : "Forbidden" },
        { status: guard.status }
      );

    const topics = await prisma.topics.findMany({
      orderBy: { date_posted: "desc" },
      take: 200,
    });

    return NextResponse.json(topics);
  } catch (error) {
    console.error("Error fetching forum topics:", error);
    return NextResponse.json(
      { error: "Failed to fetch topics" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const guard = await requirePlatformAdminApi();
    if (!guard.ok)
      return NextResponse.json(
        { error: guard.status === 401 ? "Unauthorized" : "Forbidden" },
        { status: guard.status }
      );

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
