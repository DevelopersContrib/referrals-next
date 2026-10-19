import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { siteUrl } from "@/lib/site-url";
import { publicTopicOrderBy, publicTopicWhere } from "@/lib/forum";

export const metadata: Metadata = {
  title: "Community Forum",
  description:
    "Discuss referral marketing, ask questions, and share what is working with other Referrals.com members.",
  alternates: { canonical: siteUrl("/forum") },
};

export default async function ForumPage() {
  const where = await publicTopicWhere();
  const topics = await prisma.topics.findMany({
    where,
    orderBy: publicTopicOrderBy,
    take: 30,
  });

  const categories = await prisma.topic_categories.findMany({
    orderBy: [{ sort_order: "asc" }, { name: "asc" }],
  });
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
    commentCounts.map((c) => [c.topic_id, c._count.id]),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Forum</h1>
          <p className="mt-1 text-muted-foreground">
            Discuss referral marketing, ask questions, and share insights.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="min-h-11"
            render={<Link href="/forum/categories" />}
          >
            Categories
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="min-h-11"
            render={<Link href="/forum/unanswered" />}
          >
            Unanswered
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="min-h-11"
            render={<Link href="/forum/activity" />}
          >
            Activity
          </Button>
          <Button
            size="sm"
            className="min-h-11"
            render={<Link href="/forum/new" />}
          >
            New Topic
          </Button>
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
                <CardContent className="flex flex-col gap-3 py-4 lg:flex-row lg:items-center lg:gap-4">
                  <div className="flex gap-6 lg:gap-4">
                    <div className="flex flex-col items-center gap-1 text-center min-w-[60px]">
                      <span className="text-lg font-bold">{votes}</span>
                      <span className="text-xs text-muted-foreground">
                        votes
                      </span>
                    </div>
                    <div className="flex flex-col items-center gap-1 text-center min-w-[60px]">
                      <span className="text-lg font-bold">{comments}</span>
                      <span className="text-xs text-muted-foreground">
                        replies
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/forum/post/${topic.slug || topic.id}`}
                      className="block wrap-break-word font-medium text-gray-900 hover:text-blue-600"
                    >
                      {topic.title}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      {topic.is_pinned ? (
                        <Badge className="text-xs">Pinned</Badge>
                      ) : null}
                      {category && (
                        <Link href={`/forum/${category.slug || category.id}`}>
                          <Badge variant="secondary" className="text-xs">
                            {category.name}
                          </Badge>
                        </Link>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {new Date(topic.last_activity_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        Older threads from 2019–2021 have moved to the{" "}
        <Link href="/forum/archive" className="text-blue-600 hover:underline">
          Archive
        </Link>
        .
      </p>
    </div>
  );
}
