/**
 * JJ2 — Upsert forum categories, archive 2019–2021 threads, pin two topics.
 * Safe to re-run. Requires JJ1 SQL (forum_redesign_schema.sql) first.
 *
 *   npx tsx scripts/forum-jj2-categories.ts
 */
import { PrismaClient } from "@prisma/client";
import {
  FORUM_CATEGORIES,
  LEGACY_CATEGORY_SLUG_MAP,
  PINNED_TOPIC_SLUGS,
  SEEDED_TOPIC_CATEGORY,
} from "../src/lib/forum-constants";

const prisma = new PrismaClient();

async function main() {
  const categoryIds = new Map<string, number>();

  for (const category of FORUM_CATEGORIES) {
    const existing = await prisma.topic_categories.findFirst({
      where: { slug: category.slug },
      select: { id: true },
    });
    const row = existing
      ? await prisma.topic_categories.update({
          where: { id: existing.id },
          data: {
            name: category.name,
            description: category.description,
            sort_order: category.sort_order,
            is_archived: category.is_archived,
          },
          select: { id: true, slug: true },
        })
      : await prisma.topic_categories.create({
          data: {
            name: category.name,
            slug: category.slug,
            description: category.description,
            sort_order: category.sort_order,
            is_archived: category.is_archived,
          },
          select: { id: true, slug: true },
        });
    categoryIds.set(category.slug, row.id);
    console.log(`category #${row.id}  ${row.slug}`);
  }

  for (const [oldSlug, newSlug] of Object.entries(LEGACY_CATEGORY_SLUG_MAP)) {
    const oldRow = await prisma.topic_categories.findFirst({
      where: { slug: oldSlug },
      select: { id: true },
    });
    const newId = categoryIds.get(newSlug);
    if (!oldRow || !newId || oldRow.id === newId) continue;
    const moved = await prisma.topics.updateMany({
      where: { category_id: oldRow.id },
      data: { category_id: newId },
    });
    console.log(`remap  ${oldSlug} → ${newSlug}  (${moved.count} topics)`);
  }

  for (const [slug, categorySlug] of Object.entries(SEEDED_TOPIC_CATEGORY)) {
    const categoryId = categoryIds.get(categorySlug);
    if (!categoryId) continue;
    const updated = await prisma.topics.updateMany({
      where: { slug },
      data: { category_id: categoryId },
    });
    if (updated.count) console.log(`map    ${slug} → ${categorySlug}`);
  }

  const archiveId = categoryIds.get("archive");
  if (archiveId) {
    const archived = await prisma.topics.updateMany({
      where: {
        date_posted: {
          gte: new Date("2019-01-01T00:00:00.000Z"),
          lt: new Date("2022-01-01T00:00:00.000Z"),
        },
      },
      data: { category_id: archiveId },
    });
    console.log(`archive 2019–2021  ${archived.count} topics`);
  }

  const pinned = await prisma.topics.updateMany({
    where: { slug: { in: [...PINNED_TOPIC_SLUGS] } },
    data: { is_pinned: true },
  });
  console.log(`pinned ${pinned.count}`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "JJ2 categories failed");
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
