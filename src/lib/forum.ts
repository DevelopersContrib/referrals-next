import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PUBLIC_TOPIC_STATUSES } from "@/lib/forum-constants";

export {
  FORUM_CATEGORIES,
  LEGACY_CATEGORY_SLUG_MAP,
  PINNED_TOPIC_SLUGS,
  PUBLIC_TOPIC_STATUSES,
  SEEDED_TOPIC_CATEGORY,
} from "@/lib/forum-constants";

const archivedCategoryCache: { ids: number[] | null } = { ids: null };

export function resetForumCategoryCache() {
  archivedCategoryCache.ids = null;
}

export async function getArchivedCategoryIds(): Promise<number[]> {
  if (archivedCategoryCache.ids) return archivedCategoryCache.ids;
  const rows = await prisma.topic_categories.findMany({
    where: { is_archived: true },
    select: { id: true },
  });
  archivedCategoryCache.ids = rows.map((r) => r.id);
  return archivedCategoryCache.ids;
}

export async function publicTopicWhere(options?: {
  categoryId?: number;
  includeArchive?: boolean;
}): Promise<Prisma.topicsWhereInput> {
  const where: Prisma.topicsWhereInput = {
    status: { in: [...PUBLIC_TOPIC_STATUSES] },
  };

  if (options?.categoryId) {
    where.category_id = options.categoryId;
    return where;
  }

  if (!options?.includeArchive) {
    const archivedIds = await getArchivedCategoryIds();
    if (archivedIds.length > 0) {
      where.OR = [
        { category_id: null },
        { category_id: { notIn: archivedIds } },
      ];
    }
  }

  return where;
}

export const publicTopicOrderBy: Prisma.topicsOrderByWithRelationInput[] = [
  { is_pinned: "desc" },
  { last_activity_at: "desc" },
];

export async function listForumCategories(options?: { postableOnly?: boolean }) {
  const categories = await prisma.topic_categories.findMany({
    orderBy: [{ sort_order: "asc" }, { name: "asc" }],
  });
  if (!options?.postableOnly) return categories;
  return categories.filter((c) => !c.is_archived);
}

export function isAnnouncementsSlug(slug: string | null | undefined) {
  return slug === "announcements";
}

export function isArchiveSlug(slug: string | null | undefined) {
  return slug === "archive";
}

export const FORUM_PAGE_SIZE = 20;

export type ForumTab = "latest" | "top" | "unanswered" | "following";

export function parseForumTab(value: string | null | undefined): ForumTab {
  if (value === "top" || value === "unanswered" || value === "following") {
    return value;
  }
  return "latest";
}

export type ForumTopicListItem = {
  id: number;
  title: string;
  content: string;
  slug: string | null;
  member_id: number | null;
  category_id: number | null;
  date_posted: Date;
  last_activity_at: Date;
  is_pinned: boolean;
  status: string;
  view_count: number;
  voteCount: number;
  replyCount: number;
};

export async function listForumTopics(options: {
  tab?: ForumTab;
  categorySlug?: string | null;
  page?: number;
  memberId?: number | null;
  query?: string | null;
}): Promise<{
  topics: ForumTopicListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  categoryId: number | null;
}> {
  const tab = options.tab ?? "latest";
  const page = Math.max(1, options.page ?? 1);
  const pageSize = FORUM_PAGE_SIZE;
  const skip = (page - 1) * pageSize;
  const query = options.query?.trim() || "";

  let categoryId: number | null = null;
  let includeArchive = false;
  if (options.categorySlug) {
    const category = await prisma.topic_categories.findFirst({
      where: { slug: options.categorySlug },
      select: { id: true, is_archived: true },
    });
    if (category) {
      categoryId = category.id;
      includeArchive = category.is_archived;
    }
  }

  const where = await publicTopicWhere({
    categoryId: categoryId ?? undefined,
    includeArchive,
  });

  if (query) {
    const replyMatches = await prisma.topic_comments.findMany({
      where: { answer: { contains: query } },
      select: { topic_id: true },
      distinct: ["topic_id"],
    });
    const replyTopicIds = replyMatches
      .map((r) => r.topic_id)
      .filter((id): id is number => id != null);
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
      {
        OR: [
          { title: { contains: query } },
          { content: { contains: query } },
          ...(replyTopicIds.length ? [{ id: { in: replyTopicIds } }] : []),
        ],
      },
    ];
  }

  const extraFilters: Prisma.topicsWhereInput[] = [];

  if (tab === "following") {
    if (!options.memberId) {
      return {
        topics: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
        categoryId,
      };
    }
    const follows = await prisma.topic_followers.findMany({
      where: { member_id: options.memberId },
      select: { topic_id: true },
    });
    const followIds = follows.map((f) => f.topic_id);
    if (followIds.length === 0) {
      return {
        topics: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
        categoryId,
      };
    }
    extraFilters.push({ id: { in: followIds } });
  }

  if (tab === "unanswered") {
    const withReplies = await prisma.topic_comments.findMany({
      where: { status: "open" },
      select: { topic_id: true },
      distinct: ["topic_id"],
    });
    const answeredIds = withReplies
      .map((c) => c.topic_id)
      .filter((id): id is number => id != null);
    if (answeredIds.length > 0) {
      extraFilters.push({ id: { notIn: answeredIds } });
    }
  }

  if (extraFilters.length > 0) {
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
      ...extraFilters,
    ];
  }

  const total = await prisma.topics.count({ where });

  let orderedIds: number[] | null = null;
  if (tab === "top") {
    const candidates = await prisma.topics.findMany({
      where,
      select: { id: true, is_pinned: true, view_count: true },
    });
    const voteCounts =
      candidates.length > 0
        ? await prisma.topic_votes.groupBy({
            by: ["topic_id"],
            where: { topic_id: { in: candidates.map((c) => c.id) } },
            _count: { id: true },
          })
        : [];
    const voteMap = new Map(
      voteCounts.map((v) => [v.topic_id, v._count.id]),
    );
    candidates.sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
      const voteDiff = (voteMap.get(b.id) || 0) - (voteMap.get(a.id) || 0);
      if (voteDiff) return voteDiff;
      return b.view_count - a.view_count;
    });
    orderedIds = candidates.slice(skip, skip + pageSize).map((c) => c.id);
  }

  const rows = orderedIds
    ? orderedIds.length === 0
      ? []
      : await prisma.topics.findMany({ where: { id: { in: orderedIds } } })
    : await prisma.topics.findMany({
        where,
        orderBy: publicTopicOrderBy,
        skip,
        take: pageSize,
      });

  const topics =
    orderedIds && orderedIds.length > 0
      ? orderedIds
          .map((id) => rows.find((r) => r.id === id))
          .filter((r): r is (typeof rows)[number] => Boolean(r))
      : rows;

  const topicIds = topics.map((t) => t.id);
  const [voteCounts, commentCounts] = await Promise.all([
    topicIds.length
      ? prisma.topic_votes.groupBy({
          by: ["topic_id"],
          where: { topic_id: { in: topicIds } },
          _count: { id: true },
        })
      : [],
    topicIds.length
      ? prisma.topic_comments.groupBy({
          by: ["topic_id"],
          where: { topic_id: { in: topicIds }, status: "open" },
          _count: { id: true },
        })
      : [],
  ]);
  const voteMap = new Map(voteCounts.map((v) => [v.topic_id, v._count.id]));
  const commentMap = new Map(
    commentCounts.map((c) => [c.topic_id, c._count.id]),
  );

  return {
    topics: topics.map((topic) => ({
      id: topic.id,
      title: topic.title,
      content: topic.content,
      slug: topic.slug,
      member_id: topic.member_id,
      category_id: topic.category_id,
      date_posted: topic.date_posted,
      last_activity_at: topic.last_activity_at,
      is_pinned: topic.is_pinned,
      status: topic.status,
      view_count: topic.view_count,
      voteCount: voteMap.get(topic.id) || 0,
      replyCount: commentMap.get(topic.id) || 0,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    categoryId,
  };
}
