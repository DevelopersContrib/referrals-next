import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePlatformAdminApi } from "@/lib/require-platform-admin";

export async function GET(req: NextRequest) {
  const authResult = await requirePlatformAdminApi();
  if (!authResult.ok) {
    return NextResponse.json(
      { error: authResult.status === 401 ? "Unauthorized" : "Forbidden" },
      { status: authResult.status }
    );
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("limit") || "25", 10))
  );
  const search = (searchParams.get("search") || "").trim();
  const sortBy = searchParams.get("sortBy") || "id";
  const sortDir = searchParams.get("sortDir") === "asc" ? "asc" : "desc";

  const where = search
    ? {
        OR: [
          { domain: { contains: search } },
          { url: { contains: search } },
          {
            member_id: {
              in: (
                await prisma.members.findMany({
                  where: { name: { contains: search } },
                  select: { id: true },
                })
              ).map((m) => m.id),
            },
          },
        ],
      }
    : { member_id: { gt: 0 } };

  const orderBy =
    sortBy === "domain"
      ? { domain: sortDir as "asc" | "desc" }
      : sortBy === "owner"
        ? { member_id: sortDir as "asc" | "desc" }
        : { id: sortDir as "asc" | "desc" };

  try {
    const [brands, total] = await Promise.all([
      prisma.member_urls.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.member_urls.count({ where }),
    ]);

    const memberIds = [...new Set(brands.map((b) => b.member_id))];
    const members = await prisma.members.findMany({
      where: { id: { in: memberIds } },
      select: { id: true, name: true, email: true },
    });
    const memberMap = new Map(members.map((m) => [m.id, m]));

    return NextResponse.json({
      brands: brands.map((brand) => ({
        id: brand.id,
        domain: brand.domain,
        url: brand.url,
        ownerName: memberMap.get(brand.member_id)?.name ?? "Unknown",
        ownerId: brand.member_id,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching all brands:", error);
    return NextResponse.json(
      { error: "Failed to fetch brands" },
      { status: 500 }
    );
  }
}
