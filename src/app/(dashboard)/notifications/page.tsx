import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MarkAllReadButton } from "./mark-all-read-button";

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const memberId = parseInt(session.user.id, 10);

  // Use feeds table as notification source (activity feed for the member)
  // In the PHP app, notifications were derived from feeds and campaign activity
  const notifications = await prisma.feeds.findMany({
    where: { from: memberId },
    orderBy: { date_added: "desc" },
    take: 50,
  });

  // Also get recent participant signups as notifications
  const campaigns = await prisma.member_campaigns.findMany({
    where: { member_id: memberId },
    select: { id: true, name: true },
  });
  const campaignIds = campaigns.map((c) => c.id);
  const campaignMap = new Map(campaigns.map((c) => [c.id, c.name]));

  const recentSignups = campaignIds.length > 0
    ? await prisma.campaign_participants.findMany({
        where: { campaign_id: { in: campaignIds } },
        orderBy: { date_signedup: "desc" },
        take: 20,
      })
    : [];

  const allNotifications = [
    ...notifications.map((n) => ({
      id: `feed-${n.id}`,
      message: n.title || n.description || "New activity",
      date: n.date_added,
      type: "feed" as const,
      read: true,
    })),
    ...recentSignups.map((s) => ({
      id: `signup-${s.id}`,
      message: `${s.name || s.email} signed up for ${campaignMap.get(s.campaign_id) || `Campaign #${s.campaign_id}`}`,
      date: s.date_signedup,
      type: "signup" as const,
      read: false,
    })),
  ].sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return dateB - dateA;
  });

  const unreadCount = allNotifications.filter((n) => !n.read).length;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="mt-1 text-muted-foreground">
            Stay updated with your campaign activity.
            {unreadCount > 0 && (
              <span className="ml-2 font-medium text-foreground">
                {unreadCount} unread
              </span>
            )}
          </p>
        </div>
        {unreadCount > 0 && <MarkAllReadButton />}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>All Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          {allNotifications.length === 0 ? (
            <div className="py-12 text-center">
              <svg
                className="mx-auto h-12 w-12 text-muted-foreground/50"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                />
              </svg>
              <p className="mt-4 text-muted-foreground">
                No notifications yet. Activity will appear here when your
                campaigns get signups and shares.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {allNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-3 rounded-lg px-4 py-3 transition-colors ${
                    notification.read
                      ? "bg-transparent"
                      : "bg-blue-50 dark:bg-blue-950/20"
                  }`}
                >
                  <div
                    className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${
                      notification.read ? "bg-transparent" : "bg-blue-500"
                    }`}
                  />
                  <div className="flex-1">
                    <p
                      className={`text-sm ${
                        notification.read
                          ? "text-muted-foreground"
                          : "font-medium text-foreground"
                      }`}
                    >
                      {notification.message}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {notification.date
                          ? new Date(notification.date).toLocaleString()
                          : "Unknown date"}
                      </span>
                      <Badge variant="secondary" className="text-[10px]">
                        {notification.type === "signup" ? "Signup" : "Activity"}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
