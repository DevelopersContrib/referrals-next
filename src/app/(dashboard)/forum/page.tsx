import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function ForumPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const topics = await prisma.topics.findMany({
    orderBy: { date_posted: "desc" },
    take: 30,
  });

  const categories = await prisma.topic_categories.findMany();
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  // Get vote and comment counts for all topics
  const topicIds = topics.map((t) => t.id);

  const [voteCounts, commentCounts] = await Promise.all([
    prisma.topic_votes.groupBy({
      by: ["topic_id"],
      where: { topic_id: { in: topicIds } },
      _count: { id: true },
    }),
    prisma.topic_comments.groupBy({
      by: ["topic_id"],
      where: { topic_id: { in: topicIds } },
      _count: { id: true },
    }),
  ]);

  const voteMap = new Map(voteCounts.map((v) => [v.topic_id, v._count.id]));
  const commentMap = new Map(
    commentCounts.map((c) => [c.topic_id, c._count.id])
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Forum</h1>
          <p className="mt-1 text-muted-foreground">
            Discuss referral marketing, ask questions, and share insights.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/forum/categories">
            <Button variant="outline" size="sm">
              Categories
            </Button>
          </Link>
          <Link href="/forum/unanswered">
            <Button variant="outline" size="sm">
              Unanswered
            </Button>
          </Link>
          <Link href="/forum/activity">
            <Button variant="outline" size="sm">
              Activity
            </Button>
          </Link>
          <Link href="/forum/new">
            <Button size="sm">New Topic</Button>
          </Link>
        </div>
      </div>

      <div className="space-y-3">
        {topics.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No topics yet. Be the first to start a discussion!
            </CardContent>
          </Card>
        ) : (
          topics.map((topic) => {
            const category = topic.category_id
              ? categoryMap.get(topic.category_id)
              : null;
            const votes = voteMap.get(topic.id) || 0;
            const comments = commentMap.get(topic.id) || 0;

            return (
              <Card key={topic.id}>
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="flex flex-col items-center gap-1 text-center min-w-[60px]">
                    <span className="text-lg font-bold">{votes}</span>
                    <span className="text-xs text-muted-foreground">votes</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 text-center min-w-[60px]">
                    <span className="text-lg font-bold">{comments}</span>
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
                        <Link href={`/forum/${category.slug || category.id}`}>
                          <Badge variant="secondary" className="text-xs">
                            {category.name}
                          </Badge>
                        </Link>
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
