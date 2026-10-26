import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { siteUrl } from "@/lib/site-url";
import { isAnnouncementsSlug } from "@/lib/forum";
import { TopicVoteButton } from "./vote-button";
import { CommentForm } from "./comment-form";
import { ReportButton } from "@/components/forum/report-button";
import { FollowButton } from "@/components/forum/follow-button";
import { AcceptAnswerButton } from "@/components/forum/accept-answer-button";
import { ShareButton } from "@/components/forum/share-button";
import {
  AboutThisTopic,
  ReadyToGoLive,
  RelatedTopics,
  SignInCta,
} from "@/components/forum/topic-sidebar";
import {
  NeedsAnswerBadge,
  TeamBadge,
  needsAnswer,
} from "@/components/forum/badges";
import {
  getPrimaryCheckoutBrand,
  shouldShowBrandPublishCta,
} from "@/lib/member-subscription";

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
          select: { id: true, name: true, is_team: true },
        })
      : [];
  const authorMap = new Map(commentAuthors.map((a) => [a.id, a]));

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

  const related = topic.category_id
    ? await prisma.topics.findMany({
        where: {
          category_id: topic.category_id,
          id: { not: topic.id },
          status: { in: ["open", "answered"] },
        },
        orderBy: { last_activity_at: "desc" },
        take: 5,
        select: { id: true, slug: true, title: true },
      })
    : [];
  const relatedReplyCounts =
    related.length > 0
      ? await prisma.topic_comments.groupBy({
          by: ["topic_id"],
          where: {
            topic_id: { in: related.map((t) => t.id) },
            status: "open",
          },
          _count: { id: true },
        })
      : [];
  const relatedReplyMap = new Map(
    relatedReplyCounts.map((r) => [r.topic_id, r._count.id]),
  );
  const relatedTopics = related.map((t) => ({
    ...t,
    replyCount: relatedReplyMap.get(t.id) ?? 0,
  }));

  // The billing upsell only makes sense for a reader who already has a brand
  // waiting to be published; `shouldShowBrandPublishCta` drops it once that
  // brand is live, so a paying customer is not asked to pay again.
  const checkoutBrand =
    memberId > 0 ? await getPrimaryCheckoutBrand(memberId) : null;
  const showGoLive = checkoutBrand
    ? await shouldShowBrandPublishCta({
        brandId: checkoutBrand.id,
        viewerMemberId: memberId,
        isViewerAdmin: Boolean(viewer?.is_admin),
      })
    : false;

  const otherComments = accepted
    ? comments.filter((c) => c.id !== accepted.id)
    : comments;

  const topicPath = `/forum/post/${topic.slug || topic.id}`;
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
    <div className="mx-auto max-w-6xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground"
      >
        {/* min-h-11 on the links, matching the forum home, so the two
            breadcrumb hops are reachable on a phone without the 20px row
            they sat in before. The padding widens short labels like "Forum",
            which is only 43px of text, and the negative margin cancels it so
            the spacing between hops is unchanged. */}
        <Link
          href="/forum"
          className="-mx-1 inline-flex min-h-11 items-center px-1 hover:text-gray-900"
        >
          Forum
        </Link>
        {category && (
          <>
            <span aria-hidden="true">/</span>
            <Link
              href={`/forum/${category.slug || category.id}`}
              className="-mx-1 inline-flex min-h-11 items-center px-1 hover:text-gray-900"
            >
              {category.name}
            </Link>
          </>
        )}
        <span aria-hidden="true">/</span>
        <span aria-current="page" className="wrap-break-word text-gray-900">
          {topic.title}
        </span>
      </nav>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
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
                {author?.is_team ? <TeamBadge /> : null}
                {topic.is_pinned ? (
                  <Badge className="text-xs">Pinned</Badge>
                ) : null}
                {topic.status === "answered" ? (
                  <Badge variant="secondary" className="text-xs">
                    Answered
                  </Badge>
                ) : null}
                {needsAnswer({
                  status: topic.status,
                  replyCount: openComments.length,
                  is_pinned: topic.is_pinned,
                  date_posted: topic.date_posted,
                  isAnnouncement: isAnnouncementsSlug(category?.slug),
                }) ? (
                  <NeedsAnswerBadge />
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
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {memberId > 0 ? (
                <FollowButton topicId={topic.id} following={following} />
              ) : null}
              <ShareButton url={siteUrl(topicPath)} title={topic.title} />
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
        <Card className="border-green-600 bg-green-50/40">
          <CardHeader>
            <p className="text-sm font-semibold text-green-700">
              Accepted answer
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span className="wrap-break-word font-medium text-gray-900">
                {(accepted.member_id
                  ? authorMap.get(accepted.member_id)?.name
                  : null) || "Unknown"}
              </span>
              {accepted.member_id && authorMap.get(accepted.member_id)?.is_team ? (
                <TeamBadge />
              ) : null}
              <span>{new Date(accepted.date_posted).toLocaleDateString()}</span>
              <span className="text-xs">
                {commentVoteMap.get(accepted.id) || 0} votes
              </span>
            </div>
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
          {comments.length === 0 ? (
            <p className="text-muted-foreground">
              No replies yet. Be the first to answer this question!
            </p>
          ) : null}
          {/* The accepted answer already has its own block above, so it is not
              repeated here. */}
          {otherComments.map((comment) => {
            const commentAuthor = comment.member_id
              ? authorMap.get(comment.member_id)
              : null;
            return (
            <Card key={comment.id}>
              <CardContent className="py-4">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                  <span className="wrap-break-word font-medium text-gray-900">
                    {commentAuthor?.name || "Unknown"}
                  </span>
                  {commentAuthor?.is_team ? <TeamBadge /> : null}
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
            );
          })}
        </div>
      </div>

      {/* Comment Form */}
      <CommentForm
        topicId={topic.id}
        signedIn={memberId > 0}
        callbackPath={topicPath}
      />
        </div>

        <aside className="space-y-6">
          {/* replyCount counts the same list the heading does, so an author
              looking at their own held-for-review reply is not shown
              "1 Reply" beside "Replies 0". */}
          <AboutThisTopic
            askedOn={topic.date_posted}
            lastActivity={topic.last_activity_at}
            viewCount={viewCount}
            replyCount={comments.length}
            categoryName={category?.name ?? null}
            categoryHref={
              category ? `/forum/${category.slug || category.id}` : null
            }
          />
          <RelatedTopics topics={relatedTopics} />
          {memberId > 0 ? (
            showGoLive ? (
              <ReadyToGoLive brandName={checkoutBrand?.domain ?? null} />
            ) : null
          ) : (
            <SignInCta callbackPath={topicPath} />
          )}
        </aside>
      </div>
    </div>
  );
}
