import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdminApi } from "@/lib/require-platform-admin";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const guard = await requirePlatformAdminApi();
    if (!guard.ok)
      return NextResponse.json(
        { error: guard.status === 401 ? "Unauthorized" : "Forbidden" },
        { status: guard.status }
      );

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const search = searchParams.get("search") || "";

    const where = search
      ? {
          OR: [
            { url: { contains: search } },
            { domain: { contains: search } },
          ],
        }
      : {};

    const [brands, total] = await Promise.all([
      prisma.member_urls.findMany({
        where,
        orderBy: { date_added: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.member_urls.count({ where }),
    ]);

    return NextResponse.json({
      brands,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching brands:", error);
    return NextResponse.json(
      { error: "Failed to fetch brands" },
      { status: 500 }
    );
  }
}
