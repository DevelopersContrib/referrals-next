import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TopicVoteButton } from "./vote-button";
import { CommentForm } from "./comment-form";

export default async function TopicDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const { slug } = await params;
  const memberId = parseInt(session.user.id, 10);

  // Find topic by slug
  const topic = await prisma.topics.findFirst({
    where: { slug },
  });

  if (!topic) {
    return (
      <div className="py-12 text-center">
        <h1 className="text-2xl font-bold">Topic Not Found</h1>
        <p className="mt-2 text-muted-foreground">
          The topic you are looking for does not exist.
        </p>
        <Link
          href="/forum"
          className="mt-4 inline-block text-sm text-blue-600 hover:underline"
        >
          Back to Forum
        </Link>
      </div>
    );
  }

  // Record view
  await prisma.topic_views.create({
    data: { topic_id: topic.id, viewed_by: memberId },
  });

  const category = topic.category_id
    ? await prisma.topic_categories.findUnique({
        where: { id: topic.category_id },
      })
    : null;

  const author = topic.member_id
    ? await prisma.members.findUnique({
        where: { id: topic.member_id },
        select: { id: true, name: true },
      })
    : null;

  const [voteCount, comments, viewCount] = await Promise.all([
    prisma.topic_votes.count({ where: { topic_id: topic.id } }),
    prisma.topic_comments.findMany({
      where: { topic_id: topic.id },
      orderBy: { date_posted: "asc" },
    }),
    prisma.topic_views.count({ where: { topic_id: topic.id } }),
  ]);

  // Get comment authors
  const commentAuthorIds = [
    ...new Set(comments.map((c) => c.member_id).filter(Boolean)),
  ] as number[];
  const commentAuthors =
    commentAuthorIds.length > 0
      ? await prisma.members.findMany({
          where: { id: { in: commentAuthorIds } },
          select: { id: true, name: true },
        })
      : [];
  const authorMap = new Map(commentAuthors.map((a) => [a.id, a.name]));

  // Get comment vote counts
  const commentIds = comments.map((c) => c.id);
  const commentVoteCounts =
    commentIds.length > 0
      ? await prisma.topic_comments_votes.groupBy({
          by: ["comment_id"],
          where: { comment_id: { in: commentIds } },
          _count: { id: true },
        })
      : [];
  const commentVoteMap = new Map(
    commentVoteCounts.map((v) => [v.comment_id, v._count.id])
  );

  const isAuthor = topic.member_id === memberId;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/forum" className="hover:text-gray-900">
          Forum
        </Link>
        {category && (
          <>
            <span>/</span>
            <Link
              href={`/forum/${category.slug || category.id}`}
              className="hover:text-gray-900"
            >
              {category.name}
            </Link>
          </>
        )}
      </div>

      {/* Topic */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">{topic.title}</h1>
              <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
                <span>by {author?.name || "Unknown"}</span>
                <span>
                  {new Date(topic.date_posted).toLocaleDateString()}
                </span>
                <span>{viewCount} views</span>
                {category && (
                  <Badge variant="secondary">{category.name}</Badge>
                )}
              </div>
            </div>
            {isAuthor && (
              <Link
                href={`/forum/post/${topic.slug}/edit`}
                className="text-sm text-blue-600 hover:underline"
              >
                Edit
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="whitespace-pre-wrap text-gray-700">
            {topic.content}
          </div>
          <div className="mt-4 flex items-center gap-2">
            <TopicVoteButton topicId={topic.id} voteCount={voteCount} />
          </div>
        </CardContent>
      </Card>

      {/* Comments */}
      <div>
        <h2 className="text-lg font-semibold">
          {comments.length} {comments.length === 1 ? "Reply" : "Replies"}
        </h2>
        <div className="mt-4 space-y-4">
          {comments.map((comment) => (
            <Card key={comment.id}>
              <CardContent className="py-4">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="font-medium text-gray-900">
                    {comment.member_id
                      ? authorMap.get(comment.member_id) || "Unknown"
                      : "Unknown"}
                  </span>
                  <span>
                    {new Date(comment.date_posted).toLocaleDateString()}
                  </span>
                  <span className="text-xs">
                    {commentVoteMap.get(comment.id) || 0} votes
                  </span>
                </div>
                <div className="mt-2 whitespace-pre-wrap text-gray-700">
                  {comment.answer}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Comment Form */}
      <CommentForm topicId={topic.id} />
    </div>
  );
}
