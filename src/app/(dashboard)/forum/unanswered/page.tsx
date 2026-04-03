import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default async function ForumUnansweredPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  // Get topic IDs that have comments
  const topicsWithComments = await prisma.topic_comments.findMany({
    select: { topic_id: true },
    distinct: ["topic_id"],
  });
  const answeredIds = topicsWithComments
    .map((c) => c.topic_id)
    .filter((id): id is number => id !== null);

  // Get topics with 0 comments
  const topics = await prisma.topics.findMany({
    where: answeredIds.length > 0 ? { id: { notIn: answeredIds } } : {},
    orderBy: { date_posted: "desc" },
    take: 50,
  });

  const categories = await prisma.topic_categories.findMany();
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  const topicIds = topics.map((t) => t.id);
  const voteCounts =
    topicIds.length > 0
      ? await prisma.topic_votes.groupBy({
          by: ["topic_id"],
          where: { topic_id: { in: topicIds } },
          _count: { id: true },
        })
      : [];
  const voteMap = new Map(voteCounts.map((v) => [v.topic_id, v._count.id]));

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/forum" className="hover:text-gray-900">
            Forum
          </Link>
          <span>/</span>
          <span>Unanswered</span>
        </div>
        <h1 className="mt-2 text-2xl font-bold">Unanswered Topics</h1>
        <p className="mt-1 text-muted-foreground">
          Topics that need a reply. Help the community by answering!
        </p>
      </div>

      <div className="space-y-3">
        {topics.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              All topics have been answered! Great job, community.
            </CardContent>
          </Card>
        ) : (
          topics.map((topic) => {
            const category = topic.category_id
              ? categoryMap.get(topic.category_id)
              : null;
            const votes = voteMap.get(topic.id) || 0;

            return (
              <Card key={topic.id}>
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="flex flex-col items-center gap-1 text-center min-w-[60px]">
                    <span className="text-lg font-bold">{votes}</span>
                    <span className="text-xs text-muted-foreground">votes</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 text-center min-w-[60px]">
                    <span className="text-lg font-bold text-orange-500">0</span>
                    <span className="text-xs text-muted-foreground">
                      replies
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/forum/post/${topic.slug || topic.id}`}
                      className="font-medium text-gray-900 hover:text-blue-600"
                    >
                      {topic.title}
                    </Link>
                    <div className="mt-1 flex items-center gap-2">
                      {category && (
                        <Badge variant="secondary" className="text-xs">
                          {category.name}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {new Date(topic.date_posted).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
