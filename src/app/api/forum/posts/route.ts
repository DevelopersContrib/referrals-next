import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseId } from "@/lib/api/helpers";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Return categories only
    if (searchParams.get("categoriesOnly") === "true") {
      const categories = await prisma.topic_categories.findMany({
        orderBy: { name: "asc" },
      });
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

    const where: Record<string, unknown> = {};
    if (categoryId) {
      const parsed = parseId(categoryId);
      if (parsed === null) {
        return NextResponse.json({ error: "Category not found" }, { status: 404 });
      }
      where.category_id = parsed;
    }

    const [topics, total] = await Promise.all([
      prisma.topics.findMany({
        where,
        orderBy: { date_posted: "desc" },
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

    // Generate slug from title
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .substring(0, 150);
    const slug = `${baseSlug}-${Date.now()}`;

    const topic = await prisma.topics.create({
      data: {
        title,
        content,
        slug,
        member_id: memberId,
        category_id: category_id || null,
        date_posted: new Date(),
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
