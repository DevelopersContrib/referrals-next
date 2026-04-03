import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export default async function ForumActivityPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  // Get recent comments
  const recentComments = await prisma.topic_comments.findMany({
    orderBy: { date_posted: "desc" },
    take: 20,
  });

  // Get recent topics
  const recentTopics = await prisma.topics.findMany({
    orderBy: { date_posted: "desc" },
    take: 20,
  });

  // Get member names
  const memberIds = [
    ...new Set([
      ...recentComments.map((c) => c.member_id).filter(Boolean),
      ...recentTopics.map((t) => t.member_id).filter(Boolean),
    ]),
  ] as number[];

  const members =
    memberIds.length > 0
      ? await prisma.members.findMany({
          where: { id: { in: memberIds } },
          select: { id: true, name: true },
        })
      : [];
  const memberMap = new Map(members.map((m) => [m.id, m.name]));

  // Get topic info for comments
  const commentTopicIds = [
    ...new Set(recentComments.map((c) => c.topic_id).filter(Boolean)),
  ] as number[];
  const commentTopics =
    commentTopicIds.length > 0
      ? await prisma.topics.findMany({
          where: { id: { in: commentTopicIds } },
          select: { id: true, title: true, slug: true },
        })
      : [];
  const topicMap = new Map(commentTopics.map((t) => [t.id, t]));

  // Merge and sort by date
  type ActivityItem = {
    type: "topic" | "comment";
    date: Date;
    memberId: number | null;
    topicTitle: string;
    topicSlug: string;
    preview: string;
  };

  const activities: ActivityItem[] = [
    ...recentTopics.map((t) => ({
      type: "topic" as const,
      date: new Date(t.date_posted),
      memberId: t.member_id,
      topicTitle: t.title,
      topicSlug: t.slug || String(t.id),
      preview: t.content.substring(0, 120),
    })),
    ...recentComments.map((c) => {
      const t = c.topic_id ? topicMap.get(c.topic_id) : null;
      return {
        type: "comment" as const,
        date: new Date(c.date_posted),
        memberId: c.member_id,
        topicTitle: t?.title || "Unknown Topic",
        topicSlug: t?.slug || String(c.topic_id || ""),
        preview: (c.answer || "").substring(0, 120),
      };
    }),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/forum" className="hover:text-gray-900">
            Forum
          </Link>
          <span>/</span>
          <span>Activity</span>
        </div>
        <h1 className="mt-2 text-2xl font-bold">Recent Activity</h1>
        <p className="mt-1 text-muted-foreground">
          Latest topics and replies across the forum.
        </p>
      </div>

      <div className="space-y-3">
        {activities.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No activity yet. Start a discussion!
            </CardContent>
          </Card>
        ) : (
          activities.slice(0, 30).map((item, i) => (
            <Card key={`${item.type}-${i}`}>
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${
                      item.type === "topic" ? "bg-blue-500" : "bg-green-500"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span className="font-medium text-gray-900">
                        {item.memberId
                          ? memberMap.get(item.memberId) || "Unknown"
                          : "Unknown"}
                      </span>{" "}
                      {item.type === "topic" ? "created" : "replied to"}{" "}
                      <Link
                        href={`/forum/post/${item.topicSlug}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {item.topicTitle}
                      </Link>
                    </p>
                    {item.preview && (
                      <p className="mt-1 text-sm text-muted-foreground truncate">
                        {item.preview}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.date.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
