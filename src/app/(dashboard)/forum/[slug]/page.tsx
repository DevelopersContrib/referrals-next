import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default async function ForumCategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const { slug } = await params;

  // Find category by slug
  const category = await prisma.topic_categories.findFirst({
    where: { slug },
  });

  if (!category) {
    return (
      <div className="py-12 text-center">
        <h1 className="text-2xl font-bold">Category Not Found</h1>
        <p className="mt-2 text-muted-foreground">
          The category you are looking for does not exist.
        </p>
        <Link href="/forum" className="mt-4 inline-block text-sm text-blue-600 hover:underline">
          Back to Forum
        </Link>
      </div>
    );
  }

  const topics = await prisma.topics.findMany({
    where: { category_id: category.id },
    orderBy: { date_posted: "desc" },
    take: 50,
  });

  const topicIds = topics.map((t) => t.id);

  const [voteCounts, commentCounts] = await Promise.all([
    prisma.topic_votes.groupBy({
      by: ["topic_id"],
      where: { topic_id: { in: topicIds.length > 0 ? topicIds : [0] } },
      _count: { id: true },
    }),
    prisma.topic_comments.groupBy({
      by: ["topic_id"],
      where: { topic_id: { in: topicIds.length > 0 ? topicIds : [0] } },
      _count: { id: true },
    }),
  ]);

  const voteMap = new Map(voteCounts.map((v) => [v.topic_id, v._count.id]));
  const commentMap = new Map(
    commentCounts.map((c) => [c.topic_id, c._count.id])
  );

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/forum" className="hover:text-gray-900">
            Forum
          </Link>
          <span>/</span>
          <span>{category.name}</span>
        </div>
        <h1 className="mt-2 text-2xl font-bold">{category.name}</h1>
      </div>

      <div className="space-y-3">
        {topics.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No topics in this category yet.
              <Link
                href="/forum/new"
                className="ml-1 text-blue-600 hover:underline"
              >
                Create one
              </Link>
            </CardContent>
          </Card>
        ) : (
          topics.map((topic) => {
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
                      <Badge variant="secondary" className="text-xs">
                        {category.name}
                      </Badge>
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
