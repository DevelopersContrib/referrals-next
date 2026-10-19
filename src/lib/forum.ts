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
