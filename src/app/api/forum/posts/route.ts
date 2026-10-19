import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseId } from "@/lib/api/helpers";
import {
  isAnnouncementsSlug,
  isArchiveSlug,
  listForumCategories,
  publicTopicOrderBy,
  publicTopicWhere,
} from "@/lib/forum";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const memberId = parseInt(session.user.id, 10);

    // Return categories only
    if (searchParams.get("categoriesOnly") === "true") {
      const member = Number.isFinite(memberId)
        ? await prisma.members.findUnique({
            where: { id: memberId },
            select: { is_team: true },
          })
        : null;
      let categories = await listForumCategories({ postableOnly: true });
      if (!member?.is_team) {
        categories = categories.filter((c) => !isAnnouncementsSlug(c.slug));
      }
      return NextResponse.json({ categories });
    }

    // Return single topic by slug
    const slug = searchParams.get("slug");
    if (slug) {
      const topic = await prisma.topics.findFirst({ where: { slug } });
      return NextResponse.json({ topic });
    }

    // List topics with optional filters
    const categoryId = searchParams.get("category_id");
    // parseInt yields NaN for junk like ?page=abc, and NaN survives Math.min /
    // Math.max — it would reach Prisma's skip/take and throw a 500.
    const asInt = (raw: string | null, fallback: number) => {
      const n = parseInt(raw || "", 10);
      return Number.isFinite(n) ? n : fallback;
    };
    const page = Math.max(1, asInt(searchParams.get("page"), 1));
    const limit = Math.min(100, Math.max(1, asInt(searchParams.get("limit"), 20)));
    const offset = (page - 1) * limit;

    const parsedCategoryId = categoryId ? parseId(categoryId) : null;
    if (categoryId && parsedCategoryId === null) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }
    const category = parsedCategoryId
      ? await prisma.topic_categories.findUnique({
          where: { id: parsedCategoryId },
          select: { id: true, is_archived: true },
        })
      : null;

    const where = await publicTopicWhere({
      categoryId: category?.id,
      includeArchive: category?.is_archived,
    });

    const [topics, total] = await Promise.all([
      prisma.topics.findMany({
        where,
        orderBy: publicTopicOrderBy,
        skip: offset,
        take: limit,
      }),
      prisma.topics.count({ where }),
    ]);

    return NextResponse.json({
      topics,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Forum posts GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const memberId = parseInt(session.user.id, 10);
    const body = await request.json();
    const { title, content, category_id } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required." },
        { status: 400 }
      );
    }

    const category =
      category_id != null
        ? await prisma.topic_categories.findUnique({
            where: { id: Number(category_id) },
            select: { id: true, slug: true, is_archived: true },
          })
        : null;

    if (category && isArchiveSlug(category.slug)) {
      return NextResponse.json(
        { error: "The Archive is read-only." },
        { status: 403 }
      );
    }

    if (category && isAnnouncementsSlug(category.slug)) {
      const member = await prisma.members.findUnique({
        where: { id: memberId },
        select: { is_team: true },
      });
      if (!member?.is_team) {
        return NextResponse.json(
          { error: "Only the team can post in Announcements." },
          { status: 403 }
        );
      }
    }

    // Generate slug from title
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .substring(0, 150);
    const slug = `${baseSlug}-${Date.now()}`;
    const now = new Date();

    const topic = await prisma.topics.create({
      data: {
        title,
        content,
        slug,
        member_id: memberId,
        category_id: category?.id ?? null,
        date_posted: now,
        last_activity_at: now,
        status: "open",
      },
    });

    return NextResponse.json({ topic }, { status: 201 });
  } catch (error) {
    console.error("Forum posts POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
