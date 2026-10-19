import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { siteUrl } from "@/lib/site-url";
import { TopicVoteButton } from "./vote-button";
import { CommentForm } from "./comment-form";
import { ReportButton } from "@/components/forum/report-button";
import { FollowButton } from "@/components/forum/follow-button";
import { AcceptAnswerButton } from "@/components/forum/accept-answer-button";

function metaDescription(text: string | null | undefined) {
  return (text || "Referrals.com forum discussion.")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 155);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const topic = await prisma.topics.findFirst({
    where: { slug },
    select: { title: true, content: true, status: true, category_id: true },
  });
  const category = topic?.category_id
    ? await prisma.topic_categories.findUnique({
        where: { id: topic.category_id },
        select: { is_archived: true },
      })
    : null;
  const noindex =
    !topic ||
    topic.status === "pending" ||
    topic.status === "hidden" ||
    Boolean(category?.is_archived);
  return {
    title: topic?.title || "Forum Topic",
    description: metaDescription(topic?.content),
    alternates: { canonical: siteUrl(`/forum/post/${slug}`) },
    robots: noindex ? { index: false, follow: true } : undefined,
  };
}

export default async function TopicDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await auth();
  const { slug } = await params;
  const memberId = session?.user?.id ? parseInt(session.user.id, 10) : 0;

  // Find topic by slug
  const topic = await prisma.topics.findFirst({
    where: { slug },
  });

  const viewer = memberId
    ? await prisma.members.findUnique({
        where: { id: memberId },
        select: { is_team: true, is_admin: true },
      })
    : null;
  const canModerate = Boolean(viewer?.is_team || viewer?.is_admin);
  const isAuthor = memberId > 0 && topic?.member_id === memberId;
  const isPublic = topic && (topic.status === "open" || topic.status === "answered");

  if (!topic || (!isPublic && !isAuthor && !canModerate)) {
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

  // Record view and bump the denormalized count used by the Top tab
  await prisma.topic_views.create({
    data: { topic_id: topic.id, viewed_by: memberId },
  });
  await prisma.topics.update({
    where: { id: topic.id },
    data: { view_count: { increment: 1 } },
  });

  const category = topic.category_id
    ? await prisma.topic_categories.findUnique({
        where: { id: topic.category_id },
      })
    : null;

  const author = topic.member_id
    ? await prisma.members.findUnique({
        where: { id: topic.member_id },
        select: { id: true, name: true, is_team: true },
      })
    : null;

  const following =
    memberId > 0
      ? Boolean(
          await prisma.topic_followers.findUnique({
            where: {
              topic_id_member_id: { topic_id: topic.id, member_id: memberId },
            },
          }),
        )
      : false;
  const canAccept = isAuthor || canModerate;

  const [voteCount, comments, viewCount] = await Promise.all([
    prisma.topic_votes.count({ where: { topic_id: topic.id } }),
    prisma.topic_comments.findMany({
      where: {
        topic_id: topic.id,
        OR: [
          { status: "open" },
          ...(memberId ? [{ member_id: memberId }] : []),
        ],
      },
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
    commentVoteCounts.map((v) => [v.comment_id, v._count.id]),
  );

  const openComments = comments.filter((c) => c.status === "open");
  const accepted = topic.accepted_comment_id
    ? comments.find((c) => c.id === topic.accepted_comment_id)
    : null;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "QAPage",
    mainEntity: {
      "@type": "Question",
      name: topic.title,
      text: metaDescription(topic.content),
      answerCount: openComments.length,
      ...(accepted?.answer
        ? {
            acceptedAnswer: {
              "@type": "Answer",
              text: accepted.answer,
            },
          }
        : {}),
    },
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="wrap-break-word text-2xl font-bold">{topic.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span className="wrap-break-word">
                  by {author?.name || "Unknown"}
                </span>
                {author?.is_team ? (
                  <Badge className="bg-[#7C3AED] text-xs text-white">TEAM</Badge>
                ) : null}
                {topic.is_pinned ? (
                  <Badge className="text-xs">Pinned</Badge>
                ) : null}
                {topic.status === "answered" ? (
                  <Badge variant="secondary" className="text-xs">
                    Answered
                  </Badge>
                ) : null}
                <span>{new Date(topic.date_posted).toLocaleDateString()}</span>
                <span>{viewCount} views</span>
                {category && (
                  <Badge variant="secondary" className="max-w-full wrap-break-word">
                    {category.name}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {memberId > 0 ? (
                <FollowButton topicId={topic.id} following={following} />
              ) : null}
            {isAuthor && (
              <Link
                href={`/forum/post/${topic.slug}/edit`}
                className="shrink-0 text-sm text-blue-600 hover:underline"
              >
                Edit
              </Link>
            )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="whitespace-pre-wrap wrap-break-word text-gray-700">
            {topic.content}
          </div>
          <div className="mt-4 flex items-center gap-3">
            <TopicVoteButton topicId={topic.id} voteCount={voteCount} />
            {memberId > 0 ? <ReportButton topicId={topic.id} /> : null}
          </div>
          {topic.status === "pending" ? (
            <p className="mt-3 text-sm text-amber-700">
              This post is waiting for approval and is not public yet.
            </p>
          ) : null}
        </CardContent>
      </Card>

      {accepted?.answer ? (
        <Card className="border-green-600">
          <CardHeader>
            <p className="text-sm font-medium text-green-700">Accepted answer</p>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap wrap-break-word text-gray-700">
              {accepted.answer}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Comments */}
      <div>
        <h2 className="text-lg font-semibold">
          {comments.length} {comments.length === 1 ? "Reply" : "Replies"}
        </h2>
        <div className="mt-4 space-y-4">
          {comments.map((comment) => (
            <Card key={comment.id}>
              <CardContent className="py-4">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                  <span className="wrap-break-word font-medium text-gray-900">
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
                <div className="mt-2 whitespace-pre-wrap wrap-break-word text-gray-700">
                  {comment.answer}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  {comment.status === "pending" ? (
                    <span className="text-xs text-amber-700">
                      Waiting for approval
                    </span>
                  ) : null}
                  {memberId > 0 ? (
                    <ReportButton topicId={topic.id} commentId={comment.id} />
                  ) : null}
                  {canAccept &&
                  comment.status === "open" &&
                  topic.accepted_comment_id !== comment.id ? (
                    <AcceptAnswerButton
                      topicId={topic.id}
                      commentId={comment.id}
                    />
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Comment Form */}
      <CommentForm topicId={topic.id} signedIn={memberId > 0} callbackPath={`/forum/post/${topic.slug || topic.id}`} />
    </div>
  );
}
