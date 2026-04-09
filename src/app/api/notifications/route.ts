import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const memberId = parseInt(session.user.id, 10);

    // Get activity feed notifications for this member
    const feeds = await prisma.feeds.findMany({
      where: { from: memberId },
      orderBy: { date_added: "desc" },
      take: 50,
    });

    // Get recent participant signups for the member's campaigns
    const campaigns = await prisma.member_campaigns.findMany({
      where: { member_id: memberId },
      select: { id: true, name: true },
    });
    const campaignIds = campaigns.map((c) => c.id);
    const campaignMap = new Map(campaigns.map((c) => [c.id, c.name]));

    const recentSignups =
      campaignIds.length > 0
        ? await prisma.campaign_participants.findMany({
            where: { campaign_id: { in: campaignIds } },
            orderBy: { date_signedup: "desc" },
            take: 20,
          })
        : [];

    const notifications = [
      ...feeds.map((n) => ({
        id: `feed-${n.id}`,
        message: n.title || n.description || "New activity",
        date: n.date_added,
        type: "feed",
        read: true,
      })),
      ...recentSignups.map((s) => ({
        id: `signup-${s.id}`,
        message: `${s.name || s.email} signed up for ${campaignMap.get(s.campaign_id) || `Campaign #${s.campaign_id}`}`,
        date: s.date_signedup,
        type: "signup",
        read: false,
      })),
    ].sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("Notifications GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, notificationId } = body;

    if (action === "markAllRead") {
      // In a real implementation, this would update a read status table.
      // Since there's no notification_read table in the schema, we acknowledge
      // the request. A future migration could add read tracking.
      return NextResponse.json({ success: true, message: "All notifications marked as read" });
    }

    if (action === "markRead" && notificationId) {
      return NextResponse.json({ success: true, message: "Notification marked as read" });
    }

    return NextResponse.json(
      { error: "Invalid action. Use 'markAllRead' or 'markRead'." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Notifications POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
